export type LoopPlan = { length: number; rates: number[] };

export function cyclesWithin(period: number, length: number, maxStretch: number): number | null {
  const cycles = Math.max(1, Math.round(length / period));
  const stretch = Math.abs(length / cycles - period) / period;
  return stretch <= maxStretch ? cycles : null;
}

export function planLoop(
  periods: readonly number[],
  basePeriod: number,
  maxStretch = 0.05,
  maxMultiple = 6,
): LoopPlan {
  for (let multiple = 1; multiple <= maxMultiple; multiple++) {
    const length = basePeriod * multiple;
    const cycles = periods.map((period) => cyclesWithin(period, length, maxStretch));
    if (cycles.every((count) => count !== null)) {
      return {
        length,
        rates: periods.map((period, index) => ((cycles[index] ?? 1) * period) / length),
      };
    }
  }
  throw new Error(
    `No seamless loop within ${maxMultiple} × ${basePeriod}s for periods ${periods.join(", ")}s`,
  );
}
