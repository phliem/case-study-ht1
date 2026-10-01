import { describe, expect, it } from "vitest";
import { cyclesWithin, planLoop } from "./loopPlan";

describe("cyclesWithin", () => {
  it("counts whole cycles that fit within the allowed stretch", () => {
    expect(cyclesWithin(2, 10.2, 0.05)).toBe(5);
    expect(cyclesWithin(10.2, 10.2, 0.05)).toBe(1);
  });

  it("refuses a period that would need stretching too far", () => {
    expect(cyclesWithin(2.6, 7, 0.05)).toBeNull();
  });
});

describe("planLoop", () => {
  it("keeps the hero reel's 10.2s and slows its 2s pulse a little", () => {
    const plan = planLoop([10.2, 2], 10.2);
    expect(plan.length).toBeCloseTo(10.2, 9);
    expect(plan.rates[0]).toBeCloseTo(1, 9);
    expect(plan.rates[1]).toBeCloseTo(10 / 10.2, 9);
  });

  it("grows the loop until every animation completes whole cycles", () => {
    const plan = planLoop([7, 2.6, 0.95], 7);
    expect(plan.length).toBeCloseTo(21, 9);
    expect(plan.rates[0]).toBeCloseTo(1, 9);
    expect(plan.rates[1]).toBeCloseTo((8 * 2.6) / 21, 9);
    expect(plan.rates[2]).toBeCloseTo((22 * 0.95) / 21, 9);
  });

  it("gives up loudly when no loop fits", () => {
    expect(() => planLoop([7, 3.3], 7, 0.05, 4)).toThrow("No seamless loop");
  });
});
