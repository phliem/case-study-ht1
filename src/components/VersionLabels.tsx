import type { MotionValue } from "motion/react";
import { PAGES } from "../data/pages";
import type { Device, PageId } from "../data/types";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { clamp } from "../lib/math";

type VersionLabelsProps = { page: PageId; device: Device; divider: MotionValue<number> };

const CHIP =
  "rounded-full px-3 py-1.5 font-extrabold text-[11px] uppercase leading-none tracking-[0.09em] backdrop-blur";

const FADE_SHARE = 0.12;

function shortMonth(when: string): string {
  const [month, year] = when.split(" ");
  return `${month.slice(0, 3)} ${year}`;
}

export function VersionLabels({ page, device, divider }: VersionLabelsProps) {
  const { when } = PAGES[page];
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
      className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between"
    >
      <span ref={beforeChip.ref} className={`${CHIP} bg-ink/75 text-mist`} style={beforeChip.style}>
        {compact ? shortMonth(when.before) : `${when.before} · NHS design system`}
      </span>
      <span ref={afterChip.ref} className={`${CHIP} bg-mint text-ink`} style={afterChip.style}>
        {compact ? shortMonth(when.after) : `${when.after} · v2`}
      </span>
    </div>
  );
}
