import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTURES } from "./captures";
import { PAGE_IDS, sectionIds } from "./pages";

const PUBLIC = join(import.meta.dirname, "../../public");

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

  it("holds before and after, desktop and mobile, for every page", () => {
    for (const page of PAGE_IDS) {
      for (const version of ["before", "after"] as const) {
        for (const device of ["desktop", "mobile"] as const) {
          const matches = CAPTURES.captures.filter(
            (capture) =>
              capture.page === page && capture.version === version && capture.device === device,
          );
          expect(matches.length, `${page} ${version} ${device}`).toBe(1);
        }
      }
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
