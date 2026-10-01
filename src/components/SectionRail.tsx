import { m } from "motion/react";
import { SECTION_IDS, SECTION_LABELS } from "../data/sections";
import type { SectionId } from "../data/types";

export type RailLayout = "responsive" | "vertical" | "horizontal";

type SectionRailProps = {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  layout: RailLayout;
};

const LIST: Record<RailLayout, string> = {
  responsive:
    "flex gap-1 overflow-x-auto pb-1 @min-[1100px]/stage:flex-col @min-[1100px]/stage:overflow-visible @min-[1100px]/stage:pb-0",
  vertical: "flex flex-col gap-1",
  horizontal: "flex flex-wrap justify-center gap-1",
};

export function SectionRail({ active, onSelect, layout }: SectionRailProps) {
  return (
    <nav aria-label="Homepage sections">
      <ol className={LIST[layout]}>
        {SECTION_IDS.map((id) => (
          <li key={id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(id)}
              aria-current={id === active ? "true" : undefined}
              className="relative w-full whitespace-nowrap rounded-full px-3.5 py-2 text-left font-bold text-mist/60 text-sm transition-colors hover:text-mist aria-[current=true]:text-ink"
            >
              {id === active && (
                <m.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-full bg-mint"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{SECTION_LABELS[id]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
