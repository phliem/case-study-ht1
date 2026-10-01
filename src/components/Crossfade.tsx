import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";
import type { Version } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";

type CrossfadeProps = { state: Version; before: ReactNode; after: ReactNode };

export function Crossfade({ state, before, after }: CrossfadeProps) {
  const { reduced } = useMotionPreference();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={state}
        className="grid size-full place-items-center"
        initial={reduced ? false : { opacity: 0, scale: 0.96, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={reduced ? undefined : { opacity: 0, scale: 1.02, filter: "blur(6px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {state === "before" ? before : after}
      </m.span>
    </AnimatePresence>
  );
}
