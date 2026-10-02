import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSectionMap } from "../lib/sectionMap";
import { CAPTURES, captureFor } from "./captures";
import { PAGE_IDS, sectionIds } from "./pages";
import { isReused } from "./reuse";

const PUBLIC = join(import.meta.dirname, "../../public");
const VERSIONS = ["before", "after"] as const;
const DEVICES = ["desktop", "mobile"] as const;

describe("captures.json", () => {
  it("names the page of every capture", () => {
    expect(CAPTURES.captures.filter((capture) => capture.page === undefined)).toEqual([]);
  });

  it("points only at files that exist", () => {
    const paths = CAPTURES.captures.flatMap((capture) => [
      ...capture.tiles.flatMap((tile) => [tile.avif, tile.webp]),
      ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
      ...capture.loops.flatMap((loop) => [loop.mp4, loop.webm]),
    ]);
    paths.push(CAPTURES.specimens.frutiger);
    expect(paths.filter((path) => !existsSync(join(PUBLIC, path)))).toEqual([]);
  });

  it("groups every capture by its page's groups", () => {
    for (const capture of CAPTURES.captures) {
      expect(capture.sections.map((section) => section.id)).toEqual(sectionIds(capture.page));
    }
  });

  it("stores one capture for every side that is shot, and none for a reused side", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        for (const device of DEVICES) {
          const matches = CAPTURES.captures.filter(
            (capture) =>
              capture.page === page && capture.version === version && capture.device === device,
          );
          expect(matches.length, `${page} ${version} ${device}`).toBe(
            isReused(page, version) ? 0 : 1,
          );
        }
      }
    }
  });

  it("answers for every comparison, version and device, with the same object each time", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        for (const device of DEVICES) {
          const capture = captureFor(page, version, device);
          expect([capture.page, capture.version, capture.device]).toEqual([page, version, device]);
          expect(capture.sections.map((section) => section.id)).toEqual(sectionIds(page));
          expect(captureFor(page, version, device)).toBe(capture);
        }
      }
    }
  });

  it("maps the 2025 homepage onto v2 on both devices, holding it still through Areas", () => {
    for (const device of DEVICES) {
      const after = captureFor("home-2025", "after", device);
      const before = captureFor("home-2025", "before", device);
      const map = createSectionMap(after, before, after.viewport.height);
      const areas = after.sections.findIndex((section) => section.id === "areas");
      const start = after.sections[areas].top;
      const end = after.sections[areas + 1].top;
      const scrollAt = (anchor: number) => (anchor / after.pageHeight) * map.maxScrollA;
      expect(map.groupAt(scrollAt(start + 20))).toBe("areas");
      expect(map.mapScroll(scrollAt(end - 20))).toBeCloseTo(map.mapScroll(scrollAt(start + 20)), 6);
    }
  });

  it("starts every pinned layer's first look at the top and the rest in order", () => {
    for (const capture of CAPTURES.captures) {
      for (const layer of capture.pinned) {
        const froms = layer.states.map((state) => state.from);
        expect(froms[0]).toBe(0);
        expect(froms).toEqual([...froms].sort((a, b) => a - b));
      }
    }
  });
});
