import { describe, expect, it } from "vitest";
import { screenOf } from "./flow";
import { boardSize, curvePath, edgeCurve, pointOnCurve, screenBox } from "./layout";
import { REGISTRATION_FLOW } from "./registrationFlow";

const screen = (id: string) => screenOf(REGISTRATION_FLOW, id);

describe("screenBox", () => {
  it("places a main-row screen in its column", () => {
    expect(screenBox(screen("practice"))).toEqual({
      x: 70,
      y: 70,
      width: 180,
      height: 280,
      centreX: 160,
      middleY: 210,
      bottom: 462,
      button: { x: 160, y: 324 },
    });
  });

  it("places a branch screen smaller, centred in its column on the lower row", () => {
    expect(screenBox(screen("outside"))).toEqual({
      x: 705,
      y: 590,
      width: 150,
      height: 233,
      centreX: 780,
      middleY: 706.5,
      bottom: 935,
      button: { x: 780, y: 797 },
    });
  });
});

describe("boardSize", () => {
  it("fits every column and both rows", () => {
    expect(boardSize(REGISTRATION_FLOW.screens)).toEqual({ width: 2490, height: 1005 });
  });

  it("drops the lower row when no screen branches", () => {
    expect(boardSize([screen("practice"), screen("postcode")])).toEqual({
      width: 630,
      height: 532,
    });
  });
});

describe("edgeCurve", () => {
  it("runs straight between screens on the same row", () => {
    expect(edgeCurve(screen("postcode"), screen("about"))).toEqual([
      { x: 560, y: 210 },
      { x: 625, y: 210 },
      { x: 625, y: 210 },
      { x: 690, y: 210 },
    ]);
  });

  it("drops from the main row into the side of a branch screen", () => {
    expect(edgeCurve(screen("postcode"), screen("outside"))).toEqual([
      { x: 560, y: 210 },
      { x: 697.75, y: 210 },
      { x: 567.25, y: 706.5 },
      { x: 705, y: 706.5 },
    ]);
  });

  it("climbs from a branch screen into the foot of a main-row screen", () => {
    expect(edgeCurve(screen("abroad"), screen("health"))).toEqual([
      { x: 1475, y: 706.5 },
      { x: 1525, y: 706.5 },
      { x: 1710, y: 706.5 },
      { x: 1710, y: 462 },
    ]);
  });
});

describe("pointOnCurve", () => {
  it("starts and ends on the curve's end points", () => {
    const curve = edgeCurve(screen("postcode"), screen("outside"));
    expect(pointOnCurve(curve, 0)).toEqual(curve[0]);
    expect(pointOnCurve(curve, 1)).toEqual(curve[3]);
  });

  it("finds the middle of a straight run", () => {
    expect(pointOnCurve(edgeCurve(screen("postcode"), screen("about")), 0.5)).toEqual({
      x: 625,
      y: 210,
    });
  });
});

describe("curvePath", () => {
  it("draws the curve as one cubic segment", () => {
    expect(curvePath(edgeCurve(screen("postcode"), screen("about")))).toBe(
      "M 560 210 C 625 210, 625 210, 690 210",
    );
  });
});
