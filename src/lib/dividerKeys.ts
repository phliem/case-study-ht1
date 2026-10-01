import { clamp } from "./math";

export function nextDividerValue(current: number, key: string, shift: boolean): number | null {
  const step = shift ? 0.2 : 0.05;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(current + step, 0, 1);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(current - step, 0, 1);
    case "Home":
      return 0;
    case "End":
      return 1;
    default:
      return null;
  }
}
