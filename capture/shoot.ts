import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import sharp, { type OverlayOptions } from "sharp";
import type { Capture, MeasuredTokens, PageId, SectionId, Tile, Version } from "../src/data/types";
import { recordedAt, serveApiFromFixtures, takeMissingFixtures } from "./apiFixtures";
import { CAPTURE_CSS, isolateCss } from "./css";
import {
  addSpecimenInPage,
  floatingElementsInPage,
  footerBoxInPage,
  hidePinnedInPage,
  mastheadInPage,
  measureTokensInPage,
  pauseInfiniteAnimationsInPage,
  replaceFooterInPage,
  scrollInPage,
  sectionTopsInPage,
  settleInPage,
  type TokenSelectors,
} from "./inPage";
import { captureLoops } from "./loops";
import type { PinnedQuery } from "./pages";
import { captureDir, PUBLIC_DIR, publicPath } from "./paths";
import { checkPinned, planPinned, shootPinned } from "./pinned";
import { type DeviceProfile, SCALE, SOCS_REJECTED, TILE_HEIGHT } from "./profiles";
import { resolveSections, type SectionAnchor } from "./sections";
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
  anchors: [SectionId, SectionAnchor][];
  pinned: readonly PinnedQuery[];
  unstick: readonly string[];
  footer: SwapImage | null;
  masthead: SwapImage | null;
  tokens: TokenSelectors | null;
  withLoops: boolean;
  withSpecimen: boolean;
};

// Captures must not count as visits in Bookable's analytics.
const ANALYTICS =
  /^https:\/\/([^/]+\.)?(posthog\.com|one-less-task\.bookable\.health|googletagmanager\.com|google-analytics\.com)\//;

export type SwapImage = { image: Buffer; height: number };

export type CaptureResult = { capture: Capture; tokens: MeasuredTokens | null };

export async function openPage(
  browser: Browser,
  pageId: PageId,
  url: string,
  profile: DeviceProfile,
  unstick: readonly string[],
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
  await context.route(ANALYTICS, (route) => route.abort());
  await serveApiFromFixtures(context, pageId);
  await context.clock.setFixedTime(recordedAt(pageId));
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CAPTURE_CSS });
  if (unstick.length > 0) {
    await page.addStyleTag({ content: `${unstick.join(", ")} { position: static !important; }` });
  }
  return { context, page };
}

async function captureTiles(
  page: Page,
  outDir: string,
  overlays: readonly OverlayOptions[],
): Promise<{ tiles: Tile[]; pageHeight: number; full: RawImage }> {
  const { pageHeight, viewportHeight, width } = await page.evaluate(() => ({
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    width: document.documentElement.clientWidth,
  }));
  const composites: OverlayOptions[] = [];
  for (const stop of viewportStops(pageHeight, viewportHeight)) {
    await page.evaluate(scrollInPage, stop.scrollY);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements at scroll ${stop.scrollY}px: ${floating.join(", ")}. Pin them in capture/pages.ts or hide them in capture/css.ts.`,
      );
    }
    const input = await page.screenshot({
      clip: { x: 0, y: stop.sliceTop, width, height: stop.sliceHeight },
      caret: "hide",
    });
    composites.push({ input, top: stop.pageTop * SCALE, left: 0 });
  }
  composites.push(...overlays);
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

  const tiles = await writeTiles(full, pageHeight, width, outDir);
  return { tiles, pageHeight, full };
}

export async function writeTiles(
  full: RawImage,
  pageHeight: number,
  width: number,
  outDir: string,
): Promise<Tile[]> {
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
  return tiles;
}

export async function shootFooter(
  browser: Browser,
  url: string,
  profile: DeviceProfile,
): Promise<SwapImage> {
  const { context, page } = await openPage(browser, "home", url, profile, []);
  try {
    await page.evaluate(settleInPage);
    const box = await page.evaluate(footerBoxInPage);
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    const image = await page.screenshot({
      clip: { x: 0, y: box.top, width, height: box.height },
      fullPage: true,
      caret: "hide",
    });
    return { image, height: box.height };
  } finally {
    await context.close();
  }
}

export async function shootMasthead(
  browser: Browser,
  pageId: PageId,
  url: string,
  profile: DeviceProfile,
): Promise<SwapImage> {
  const { context, page } = await openPage(browser, pageId, url, profile, []);
  try {
    await page.evaluate(settleInPage);
    const height = await page.evaluate(mastheadInPage, null);
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    const image = await page.screenshot({ clip: { x: 0, y: 0, width, height }, caret: "hide" });
    return { image, height };
  } finally {
    await context.close();
  }
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
  const { context, page } = await openPage(browser, job.page, job.url, job.profile, job.unstick);
  try {
    await page.evaluate(settleInPage);
    const missing = takeMissingFixtures();
    if (missing.length > 0) {
      throw new Error(
        `These API calls have no fixture (writes always need one):\n${missing.join("\n")}`,
      );
    }
    await page.evaluate(pauseInfiniteAnimationsInPage);
    if (job.footer) await page.evaluate(replaceFooterInPage, job.footer.height);
    if (job.masthead) await page.evaluate(mastheadInPage, job.masthead.height);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = resolveSections(
      job.page,
      await page.evaluate(sectionTopsInPage, job.anchors),
      pageHeight,
    );
    const tokens =
      job.tokens === null ? null : await page.evaluate(measureTokensInPage, job.tokens);
    const plans = await planPinned(page, job.pinned);
    await page.evaluate(hidePinnedInPage);
    const outDir = captureDir(job.page, job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const overlays: OverlayOptions[] = [];
    if (job.masthead) overlays.push({ input: job.masthead.image, top: 0, left: 0 });
    if (job.footer) {
      const { top } = await page.evaluate(footerBoxInPage);
      overlays.push({ input: job.footer.image, top: top * SCALE, left: 0 });
    }
    const { tiles, full, pageHeight: tiledHeight } = await captureTiles(page, outDir, overlays);
    if (tiledHeight !== pageHeight) {
      throw new Error(
        `The page changed from ${pageHeight}px to ${tiledHeight}px while it was shot`,
      );
    }
    const loops = job.withLoops ? await captureLoops(page, job.profile.device, outDir, full) : [];
    const pinned = await shootPinned(page, plans, outDir);
    await checkPinned(page, pinned);
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
