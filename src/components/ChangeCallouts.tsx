import { AnimatePresence, m } from "motion/react";
import { useId } from "react";
import { changesFor } from "../data/changes";
import { sectionLabel } from "../data/pages";
import type { PageId, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";

type ChangeCalloutsProps = { page: PageId; group: SectionId };

const LIST = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ChangeCallouts({ page, group }: ChangeCalloutsProps) {
  const { reduced } = useMotionPreference();
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} className="max-w-[420px]">
      <p id={headingId} className="caption text-mint">
        What changed · {sectionLabel(page, group)}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <m.ul
          key={group}
          className="mt-4 space-y-3"
          variants={LIST}
          initial={reduced ? false : "hidden"}
          animate="shown"
          exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
        >
          {changesFor(page, group).map((note) => (
            <m.li
              key={note}
              variants={reduced ? undefined : ITEM}
              className="flex gap-3 text-[15px] text-mist/85 leading-relaxed"
            >
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-mint" />
              {note}
            </m.li>
          ))}
        </m.ul>
      </AnimatePresence>
    </aside>
  );
}
