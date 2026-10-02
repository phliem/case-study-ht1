import data from "./captures.json";
import { findCapture } from "./reuse";
import type { Capture, CapturesFile, Device, PageId, Version } from "./types";

export const CAPTURES = data as CapturesFile;

const FOUND = new Map<string, Capture>();

export function captureFor(page: PageId, version: Version, device: Device): Capture {
  const key = `${page} ${version} ${device}`;
  const known = FOUND.get(key);
  if (known) return known;
  const capture = findCapture(CAPTURES, page, version, device);
  FOUND.set(key, capture);
  return capture;
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
