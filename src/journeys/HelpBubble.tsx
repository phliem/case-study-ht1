import { useId, useLayoutEffect, useRef, useState } from "react";
import { FOCUS_RING } from "./focusRing";

type HelpBubbleProps = { open: boolean; onToggle: () => void };

const CLOSED = 48;
const GLIDE = "cubic-bezier(.2,.8,.2,1)";

export function HelpBubble({ open, onToggle }: HelpBubbleProps) {
  const textId = useId();
  const textRef = useRef<HTMLSpanElement>(null);
  const [textHeight, setTextHeight] = useState(110);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const measure = () => setTextHeight(text.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      data-ui
      aria-expanded={open}
      aria-label="How to explore"
      aria-describedby={textId}
      onClick={onToggle}
      className={`absolute bottom-5 left-5 z-10 flex cursor-pointer items-start overflow-hidden rounded-3xl border bg-card text-left shadow-card ${open ? "border-accent" : "border-line"} ${FOCUS_RING}`}
      style={{
        width: open ? "min(390px, calc(100vw - 40px))" : CLOSED,
        height: open ? Math.max(CLOSED, textHeight + 2) : CLOSED,
        transition: `width .55s ${GLIDE}, height .55s ${GLIDE}, border-color .3s`,
      }}
    >
      <span className="flex size-[46px] flex-none items-center justify-center">
        <span
          aria-hidden="true"
          className="flex size-[30px] items-center justify-center rounded-full bg-accent font-semibold font-serif text-[16px] text-white"
        >
          ?
        </span>
      </span>
      <span
        ref={textRef}
        className="flex w-[min(340px,calc(100vw-90px))] flex-none flex-col gap-1.5 py-3 pr-[18px] pl-0.5"
        style={{
          opacity: open ? 1 : 0,
          transform: `translateX(${open ? 0 : -8}px)`,
          transition: `opacity .35s ease ${open ? ".25s" : "0s"}, transform .45s ease ${open ? ".25s" : "0s"}`,
        }}
      >
        <strong className="font-semibold font-serif text-[16px] leading-[1.2]">
          How to explore
        </strong>
        <span id={textId} className="text-[14px] text-muted leading-[1.45]">
          Drag to move around. Scroll to pan, and pinch or Ctrl + scroll to zoom. Hover a screen to
          trace the route to it.
        </span>
      </span>
    </button>
  );
}
