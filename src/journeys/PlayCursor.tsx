import type { Ref } from "react";

type PlayCursorProps = { cursorRef: Ref<HTMLDivElement>; rippleRef: Ref<HTMLDivElement> };

export function PlayCursor({ cursorRef, rippleRef }: PlayCursorProps) {
  return (
    <>
      <div
        ref={rippleRef}
        aria-hidden="true"
        className="-mt-[22px] -ml-[22px] pointer-events-none absolute top-0 left-0 size-11 rounded-full border-2 border-accent bg-accent-soft opacity-0"
      />
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-7 w-6 opacity-0 drop-shadow-[0_3px_6px_rgb(0_0_0/0.25)]"
      >
        <svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true">
          <path
            d="M2 2 L2 22 L7.5 17 L11.5 26 L15 24.5 L11 15.8 L18.5 15.8 Z"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className="fill-ink stroke-card"
          />
        </svg>
      </div>
    </>
  );
}
