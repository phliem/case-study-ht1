import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { assetUrl } from "../data/captures";
import type { StickyHeader } from "../data/types";

type StickyHeaderOverlayProps = {
  header: StickyHeader;
  width: number;
  scale: number;
  scroll: MotionValue<number>;
};

export function StickyHeaderOverlay({ header, width, scale, scroll }: StickyHeaderOverlayProps) {
  const [scrolled, setScrolled] = useState(() => scroll.get() >= header.flipAt);
  useMotionValueEvent(scroll, "change", (pagePx) => setScrolled(pagePx >= header.flipAt));
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ width, transform: `scale(${scale})` }}
    >
      {header.states.map((state) => (
        <div
          key={state.id}
          data-testid={`header-${state.id}`}
          className="absolute top-0 left-0 transition-opacity duration-[250ms]"
          style={{
            width,
            height: state.height,
            opacity: (state.id === "scrolled") === scrolled ? 1 : 0,
            backdropFilter: state.blur === null ? undefined : `blur(${state.blur}px)`,
          }}
        >
          <img
            src={assetUrl(state.src)}
            alt=""
            width={width}
            height={state.height}
            className="block max-w-none"
            style={{ width, height: state.height }}
          />
        </div>
      ))}
    </div>
  );
}
