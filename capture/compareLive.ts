import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import type { CapturesFile } from "../src/data/types";
import { DATA_FILE, PUBLIC_DIR, ROOT } from "./paths";
import { SCALE, SOCS_REJECTED } from "./profiles";

const LIVE_URL = "https://bookable.health";
const GAP = 40;

async function main() {
  const file = JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile;
  const after = file.captures.find(
    (capture) => capture.version === "after" && capture.device === "desktop",
  );
  if (!after) throw new Error("There is no after capture for desktop");
  const { width, height } = after.viewport;

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
    const page = await context.newPage();
    await page.goto(LIVE_URL, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: ".phone-help-bubble { display: none !important; }" });
    await page.waitForTimeout(1500);
    const live = await page.screenshot();
    const captured = await sharp(join(PUBLIC_DIR, after.tiles[0].webp))
      .extract({ left: 0, top: 0, width: width * SCALE, height: height * SCALE })
      .png()
      .toBuffer();
    const out = join(ROOT, ".capture");
    mkdirSync(out, { recursive: true });
    const target = join(out, "live-vs-capture.png");
    await sharp({
      create: {
        width: width * SCALE * 2 + GAP,
        height: height * SCALE,
        channels: 4,
        background: "#061528",
      },
    })
      .composite([
        { input: live, left: 0, top: 0 },
        { input: captured, left: width * SCALE + GAP, top: 0 },
      ])
      .png()
      .toFile(target);
    console.log(`Wrote ${target}: the live site on the left, the capture on the right`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
