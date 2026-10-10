import type { Point } from "./layout";

type EdgeLabelProps = {
  label: string;
  at: Point;
  lit: boolean;
  opacity: number;
  transition: string;
};

export function EdgeLabel({ label, at, lit, opacity, transition }: EdgeLabelProps) {
  return (
    <div
      aria-hidden="true"
      className={`-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute max-w-[120px] rounded-full border px-2.5 py-[5px] text-center font-medium text-[12.5px] leading-[1.25] ${lit ? "border-accent bg-accent text-white" : "border-line bg-card text-ink"}`}
      style={{ left: at.x, top: at.y, opacity, transition }}
    >
      {label}
    </div>
  );
}
