import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Device, PageId, Version } from "../src/data/types";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const PUBLIC_DIR = join(ROOT, "public");
export const DATA_FILE = join(ROOT, "src/data/captures.json");
export const WORK_DIR = process.env.CAPTURE_WORK_DIR ?? join(tmpdir(), "bookable-before-after");

export function captureDir(page: PageId, version: Version, device: Device): string {
  return join(PUBLIC_DIR, "captures", page, version, device);
}

export function publicPath(file: string): string {
  return relative(PUBLIC_DIR, file).split(sep).join("/");
}
