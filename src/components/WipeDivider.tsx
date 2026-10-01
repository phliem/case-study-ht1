import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useRef, useState } from "react";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { nextDividerValue } from "../lib/dividerKeys";
import { clamp } from "../lib/math";
import { HandleIcon } from "./HandleIcon";

type WipeDividerProps = { divider: MotionValue<number> };

const toLeft = (share: number) => `${share * 100}%`;

export function WipeDivider({ divider }: WipeDividerProps) {
  const track = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(() => Math.round(divider.get() * 100));
  const line = useLiveStyle<HTMLDivElement>(divider, "left", toLeft);
  const handle = useLiveStyle<HTMLButtonElement>(divider, "left", toLeft);

  useMotionValueEvent(divider, "change", (share) => setValue(Math.round(share * 100)));

  const followPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    divider.set(clamp((clientX - box.left) / box.width, 0, 1));
  };

  return (
    <div ref={track} className="pointer-events-none absolute inset-0">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Divider between before and after"
        aria-valuetext={`${value}% before, ${100 - value}% after`}
        onChange={(event) => divider.set(Number(event.currentTarget.value) / 100)}
        onKeyDown={(event) => {
          const next = nextDividerValue(divider.get(), event.key, event.shiftKey);
          if (next === null) return;
          event.preventDefault();
          divider.set(next);
        }}
        className="peer sr-only"
      />
      <div
        ref={line.ref}
        aria-hidden="true"
        className="-translate-x-1/2 absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_24px_rgba(111,224,172,0.55)]"
        style={line.style}
      />
      <button
        ref={handle.ref}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="divider-handle"
        className="-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute top-1/2 grid size-11 cursor-ew-resize touch-none place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_rgba(3,20,45,0.35)] ring-mint transition-shadow peer-focus-visible:ring-4"
        style={handle.style}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          followPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) followPointer(event.clientX);
        }}
      >
        <HandleIcon />
      </button>
    </div>
  );
}
