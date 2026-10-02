import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import sharp, { type OverlayOptions } from "sharp";
import type {
  Capture,
  MeasuredTokens,
  PageId,
  PinnedLayer,
  PinnedState,
  Tile,
  Version,
} from "../src/data/types";
import {
  addSpecimenInPage,
  floatingElementsInPage,
  headerBlurInPage,
  headerPaintAtInPage,
  markStickyHeaderInPage,
  measureTokensInPage,
  pauseInfiniteAnimationsInPage,
  scrollInPage,
  sectionTopsInPage,
  settleInPage,
  type TokenSelectors,
} from "./inPage";
import { captureLoops } from "./loops";
import { captureDir, PUBLIC_DIR, publicPath } from "./paths";
import { type DeviceProfile, SCALE, SOCS_REJECTED, TILE_HEIGHT } from "./profiles";
import { anchorList, assertSections } from "./sections";
import { tileBands, viewportStops } from "./stitch";

export type RawImage = {
  data: Buffer;
  info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
};

export type PageJob = {
  page: PageId;
  version: Version;
  commit: string;
  url: string;
  profile: DeviceProfile;
  withLoops: boolean;
  withSpecimen: boolean;
};

export type CaptureResult = { capture: Capture; tokens: MeasuredTokens };

const HIDDEN_SELECTORS = [".phone-help-bubble", ".cookie-banner-ssr"];

const CAPTURE_CSS = [
  `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
  "[data-capture-hidden] { visibility: hidden !important; }",
  "* { caret-color: transparent !important; }",
].join("\n");

const TOKEN_SELECTORS: Record<Version, TokenSelectors> = {
  before: {
    headline: "main h1",
    heroGround: "main > section:first-of-type",
    search: "main > section:first-of-type .rounded-2xl",
    card: "main > section:nth-of-type(3) article > div:last-child",
  },
  after: {
    headline: "main h1",
    heroGround: "main > section:first-of-type",
    search: '[class*="shadow-ui-search-pill-hero"]',
    card: "main figure",
  },
};

function isolateCss(selector: string): string {
  return [
    "html, body { background: transparent !important; }",
    "body * { visibility: hidden !important; }",
    `${selector}, ${selector} * { visibility: visible !important; }`,
  ].join("\n");
}

async function openPage(
  browser: Browser,
  url: string,
  profile: DeviceProfile,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: SCALE,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    userAgent: profile.userAgent,
    locale: "en-GB",
    timezoneId: "Europe/London",
    reducedMotion: "no-preference",
  });
  // tsx compiles with esbuild's keepNames, which wraps functions in __name(); functions sent to
  // page.evaluate carry those calls, so the page needs the helper defined.
  await context.addInitScript({ content: "globalThis.__name = (target) => target;" });
  await context.addInitScript({
    content: `localStorage.setItem("SOCS", ${JSON.stringify(SOCS_REJECTED)}); localStorage.removeItem("wglang");`,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CAPTURE_CSS });
  return { context, page };
}

async function captureTiles(
  page: Page,
  outDir: string,
): Promise<{ tiles: Tile[]; pageHeight: number; full: RawImage }> {
  const { pageHeight, viewportHeight, width } = await page.evaluate(() => ({
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    width: document.documentElement.clientWidth,
  }));
  const composites: OverlayOptions[] = [];
  for (const stop of viewportStops(pageHeight, viewportHeight)) {
    await page.evaluate(scrollInPage, stop.scrollY);
    const input = await page.screenshot({
      clip: { x: 0, y: stop.sliceTop, width, height: stop.sliceHeight },
      caret: "hide",
    });
    composites.push({ input, top: stop.pageTop * SCALE, left: 0 });
  }
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

  const tiles: Tile[] = [];
  for (const [index, band] of tileBands(pageHeight, TILE_HEIGHT).entries()) {
    const name = `tile-${String(index).padStart(2, "0")}`;
    const region = sharp(full.data, { raw: full.info }).extract({
      left: 0,
      top: band.top * SCALE,
      width: width * SCALE,
      height: band.height * SCALE,
    });
    const avif = join(outDir, `${name}.avif`);
    const webp = join(outDir, `${name}.webp`);
    await region.clone().avif({ quality: 62, effort: 6 }).toFile(avif);
    await region.clone().webp({ quality: 86, effort: 6 }).toFile(webp);
    tiles.push({
      avif: publicPath(avif),
      webp: publicPath(webp),
      top: band.top,
      height: band.height,
    });
  }
  return { tiles, pageHeight, full };
}

async function shootHeader(
  page: Page,
  path: string,
): Promise<{ height: number; blur: number | null }> {
  const header = page.locator("header").first();
  await header.screenshot({ path, omitBackground: true, caret: "hide" });
  const box = await header.boundingBox();
  if (!box) throw new Error("The header has no box to measure");
  return { height: Math.round(box.height), blur: await page.evaluate(headerBlurInPage) };
}

async function captureHeaderStates(page: Page, outDir: string): Promise<PinnedState[]> {
  await page.evaluate(() =>
    document.querySelector("header")?.removeAttribute("data-capture-hidden"),
  );
  const isolation = await page.addStyleTag({ content: isolateCss("header") });
  const atTop = await page.evaluate(headerPaintAtInPage, 0);
  const top = join(outDir, "header-top.png");
  const topShot = await shootHeader(page, top);
  let flipAt: number | null = null;
  for (const y of [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
    if ((await page.evaluate(headerPaintAtInPage, y)) !== atTop) {
      flipAt = y;
      break;
    }
  }
  if (flipAt === null) throw new Error("The sticky header kept its paint for 256px of scrolling");
  const scrolled = join(outDir, "header-scrolled.png");
  const scrolledShot = await shootHeader(page, scrolled);
  await isolation.evaluate((node) => {
    node.parentNode?.removeChild(node);
  });
  return [
    { from: 0, src: publicPath(top), height: topShot.height, blur: null },
    {
      from: flipAt,
      src: publicPath(scrolled),
      height: scrolledShot.height,
      blur: scrolledShot.blur,
    },
  ];
}

async function captureSpecimen(page: Page): Promise<void> {
  await page.evaluate(addSpecimenInPage);
  const isolation = await page.addStyleTag({ content: isolateCss("#capture-specimen") });
  await page.locator("#capture-specimen").screenshot({
    path: join(PUBLIC_DIR, "captures/specimen-frutiger.png"),
    omitBackground: true,
  });
  await isolation.evaluate((node) => {
    node.parentNode?.removeChild(node);
  });
}

export async function capturePage(browser: Browser, job: PageJob): Promise<CaptureResult> {
  const { context, page } = await openPage(browser, job.url, job.profile);
  try {
    await page.evaluate(settleInPage);
    await page.evaluate(pauseInfiniteAnimationsInPage);
    const sections = assertSections(
      await page.evaluate(sectionTopsInPage, anchorList(job.version)),
    );
    const tokens = await page.evaluate(measureTokensInPage, TOKEN_SELECTORS[job.version]);
    const sticky = await page.evaluate(markStickyHeaderInPage);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements: ${floating.join(", ")}. Add them to HIDDEN_SELECTORS in capture/shoot.ts.`,
      );
    }
    const outDir = captureDir(job.page, job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const { tiles, pageHeight, full } = await captureTiles(page, outDir);
    const loops = job.withLoops ? await captureLoops(page, job.profile.device, outDir, full) : [];
    const pinned: PinnedLayer[] = sticky
      ? [
          {
            id: "header",
            x: 0,
            y: 0,
            width: job.profile.viewport.width,
            stickTop: 0,
            releaseAt: pageHeight,
            states: await captureHeaderStates(page, outDir),
          },
        ]
      : [];
    if (job.withSpecimen) await captureSpecimen(page);
    return {
      capture: {
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
        pinned,
        loops,
      },
      tokens,
    };
  } finally {
    await context.close();
  }
}
