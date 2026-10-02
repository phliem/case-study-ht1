import { m } from "motion/react";
import { PAGES } from "../data/pages";
import type { PageId, SectionId } from "../data/types";

export type RailLayout = "responsive" | "vertical" | "horizontal";

type SectionRailProps = {
  page: PageId;
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

const LABEL: Record<RailLayout, string> = {
  responsive: "whitespace-nowrap @min-[1100px]/stage:whitespace-normal",
  vertical: "whitespace-normal",
  horizontal: "whitespace-nowrap",
};

export function SectionRail({ page, active, onSelect, layout }: SectionRailProps) {
  const { name, sections } = PAGES[page];
  return (
    <nav aria-label={`${name} sections`}>
      <ol className={LIST[layout]}>
        {sections.map(({ id, label }) => (
          <li key={id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(id)}
              aria-current={id === active ? "true" : undefined}
              className={`relative w-full rounded-full px-3.5 py-2 text-left font-bold text-mist/60 text-sm transition-colors hover:text-mist aria-[current=true]:text-ink ${LABEL[layout]}`}
            >
              {id === active && (
                <m.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-full bg-mint"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
