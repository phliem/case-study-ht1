import { type MotionValue, m, useMotionValueEvent } from "motion/react";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { captureFor } from "../data/captures";
import { PAGES } from "../data/pages";
import type { Device, PageId, SectionId } from "../data/types";
import { useElementSize } from "../hooks/useElementSize";
import { useFrameScroll } from "../hooks/useFrameScroll";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { easeInOutCubic, lerp } from "../lib/math";
import type { SectionMap } from "../lib/sectionMap";
import { PageLayer } from "./PageLayer";
import { PinnedLayers } from "./PinnedLayers";
import { VersionLabels } from "./VersionLabels";
import { WipeDivider } from "./WipeDivider";

export type StageViewportHandle = {
  scrollTo: (pagePx: number) => void;
  glideTo: (pagePx: number, seconds: number) => void;
  getScroll: () => number;
};

type StageViewportProps = {
  page: PageId;
  device: Device;
  divider: MotionValue<number>;
  map: SectionMap;
  live: boolean;
  eager: boolean;
  initialScroll: number;
  onGroupChange: (id: SectionId) => void;
  ref?: Ref<StageViewportHandle>;
};

const INTERRUPTIONS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

export function StageViewport({
  page,
  device,
  divider,
  map,
  live,
  eager,
  initialScroll,
  onGroupChange,
  ref,
}: StageViewportProps) {
  const { reduced } = useMotionPreference();
  const { name, noun } = PAGES[page];
  const before = captureFor(page, "before", device);
  const after = captureFor(page, "after", device);
  const [measure, size] = useElementSize<HTMLDivElement>();
  const scale = size.width / after.viewport.width;
  const scroller = useRef<HTMLElement>(null);
  const glide = useRef<number | null>(null);
  const group = useRef<SectionId>(map.groupAt(initialScroll));
  const { scrollA, scrollB, beforeY } = useFrameScroll(scroller, map, scale, initialScroll);
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
      if (glide.current !== null) cancelAnimationFrame(glide.current);
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
        if (glide.current !== null) cancelAnimationFrame(glide.current);
        glide.current = null;
        const target = pagePx * scale;
        if (seconds === 0) {
          element.scrollTop = target;
          return;
        }
        const from = element.scrollTop;
        const startedAt = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - startedAt) / (seconds * 1000)));
          element.scrollTop = lerp(from, target, easeInOutCubic(t));
          glide.current = t < 1 ? requestAnimationFrame(step) : null;
        };
        glide.current = requestAnimationFrame(step);
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
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.35 }}
    >
      <section
        ref={scroller}
        data-testid="after-scroller"
        aria-label={`After: the v2 ${noun}. Scroll to move both versions together.`}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden pointer-coarse:overscroll-auto overscroll-contain [scrollbar-width:none]"
      >
        <div className="relative" style={{ height: after.pageHeight * scale }}>
          <PageLayer
            capture={after}
            scale={scale}
            live={live}
            eager={eager}
            root={scroller}
            alt={`After: the Bookable ${noun} on its own design system, ${device}`}
          />
        </div>
      </section>
      <PinnedLayers
        layers={after.pinned}
        width={after.viewport.width}
        scale={scale}
        scroll={scrollA}
        eager={eager}
      />
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
              live={false}
              eager={eager}
              root={scroller}
              alt={`Before: the Bookable ${noun} on the NHS design system, ${device}`}
            />
          </div>
          <PinnedLayers
            layers={before.pinned}
            width={before.viewport.width}
            scale={scale}
            scroll={scrollB}
            eager={eager}
          />
        </div>
      </div>
      <WipeDivider divider={divider} label={`${name}: divider between before and after`} />
      <VersionLabels page={page} device={device} divider={divider} />
    </m.div>
  );
}
