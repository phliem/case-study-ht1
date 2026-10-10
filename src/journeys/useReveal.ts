import { type RefObject, useLayoutEffect, useState } from "react";

const SETTLED_AFTER_MS = 7000;

export type Reveal = { revealed: boolean; animated: boolean; settled: boolean };

export function useReveal(edgesRef: RefObject<SVGSVGElement | null>, reduced: boolean): Reveal {
  const [revealed, setRevealed] = useState(reduced);
  const [animated, setAnimated] = useState(false);
  const [settled, setSettled] = useState(reduced);

  useLayoutEffect(() => {
    const svg = edgesRef.current;
    if (reduced) {
      setRevealed(true);
      setSettled(true);
      return;
    }
    if (!svg) return;
    const paths = [...svg.querySelectorAll<SVGPathElement>("[data-edge]")];
    for (const path of paths) {
      const length = path.getTotalLength();
      path.style.transition = "none";
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }
    let drawFrame = 0;
    const startFrame = requestAnimationFrame(() => {
      drawFrame = requestAnimationFrame(() => {
        setRevealed(true);
        setAnimated(true);
        for (const path of paths) {
          path.getBoundingClientRect();
          path.style.transition = `stroke-dashoffset 1.6s cubic-bezier(.6,0,.3,1) ${path.dataset.delay}ms, stroke .3s, opacity .3s, stroke-width .3s`;
          path.style.strokeDashoffset = "0";
        }
      });
    });
    const settle = window.setTimeout(() => setSettled(true), SETTLED_AFTER_MS);
    return () => {
      cancelAnimationFrame(startFrame);
      cancelAnimationFrame(drawFrame);
      window.clearTimeout(settle);
    };
  }, [edgesRef, reduced]);

  return { revealed, animated, settled };
}
