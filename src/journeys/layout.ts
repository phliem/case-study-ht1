import type { FlowScreen } from "./flow";

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

export type ScreenBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  centreX: number;
  middleY: number;
  bottom: number;
  button: Point;
};

export type Curve = readonly [Point, Point, Point, Point];

const PAD = 70;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 280;
const BRANCH_CARD_WIDTH = 150;
const BRANCH_CARD_HEIGHT = 233;
const COLUMN_WIDTH = 310;
const BRANCH_TOP = 520;
const BUTTON_INSET = 26;
export const TEXT_HEIGHT = 112;

export function screenBox(screen: FlowScreen): ScreenBox {
  const width = screen.branch ? BRANCH_CARD_WIDTH : CARD_WIDTH;
  const height = screen.branch ? BRANCH_CARD_HEIGHT : CARD_HEIGHT;
  const x =
    PAD + screen.column * COLUMN_WIDTH + (screen.branch ? (CARD_WIDTH - BRANCH_CARD_WIDTH) / 2 : 0);
  const y = PAD + (screen.branch ? BRANCH_TOP : 0);
  return {
    x,
    y,
    width,
    height,
    centreX: x + width / 2,
    middleY: y + height / 2,
    bottom: y + height + TEXT_HEIGHT,
    button: { x: x + width / 2, y: y + height - BUTTON_INSET },
  };
}

export function boardSize(screens: readonly FlowScreen[]): Size {
  const lastColumn = Math.max(...screens.map((screen) => screen.column));
  const branches = screens.some((screen) => screen.branch);
  return {
    width: PAD * 2 + lastColumn * COLUMN_WIDTH + CARD_WIDTH,
    height: PAD * 2 + (branches ? BRANCH_TOP + BRANCH_CARD_HEIGHT : CARD_HEIGHT) + TEXT_HEIGHT,
  };
}

export function edgeCurve(from: FlowScreen, to: FlowScreen): Curve {
  const start = screenBox(from);
  const end = screenBox(to);
  const startX = start.x + start.width;
  if (!from.branch && to.branch) {
    const run = end.x - startX;
    return [
      { x: startX, y: start.middleY },
      { x: startX + run * 0.95, y: start.middleY },
      { x: startX + run * 0.05, y: end.middleY },
      { x: end.x, y: end.middleY },
    ];
  }
  if (from.branch && !to.branch) {
    return [
      { x: startX, y: start.middleY },
      { x: startX + 50, y: start.middleY },
      { x: end.centreX, y: start.middleY },
      { x: end.centreX, y: end.bottom },
    ];
  }
  const half = (end.x - startX) / 2;
  return [
    { x: startX, y: start.middleY },
    { x: startX + half, y: start.middleY },
    { x: end.x - half, y: end.middleY },
    { x: end.x, y: end.middleY },
  ];
}

export function pointOnCurve([p0, p1, p2, p3]: Curve, t: number): Point {
  const u = 1 - t;
  const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: weights[0] * p0.x + weights[1] * p1.x + weights[2] * p2.x + weights[3] * p3.x,
    y: weights[0] * p0.y + weights[1] * p1.y + weights[2] * p2.y + weights[3] * p3.y,
  };
}

export function curvePath([p0, p1, p2, p3]: Curve): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}
