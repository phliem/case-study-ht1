import { describe, expect, it } from "vitest";
import { nextDividerValue } from "./dividerKeys";

describe("nextDividerValue", () => {
  it("steps 5% with the arrow keys", () => {
    expect(nextDividerValue(0.5, "ArrowRight", false)).toBeCloseTo(0.55, 6);
    expect(nextDividerValue(0.5, "ArrowLeft", false)).toBeCloseTo(0.45, 6);
    expect(nextDividerValue(0.5, "ArrowUp", false)).toBeCloseTo(0.55, 6);
    expect(nextDividerValue(0.5, "ArrowDown", false)).toBeCloseTo(0.45, 6);
  });

  it("steps 20% with Shift held", () => {
    expect(nextDividerValue(0.5, "ArrowRight", true)).toBeCloseTo(0.7, 6);
    expect(nextDividerValue(0.5, "ArrowLeft", true)).toBeCloseTo(0.3, 6);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextDividerValue(0.5, "Home", false)).toBe(0);
    expect(nextDividerValue(0.5, "End", false)).toBe(1);
  });

  it("stays between 0 and 1", () => {
    expect(nextDividerValue(0.98, "ArrowRight", false)).toBe(1);
    expect(nextDividerValue(0.1, "ArrowLeft", true)).toBe(0);
  });

  it("ignores other keys", () => {
    expect(nextDividerValue(0.5, "a", false)).toBeNull();
    expect(nextDividerValue(0.5, "Enter", false)).toBeNull();
  });
});
