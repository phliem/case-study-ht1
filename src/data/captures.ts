import data from "./captures.json";
import type { Capture, CapturesFile, Device, Version } from "./types";

export const CAPTURES = data as CapturesFile;

export function captureFor(version: Version, device: Device): Capture {
  const capture = CAPTURES.captures.find(
    (entry) => entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`There is no ${version} capture for ${device}`);
  return capture;
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
