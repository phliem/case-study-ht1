import { PAGE_IDS } from "../src/data/pages";
import type { Capture, CapturesFile, Device, Version } from "../src/data/types";

export type HomeExtras = Omit<CapturesFile, "captures">;

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

export function mergeCaptures(
  existing: CapturesFile | null,
  fresh: readonly Capture[],
  extras: HomeExtras | null,
): CapturesFile {
  const side = (capture: Capture) => `${capture.page} ${capture.version}`;
  const replaced = new Set(fresh.map(side));
  const pool = [
    ...(existing?.captures ?? []).filter((capture) => !replaced.has(side(capture))),
    ...fresh,
  ];
  const captures: Capture[] = [];
  for (const page of PAGE_IDS) {
    for (const version of VERSIONS) {
      for (const device of DEVICES) {
        const matches = pool.filter(
          (capture) =>
            capture.page === page && capture.version === version && capture.device === device,
        );
        if (matches.length !== 1) {
          throw new Error(
            `captures.json would have ${matches.length} ${page} ${version} ${device} captures; capture ${page} as well`,
          );
        }
        captures.push(matches[0]);
      }
    }
  }
  const kept: HomeExtras | null = existing
    ? {
        tokens: existing.tokens,
        palettes: existing.palettes,
        radiusScale: existing.radiusScale,
        specimens: existing.specimens,
      }
    : null;
  const rest = extras ?? kept;
  if (!rest) {
    throw new Error(
      "The homepage's tokens and palettes come from a homepage capture; capture home as well",
    );
  }
  return {
    captures,
    tokens: rest.tokens,
    palettes: rest.palettes,
    radiusScale: rest.radiusScale,
    specimens: rest.specimens,
  };
}
