import { describe, expect, it } from "vitest";
import { cursorPose, PAUSED_AT } from "./cursor";

const FROM = { x: 0, y: 0 };
const BUTTON = { x: 100, y: 200 };
const NEXT = {
  start: { x: 300, y: 200 },
  pointAt: (fraction: number) => ({ x: 300 + fraction * 100, y: 200 }),
};

describe("cursorPose", () => {
  it("glides from where it was to the screen's button", () => {
    expect(cursorPose(0, FROM, BUTTON, NEXT).position).toEqual(FROM);
    expect(cursorPose(375, FROM, BUTTON, NEXT).position).toEqual({ x: 50, y: 100 });
    expect(cursorPose(750, FROM, BUTTON, NEXT).position).toEqual(BUTTON);
  });

  it("rests on the button while paused", () => {
    expect(cursorPose(PAUSED_AT, FROM, BUTTON, NEXT)).toEqual({
      position: BUTTON,
      opacity: 1,
      ripple: null,
      travelling: false,
    });
  });

  it("taps the button with a fading, growing ripple", () => {
    const ripple = cursorPose(1300, FROM, BUTTON, NEXT).ripple;
    expect(ripple?.opacity).toBeCloseTo(0.5, 10);
    expect(ripple?.scale).toBeCloseTo(0.95, 10);
    expect(cursorPose(1700, FROM, BUTTON, NEXT).ripple).toBeNull();
  });

  it("then follows the edge to the next screen", () => {
    expect(cursorPose(1225, FROM, BUTTON, NEXT).position).toEqual({ x: 200, y: 200 });
    expect(cursorPose(1825, FROM, BUTTON, NEXT)).toMatchObject({
      position: { x: 350, y: 200 },
      travelling: true,
    });
    expect(cursorPose(9000, FROM, BUTTON, NEXT).position).toEqual({ x: 400, y: 200 });
  });

  it("fades out on the last screen without tapping", () => {
    expect(cursorPose(1300, FROM, BUTTON, null)).toEqual({
      position: BUTTON,
      opacity: 1,
      ripple: null,
      travelling: false,
    });
    expect(cursorPose(1850, FROM, BUTTON, null).opacity).toBe(0.5);
    expect(cursorPose(2500, FROM, BUTTON, null).opacity).toBe(0);
  });
});
