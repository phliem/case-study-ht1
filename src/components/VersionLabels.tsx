import type { MotionValue } from "motion/react";
import type { Device } from "../data/types";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { clamp } from "../lib/math";

type VersionLabelsProps = { device: Device; divider: MotionValue<number> };

const CHIP =
  "rounded-full px-3 py-1.5 font-extrabold text-[11px] uppercase leading-none tracking-[0.09em] backdrop-blur";

const FADE_SHARE = 0.12;

export function VersionLabels({ device, divider }: VersionLabelsProps) {
  const beforeChip = useLiveStyle<HTMLSpanElement>(divider, "opacity", (share) =>
    String(clamp(share / FADE_SHARE, 0, 1)),
  );
  const afterChip = useLiveStyle<HTMLSpanElement>(divider, "opacity", (share) =>
    String(clamp((1 - share) / FADE_SHARE, 0, 1)),
  );
  const compact = device === "mobile";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-3 top-3 flex justify-between"
    >
      <span ref={beforeChip.ref} className={`${CHIP} bg-ink/75 text-mist`} style={beforeChip.style}>
        {compact ? "Before" : "Before · NHS design system"}
      </span>
      <span ref={afterChip.ref} className={`${CHIP} bg-mint text-ink`} style={afterChip.style}>
        {compact ? "After" : "After · v2"}
      </span>
    </div>
  );
}
