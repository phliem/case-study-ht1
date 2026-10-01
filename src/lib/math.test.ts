import { describe, expect, it } from "vitest";
import { clamp, easeInOutCubic, lerp } from "./math";

describe("clamp", () => {
  it("holds a value inside its bounds", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});

describe("lerp", () => {
  it("runs from the start to the end as t runs from 0 to 1", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerp(10, 20, 1)).toBe(20);
  });
});

describe("easeInOutCubic", () => {
  it("starts at 0, passes the middle at 0.5 and ends at 1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("never goes backwards", () => {
    let previous = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      const value = easeInOutCubic(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});
