import {
  type AnimationPlaybackControls,
  animate,
  type MotionValue,
  m,
  useMotionValueEvent,
} from "motion/react";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useElementSize } from "../hooks/useElementSize";
import { useFrameScroll } from "../hooks/useFrameScroll";
import { useLiveStyle } from "../hooks/useLiveStyle";
import type { SectionMap } from "../lib/sectionMap";
import { PageLayer } from "./PageLayer";
import { VersionLabels } from "./VersionLabels";
import { WipeDivider } from "./WipeDivider";

export type StageViewportHandle = {
  scrollTo: (pagePx: number) => void;
  glideTo: (pagePx: number, seconds: number) => void;
  getScroll: () => number;
};

type StageViewportProps = {
  device: Device;
  divider: MotionValue<number>;
  map: SectionMap;
  initialScroll: number;
  onGroupChange: (id: SectionId) => void;
  ref?: Ref<StageViewportHandle>;
};

const GLIDE_EASE = [0.65, 0, 0.35, 1] as const;
const INTERRUPTIONS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

export function StageViewport({
  device,
  divider,
  map,
  initialScroll,
  onGroupChange,
  ref,
}: StageViewportProps) {
  const before = captureFor("before", device);
  const after = captureFor("after", device);
  const [measure, size] = useElementSize<HTMLDivElement>();
  const scale = size.width / after.viewport.width;
  const scroller = useRef<HTMLElement>(null);
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const group = useRef<SectionId>(map.groupAt(initialScroll));
  const { scrollA, beforeY } = useFrameScroll(scroller, map, scale, initialScroll);
  const outerClip = useLiveStyle<HTMLDivElement>(
    divider,
    "transform",
    (share) => `translateX(${(share - 1) * 100}%)`,
  );
  const innerClip = useLiveStyle<HTMLDivElement>(
    divider,
    "transform",
    (share) => `translateX(${(1 - share) * 100}%)`,
  );
  const beforePage = useLiveStyle<HTMLDivElement>(
    beforeY,
    "transform",
    (y) => `translateY(${y}px)`,
  );

  useMotionValueEvent(scrollA, "change", (pagePx) => {
    const next = map.groupAt(pagePx);
    if (next === group.current) return;
    group.current = next;
    onGroupChange(next);
  });

  useEffect(() => {
    onGroupChange(group.current);
  }, [onGroupChange]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const cancelGlide = () => {
      glide.current?.stop();
      glide.current = null;
    };
    for (const name of INTERRUPTIONS)
      element.addEventListener(name, cancelGlide, { passive: true });
    return () => {
      for (const name of INTERRUPTIONS) element.removeEventListener(name, cancelGlide);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(pagePx) {
        const element = scroller.current;
        if (element && scale > 0) element.scrollTop = pagePx * scale;
      },
      glideTo(pagePx, seconds) {
        const element = scroller.current;
        if (!element || scale === 0) return;
        glide.current?.stop();
        if (seconds === 0) {
          element.scrollTop = pagePx * scale;
          return;
        }
        glide.current = animate(element.scrollTop, pagePx * scale, {
          duration: seconds,
          ease: GLIDE_EASE,
          onUpdate: (value) => {
            element.scrollTop = value;
          },
        });
      },
      getScroll: () => scrollA.get(),
    }),
    [scale, scrollA],
  );

  return (
    <m.div
      ref={measure}
      layout
      data-testid="stage-viewport"
      data-scale={scale}
      className="absolute inset-0 overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.35 }}
    >
      <section
        ref={scroller}
        data-testid="after-scroller"
        aria-label="After: the v2 homepage. Scroll to move both versions together."
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none]"
      >
        <div className="relative" style={{ height: after.pageHeight * scale }}>
          <PageLayer
            capture={after}
            scale={scale}
            alt={`After: the Bookable homepage on its own design system, ${device}`}
          />
        </div>
      </section>
      <div
        ref={outerClip.ref}
        className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
        style={outerClip.style}
      >
        <div
          ref={innerClip.ref}
          className="absolute inset-0 will-change-transform"
          style={innerClip.style}
        >
          <div
            ref={beforePage.ref}
            data-testid="before-page"
            className="absolute inset-x-0 top-0 will-change-transform"
            style={beforePage.style}
          >
            <PageLayer
              capture={before}
              scale={scale}
              alt={`Before: the Bookable homepage on the NHS design system, ${device}`}
            />
          </div>
        </div>
      </div>
      <WipeDivider divider={divider} />
      <VersionLabels device={device} divider={divider} />
    </m.div>
  );
}
