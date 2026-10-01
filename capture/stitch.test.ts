import { describe, expect, it } from "vitest";
import { tileBands, viewportStops } from "./stitch";

describe("tileBands", () => {
  it("cuts a page into bands, the last one shorter", () => {
    expect(tileBands(4500, 2000)).toEqual([
      { top: 0, height: 2000 },
      { top: 2000, height: 2000 },
      { top: 4000, height: 500 },
    ]);
  });
});

describe("viewportStops", () => {
  it("covers the page exactly once without scrolling past the end", () => {
    const stops = viewportStops(2000, 900);
    expect(stops).toEqual([
      { scrollY: 0, sliceTop: 0, sliceHeight: 900, pageTop: 0 },
      { scrollY: 900, sliceTop: 0, sliceHeight: 900, pageTop: 900 },
      { scrollY: 1100, sliceTop: 700, sliceHeight: 200, pageTop: 1800 },
    ]);
    const covered = stops.reduce((total, stop) => total + stop.sliceHeight, 0);
    expect(covered).toBe(2000);
  });

  it("takes a single stop for a page shorter than the viewport", () => {
    expect(viewportStops(600, 900)).toEqual([
      { scrollY: 0, sliceTop: 0, sliceHeight: 600, pageTop: 0 },
    ]);
  });
});
