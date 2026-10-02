import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { PAGES } from "../src/data/pages";
import type { CapturesFile, PageId } from "../src/data/types";
import { pinnedStateIndex, pinnedTop } from "../src/lib/pinned";
import { parseCaptureArgs } from "./args";
import { HIDDEN_SELECTORS } from "./css";
import { DATA_FILE, PUBLIC_DIR, ROOT } from "./paths";
import { SCALE, SOCS_REJECTED } from "./profiles";

const LIVE_URL = "https://bookable.health";
const GAP = 40;

async function capturedTop(
  file: CapturesFile,
  page: PageId,
): Promise<{ image: Buffer; width: number; height: number }> {
  const after = file.captures.find(
    (capture) =>
      capture.page === page && capture.version === "after" && capture.device === "desktop",
  );
  if (!after) throw new Error(`There is no ${page} after capture for desktop`);
  const { width, height } = after.viewport;
  const layers = after.pinned.map((layer) => ({
    input: join(PUBLIC_DIR, layer.states[pinnedStateIndex(layer, 0)].src),
    left: Math.round(layer.x * SCALE),
    top: Math.round(pinnedTop(layer, 0) * SCALE),
  }));
  const tile = await sharp(join(PUBLIC_DIR, after.tiles[0].webp))
    .composite(layers)
    .png()
    .toBuffer();
  const image = await sharp(tile)
    .extract({ left: 0, top: 0, width: width * SCALE, height: height * SCALE })
    .png()
    .toBuffer();
  return { image, width, height };
}

async function liveTop(page: PageId, width: number, height: number): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: SCALE,
      locale: "en-GB",
    });
    await context.addInitScript({
      content: `localStorage.setItem("SOCS", ${JSON.stringify(SOCS_REJECTED)});`,
    });
    const tab = await context.newPage();
    await tab.goto(`${LIVE_URL}${PAGES[page].route.after}`, { waitUntil: "networkidle" });
    await tab.addStyleTag({
      content: `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
    });
    await tab.waitForTimeout(1500);
    return await tab.screenshot();
  } finally {
    await browser.close();
  }
}

async function main() {
  const { pages } = parseCaptureArgs(process.argv.slice(2));
  const file = JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile;
  const out = join(ROOT, ".capture");
  mkdirSync(out, { recursive: true });
  for (const page of pages) {
    const captured = await capturedTop(file, page);
    const live = await liveTop(page, captured.width, captured.height);
    const target = join(out, `live-vs-capture-${page}.png`);
    await sharp({
      create: {
        width: captured.width * SCALE * 2 + GAP,
        height: captured.height * SCALE,
        channels: 4,
        background: "#061528",
      },
    })
      .composite([
        { input: live, left: 0, top: 0 },
        { input: captured.image, left: captured.width * SCALE + GAP, top: 0 },
      ])
      .png()
      .toFile(target);
    console.log(`Wrote ${target}: the live ${page} page on the left, the capture on the right`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
