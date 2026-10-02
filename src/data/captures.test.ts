import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTURES } from "./captures";

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
});
