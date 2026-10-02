import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { findCapture } from "../src/data/reuse";
import type { CapturesFile } from "../src/data/types";
import { VIEW_IDS, VIEWS } from "../src/data/views";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BASE = process.env.VITE_BASE ?? "/";
const JS_BUDGET = 100 * 1024;
const IMAGE_BUDGET = 1.5 * 1024 * 1024;

const html = readFileSync(join(DIST, "index.html"), "utf8");
const scripts = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
].map((match) => match[1].slice(BASE.length));
const jsBytes = scripts.reduce(
  (total, path) => total + gzipSync(readFileSync(join(DIST, path))).length,
  0,
);

const data = JSON.parse(readFileSync(join(ROOT, "src/data/captures.json"), "utf8")) as CapturesFile;

console.log(
  `Initial JS: ${(jsBytes / 1024).toFixed(1)} KB gzipped (budget ${JS_BUDGET / 1024} KB)`,
);
let over = jsBytes > JS_BUDGET;
for (const view of VIEW_IDS) {
  const [first] = VIEWS[view];
  const firstPaint = (["before", "after"] as const).flatMap((version) => {
    const capture = findCapture(data, first, version, "desktop");
    return [
      capture.tiles[0].avif,
      ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
    ];
  });
  const imageBytes = firstPaint.reduce((total, path) => total + statSync(join(DIST, path)).size, 0);
  console.log(
    `First-paint images (${view}): ${(imageBytes / 1024 / 1024).toFixed(2)} MB (budget ${IMAGE_BUDGET / 1024 / 1024} MB)`,
  );
  if (imageBytes > IMAGE_BUDGET) over = true;
}
if (over) process.exitCode = 1;
