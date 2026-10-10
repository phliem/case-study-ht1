import { clamp, lerp, smoothstep } from "../lib/math";
import type { Point } from "./layout";

export type NextEdge = { start: Point; pointAt: (fraction: number) => Point };

export type CursorPose = {
  position: Point;
  opacity: number;
  ripple: { opacity: number; scale: number } | null;
  travelling: boolean;
};

const AT_BUTTON = 750;
const OFF_BUTTON = 1100;
const ON_EDGE = 1350;
const ALONG_EDGE = 950;
const TAP = 1000;
const RIPPLE = 600;
const FADE_FROM = 1600;
const FADE = 500;
export const PAUSED_AT = 1000;

const between = (from: Point, to: Point, t: number): Point => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

export function cursorPose(
  elapsed: number,
  from: Point,
  button: Point,
  next: NextEdge | null,
): CursorPose {
  const tapped = elapsed - TAP;
  const ripple =
    next && tapped > 0 && tapped < RIPPLE
      ? { opacity: 1 - tapped / RIPPLE, scale: 0.4 + (tapped / RIPPLE) * 1.1 }
      : null;
  if (elapsed < AT_BUTTON) {
    return {
      position: between(from, button, smoothstep(elapsed / AT_BUTTON)),
      opacity: 1,
      ripple,
      travelling: false,
    };
  }
  if (!next) {
    return {
      position: button,
      opacity: clamp(1 - (elapsed - FADE_FROM) / FADE, 0, 1),
      ripple,
      travelling: false,
    };
  }
  if (elapsed < OFF_BUTTON) return { position: button, opacity: 1, ripple, travelling: false };
  if (elapsed < ON_EDGE) {
    const t = smoothstep((elapsed - OFF_BUTTON) / (ON_EDGE - OFF_BUTTON));
    return { position: between(button, next.start, t), opacity: 1, ripple, travelling: false };
  }
  const t = smoothstep(clamp((elapsed - ON_EDGE) / ALONG_EDGE, 0, 1));
  return { position: next.pointAt(t), opacity: 1, ripple, travelling: true };
}
