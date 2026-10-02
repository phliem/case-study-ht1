import { describe, expect, it } from "vitest";
import type { PinnedLayer } from "../src/data/types";
import { checkScrolls, type PinnedBox, shotScroll } from "./pinnedPlan";

const HEADER: PinnedBox = { x: 0, y: 0, width: 1440, stickTop: 0, releaseAt: 3772, zIndex: 50 };
const CONTENTS: PinnedBox = {
  x: 1100,
  y: 500,
  width: 250,
  stickTop: 120,
  releaseAt: 2400,
  zIndex: 0,
};

function layerOf(box: PinnedBox, height: number): PinnedLayer {
  const { x, y, width, stickTop, releaseAt } = box;
  return {
    id: "layer",
    x,
    y,
    width,
    stickTop,
    releaseAt,
    states: [{ from: 0, src: "layer.png", height, blur: null }],
  };
}

describe("shotScroll", () => {
  it("shoots each header look where it starts", () => {
    expect(shotScroll(HEADER, [0, 1], 0, 2872)).toBe(0);
    expect(shotScroll(HEADER, [0, 1], 1, 2872)).toBe(1);
  });

  it("waits until a layer has stuck, so the whole of it is in view", () => {
    expect(shotScroll(CONTENTS, [0, 900, 1500], 0, 4000)).toBe(380);
    expect(shotScroll(CONTENTS, [0, 900, 1500], 1, 4000)).toBe(900);
    expect(shotScroll(CONTENTS, [0, 900, 1500], 2, 4000)).toBe(1500);
  });

  it("stays inside a look that ends before the layer sticks", () => {
    expect(shotScroll(CONTENTS, [0, 200], 0, 4000)).toBe(199);
  });

  it("never scrolls past the end of the page", () => {
    expect(shotScroll(CONTENTS, [0, 4100], 1, 4000)).toBe(4000);
  });
});

describe("checkScrolls", () => {
  it("probes either side of sticking and of letting go", () => {
    const bar = layerOf({ ...CONTENTS, y: 400, stickTop: 67, releaseAt: 3000 }, 46);
    expect(checkScrolls(bar, 4000)).toEqual([0, 332, 373, 1610, 2927, 4000]);
  });

  it("keeps every probe on the page and drops repeats", () => {
    expect(checkScrolls(layerOf(HEADER, 67), 2872)).toEqual([0, 40, 1853, 2872]);
  });
});
