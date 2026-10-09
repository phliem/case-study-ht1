import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import sharp from "sharp";
import type { Device, Loop, Rect } from "../src/data/types";
import {
  type LoopRegionQuery,
  markLoopRegionInPage,
  scrollRegionIntoViewInPage,
  seekLoopInPage,
} from "./inPage";
import { planLoop } from "./loopPlan";
import { publicPath, WORK_DIR } from "./paths";
import { meanAbsoluteDifference } from "./pixels";
import { FPS, SCALE } from "./profiles";
import type { RawImage } from "./shoot";

const HOW_PANELS: LoopRegionQuery[] = [0, 1, 2].map((index) => ({
  id: `how-${index + 1}`,
  scopeHeading: "How to register and book with an NHS GP",
  selector: 'li > div[aria-hidden="true"]',
  index,
  radius: "parent-top",
}));

export const LOOP_REGIONS: Record<Device, readonly LoopRegionQuery[]> = {
  desktop: [
    {
      id: "hero",
      scopeHeading: null,
      selector: "main > section:first-of-type",
      index: 0,
      radius: "self",
    },
    ...HOW_PANELS,
  ],
  mobile: HOW_PANELS,
};

const MAX_FRAME_DIFFERENCE = 1.5;

function encodeLoop(framesDir: string, mp4: string, webm: string) {
  const input = [
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    join(framesDir, "frame-%04d.png"),
  ];
  const color = [
    "-vf",
    "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "iec61966-2-1",
    "-color_range",
    "tv",
  ];
  execFileSync(
    "ffmpeg",
    [
      ...input,
      ...color,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "18",
      "-movflags",
      "+faststart",
      "-an",
      mp4,
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    "ffmpeg",
    [
      ...input,
      ...color,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "30",
      "-row-mt",
      "1",
      "-an",
      webm,
    ],
    { stdio: "inherit" },
  );
}

async function assertFrameMatchesStill(framePath: string, full: RawImage, rect: Rect) {
  const frame = await sharp(framePath).removeAlpha().raw().toBuffer();
  const still = await sharp(full.data, { raw: full.info })
    .extract({
      left: rect.x * SCALE,
      top: rect.y * SCALE,
      width: rect.width * SCALE,
      height: rect.height * SCALE,
    })
    .removeAlpha()
    .raw()
    .toBuffer();
  const difference = meanAbsoluteDifference(frame, still);
  if (difference > MAX_FRAME_DIFFERENCE) {
    throw new Error(
      `${framePath} differs from the still under it by ${difference.toFixed(2)} (allowed ${MAX_FRAME_DIFFERENCE})`,
    );
  }
}

async function captureLoop(
  page: Page,
  region: LoopRegionQuery,
  device: Device,
  outDir: string,
  full: RawImage,
): Promise<Loop> {
  const found = await page.evaluate(markLoopRegionInPage, region);
  const plan = planLoop(found.periods, Math.max(...found.periods));
  const frames = Math.round(plan.length * FPS);
  const framesDir = join(WORK_DIR, "frames", `${device}-${region.id}`);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const viewportY = await page.evaluate(scrollRegionIntoViewInPage, found.rect);
  console.log(`  ${region.id}: ${frames} frames, a ${plan.length.toFixed(2)}s loop`);
  for (let frame = 0; frame < frames; frame++) {
    await page.evaluate(seekLoopInPage, { seconds: frame / FPS, rates: plan.rates });
    await page.screenshot({
      path: join(framesDir, `frame-${String(frame).padStart(4, "0")}.png`),
      clip: { x: found.rect.x, y: viewportY, width: found.rect.width, height: found.rect.height },
      caret: "hide",
    });
  }
  await assertFrameMatchesStill(join(framesDir, "frame-0000.png"), full, found.rect);
  const mp4 = join(outDir, `loop-${region.id}.mp4`);
  const webm = join(outDir, `loop-${region.id}.webm`);
  encodeLoop(framesDir, mp4, webm);
  rmSync(framesDir, { recursive: true, force: true });
  await page.evaluate(seekLoopInPage, { seconds: 0, rates: plan.rates });
  return {
    id: region.id,
    rect: found.rect,
    radius: found.radius,
    mp4: publicPath(mp4),
    webm: publicPath(webm),
    duration: plan.length,
  };
}

export async function captureLoops(
  page: Page,
  device: Device,
  outDir: string,
  full: RawImage,
): Promise<Loop[]> {
  const loops: Loop[] = [];
  for (const region of LOOP_REGIONS[device]) {
    loops.push(await captureLoop(page, region, device, outDir, full));
  }
  return loops;
}
