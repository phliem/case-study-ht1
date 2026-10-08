import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Page, Request } from "@playwright/test";
import sharp, { type OverlayOptions } from "sharp";
import { sectionIds } from "../src/data/pages";
import type { Capture, Device, PageId, SectionId, Version } from "../src/data/types";
import { API_ORIGIN, corsHeaders, recordedAt, takeMissingFixtures } from "./apiFixtures";
import { CAPTURE_CSS } from "./css";
import { footerBoxInPage, replaceFooterInPage } from "./inPage";
import { captureDir, ROOT } from "./paths";
import { type DeviceProfile, SCALE } from "./profiles";
import { resolveSections } from "./sections";
import { openPage, type RawImage, type SwapImage, writeTiles } from "./shoot";

export type StubAnswer = { status?: number; json?: unknown };

export type FlowContext = {
  page: Page;
  base: string;
  device: Device;
  now: Date;
  stub(method: string, path: RegExp, answer: (request: Request) => StubAnswer): Promise<void>;
  shot(section: SectionId, caption: string, options?: { fullPage?: boolean }): Promise<void>;
};

export type FlowScript = (flow: FlowContext) => Promise<void>;

export type FlowJob = {
  page: PageId;
  version: Version;
  commit: string;
  baseUrl: string;
  profile: DeviceProfile;
  script: FlowScript;
  footer: SwapImage | null;
};

type Shot = { section: SectionId; caption: string; image: Buffer; height: number };

const DEBUG_DIR = join(ROOT, ".capture/flow-debug");
const BAND_FONT = join(
  ROOT,
  "node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2",
);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bandHtml(caption: string, gutter: number): string {
  const [label, ...rest] = caption.split(" · ");
  const font = readFileSync(BAND_FONT).toString("base64");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
@font-face { font-family: Band; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 700; }
html, body { margin: 0; background: #061528; }
#band { box-sizing: border-box; height: 56px; padding: 0 ${gutter}px; display: flex; align-items: center; gap: 12px;
  font: 700 15px/1 Band, system-ui, sans-serif; color: #f0f4f5; white-space: nowrap; overflow: hidden; }
#band b { flex: none; padding: 6px 10px; border-radius: 999px; background: #6ee7b7; color: #061528; font-size: 13px; letter-spacing: 0.02em; }
#band span { overflow: hidden; text-overflow: ellipsis; color: #a8b8c8; }
</style></head><body><div id="band"><b>${escapeHtml(label)}</b><span>${escapeHtml(rest.join(" · "))}</span></div></body></html>`;
}

// Paints the NHS footer over the placeholder that stands in for the v2 one, cropped to the part
// of it the screenshot shows.
async function paintFooter(
  page: Page,
  image: Buffer,
  footer: SwapImage,
  fullPage: boolean,
): Promise<Buffer> {
  const box = await page.evaluate(footerBoxInPage);
  const scrollY = fullPage ? 0 : await page.evaluate(() => window.scrollY);
  const { height = 0 } = await sharp(image).metadata();
  const top = (box.top - scrollY) * SCALE;
  const visibleTop = Math.max(0, top);
  const visibleBottom = Math.min(height, top + footer.height * SCALE);
  if (visibleBottom <= visibleTop) return image;
  const piece = await sharp(footer.image)
    .extract({
      left: 0,
      top: visibleTop - top,
      width: (await sharp(footer.image).metadata()).width ?? 0,
      height: visibleBottom - visibleTop,
    })
    .toBuffer();
  return sharp(image)
    .composite([{ input: piece, top: visibleTop, left: 0 }])
    .png()
    .toBuffer();
}

// A flow is shot as one tall page: each step's screenshot under a band naming the page or step,
// so the stage scrolls through the journey the way it scrolls through a page.
export async function captureFlow(browser: Browser, job: FlowJob): Promise<Capture> {
  const { context, page } = await openPage(browser, job.page, "about:blank", job.profile, []);
  const shots: Shot[] = [];
  const debug = process.env.CAPTURE_FLOW_DEBUG === "1";
  const debugName = `${job.page}-${job.version}-${job.profile.device}`;
  if (debug) {
    mkdirSync(DEBUG_DIR, { recursive: true });
    page.on("console", (message) => {
      if (message.type() === "error") console.log(`  console: ${message.text().slice(0, 300)}`);
    });
    page.on("request", (request) => {
      if (request.url().startsWith(API_ORIGIN) && request.method() !== "OPTIONS") {
        console.log(`  ${request.method()} ${request.url().slice(0, 140)}`);
      }
    });
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) console.log(`  -> ${frame.url().slice(0, 140)}`);
    });
  }
  const flow: FlowContext = {
    page,
    base: job.baseUrl,
    device: job.profile.device,
    now: recordedAt(job.page),
    async stub(method, path, answer) {
      await context.route(
        (url) => url.origin === API_ORIGIN && path.test(url.pathname + url.search),
        async (route) => {
          const request = route.request();
          if (request.method() !== method) {
            await route.fallback();
            return;
          }
          const { status = 200, json } = answer(request);
          await route.fulfill({
            status,
            headers: { ...corsHeaders(request), "content-type": "application/json" },
            body: json === undefined ? "" : JSON.stringify(json),
          });
        },
      );
    },
    async shot(section, caption, options = {}) {
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.addStyleTag({ content: CAPTURE_CSS });
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return document.fonts.ready.then(() => undefined);
      });
      await page.waitForTimeout(500);
      const missing = takeMissingFixtures();
      if (missing.length > 0) {
        throw new Error(`These API calls have no fixture or stub:\n${missing.join("\n")}`);
      }
      const fullPage = options.fullPage ?? false;
      const hasFooter =
        job.footer !== null &&
        (await page.evaluate(() => {
          const main = document.querySelector("main");
          return Array.from(document.querySelectorAll("footer")).some(
            (footer) =>
              main !== null &&
              !main.contains(footer) &&
              Boolean(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING),
          );
        }));
      if (job.footer && hasFooter) await page.evaluate(replaceFooterInPage, job.footer.height);
      let image = await page.screenshot({ fullPage, caret: "hide", animations: "disabled" });
      if (job.footer && hasFooter) image = await paintFooter(page, image, job.footer, fullPage);
      const { height } = await sharp(image).metadata();
      shots.push({ section, caption, image, height: Math.round((height ?? 0) / SCALE) });
      if (debug) {
        writeFileSync(join(DEBUG_DIR, `${debugName}-${shots.length}.png`), image);
      }
    },
  };

  try {
    try {
      await job.script(flow);
    } catch (error) {
      if (debug) await page.screenshot({ path: join(DEBUG_DIR, `${debugName}-failed.png`) });
      throw error;
    }

    const width = job.profile.viewport.width;
    const bandPage = await context.newPage();
    await bandPage.setViewportSize(job.profile.viewport);
    const composites: OverlayOptions[] = [];
    const firstTop = new Map<SectionId, number>();
    let top = 0;
    for (const shot of shots) {
      await bandPage.setContent(bandHtml(shot.caption, width < 768 ? 16 : 24));
      const band = await bandPage.locator("#band").screenshot();
      if (!firstTop.has(shot.section)) firstTop.set(shot.section, top);
      composites.push({ input: band, top: top * SCALE, left: 0 });
      top += 56;
      composites.push({ input: shot.image, top: top * SCALE, left: 0 });
      top += shot.height;
    }
    const pageHeight = top;
    const { data, info } = await sharp({
      create: {
        width: width * SCALE,
        height: pageHeight * SCALE,
        channels: 4,
        background: "#ffffff",
      },
    })
      .composite(composites)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const full: RawImage = {
      data,
      info: { width: info.width, height: info.height, channels: info.channels },
    };
    const outDir = captureDir(job.page, job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const tiles = await writeTiles(full, pageHeight, width, outDir);
    const sections = resolveSections(
      job.page,
      sectionIds(job.page).map((id) => ({ id, top: firstTop.get(id) ?? null })),
      pageHeight,
    );
    return {
      page: job.page,
      version: job.version,
      device: job.profile.device,
      commit: job.commit,
      capturedAt: new Date().toISOString(),
      viewport: job.profile.viewport,
      scale: SCALE,
      pageHeight,
      tiles,
      sections,
      pinned: [],
      loops: [],
    };
  } finally {
    await context.close();
  }
}
