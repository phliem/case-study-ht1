import { describe, expect, it } from "vitest";
import { centreOn, fitCamera, lerpCamera, MAX_ZOOM, MIN_ZOOM, zoomAround } from "./camera";
import { screenOf } from "./flow";
import { screenBox } from "./layout";
import { REGISTRATION_FLOW } from "./registrationFlow";

const BOARD = { width: 2490, height: 1005 };

describe("fitCamera", () => {
  it("fits the board's width with a margin and centres it below the controls", () => {
    const camera = fitCamera({ width: 1440, height: 855 }, BOARD);
    const zoom = 1360 / 2490;
    expect(camera.zoom).toBeCloseTo(zoom, 10);
    expect(camera.x).toBeCloseTo(40, 10);
    expect(camera.y).toBeCloseTo(80 + (775 - 1005 * zoom) / 2, 10);
  });

  it("fits a short window by its height", () => {
    const camera = fitCamera({ width: 2400, height: 600 }, BOARD);
    expect(camera.zoom).toBeCloseTo(470 / 1005, 10);
    expect(camera.x).toBeCloseTo((2400 - BOARD.width * camera.zoom) / 2, 10);
  });

  it("never enlarges the board past its own size", () => {
    expect(fitCamera({ width: 4000, height: 3000 }, BOARD)).toEqual({
      x: 755,
      y: 80 + (2920 - 1005) / 2,
      zoom: 1,
    });
  });
});

describe("zoomAround", () => {
  it("keeps the point under the anchor still", () => {
    expect(zoomAround({ x: 100, y: 50, zoom: 0.5 }, 2, { x: 400, y: 300 })).toEqual({
      x: -200,
      y: -200,
      zoom: 1,
    });
  });

  it("stops at the closest and furthest zoom", () => {
    expect(zoomAround({ x: 0, y: 0, zoom: 2.4 }, 1.2, { x: 0, y: 0 }).zoom).toBe(MAX_ZOOM);
    expect(zoomAround({ x: 0, y: 0, zoom: 0.22 }, 1 / 1.2, { x: 0, y: 0 }).zoom).toBe(MIN_ZOOM);
  });

  it("never zooms in when zooming out from below the furthest zoom", () => {
    expect(zoomAround({ x: 0, y: 0, zoom: 0.12 }, 1 / 1.2, { x: 0, y: 0 }).zoom).toBe(0.12);
  });
});

describe("centreOn", () => {
  it("brings a screen and its text to the middle of the viewport at the same zoom", () => {
    const box = screenBox(screenOf(REGISTRATION_FLOW, "practice"));
    expect(centreOn({ x: 0, y: 0, zoom: 0.5 }, box, { width: 1000, height: 800 })).toEqual({
      x: 420,
      y: 267,
      zoom: 0.5,
    });
  });
});

describe("lerpCamera", () => {
  it("moves every part of the camera together", () => {
    expect(lerpCamera({ x: 0, y: 10, zoom: 1 }, { x: 100, y: 30, zoom: 2 }, 0.5)).toEqual({
      x: 50,
      y: 20,
      zoom: 1.5,
    });
  });
});
