import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { CapturesFile } from "../src/data/types";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BASE = process.env.VITE_BASE ?? "/";
const JS_BUDGET = 110 * 1024;
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
const firstPaint = data.captures
  .filter((capture) => capture.page === "home" && capture.device === "desktop")
  .flatMap((capture) => [
    capture.tiles[0].avif,
    ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
  ]);
const imageBytes = firstPaint.reduce((total, path) => total + statSync(join(DIST, path)).size, 0);

console.log(
  `Initial JS: ${(jsBytes / 1024).toFixed(1)} KB gzipped (budget ${JS_BUDGET / 1024} KB)`,
);
console.log(
  `First-paint images: ${(imageBytes / 1024 / 1024).toFixed(2)} MB (budget ${IMAGE_BUDGET / 1024 / 1024} MB)`,
);
if (jsBytes > JS_BUDGET || imageBytes > IMAGE_BUDGET) process.exitCode = 1;
