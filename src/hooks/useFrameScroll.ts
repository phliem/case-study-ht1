import { type MotionValue, useMotionValue } from "motion/react";
import { type RefObject, useLayoutEffect, useRef } from "react";
import type { SectionMap } from "../lib/sectionMap";

export type FrameScroll = {
  scrollA: MotionValue<number>;
  scrollB: MotionValue<number>;
  beforeY: MotionValue<number>;
};

export function useFrameScroll(
  scroller: RefObject<HTMLElement | null>,
  map: SectionMap,
  scale: number,
  initialScroll: number,
): FrameScroll {
  const scrollA = useMotionValue(initialScroll);
  const scrollB = useMotionValue(map.mapScroll(initialScroll));
  const beforeY = useMotionValue(0);
  const restored = useRef(false);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || scale === 0) return;
    element.scrollTop = (restored.current ? scrollA.get() : initialScroll) * scale;
    restored.current = true;
    const update = () => {
      const pagePx = element.scrollTop / scale;
      const mapped = map.mapScroll(pagePx);
      scrollA.set(pagePx);
      scrollB.set(mapped);
      beforeY.set(-mapped * scale);
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [scroller, map, scale, initialScroll, scrollA, scrollB, beforeY]);

  return { scrollA, scrollB, beforeY };
}
