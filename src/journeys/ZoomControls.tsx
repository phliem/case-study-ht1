import type { Ref } from "react";
import { FOCUS_RING } from "./focusRing";

type ZoomControlsProps = {
  labelRef: Ref<HTMLSpanElement>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

const BUTTON = `cursor-pointer rounded-full font-medium hover:bg-line ${FOCUS_RING}`;

export function ZoomControls({ labelRef, onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div
      data-ui
      className="absolute right-5 bottom-5 flex cursor-default items-center gap-0.5 rounded-full border border-line bg-card p-1 shadow-card"
    >
      <button
        type="button"
        aria-label="Zoom out"
        onClick={onZoomOut}
        className={`size-9 text-[20px] ${BUTTON}`}
      >
        −
      </button>
      <span
        ref={labelRef}
        data-testid="zoom-level"
        className="min-w-12 text-center font-mono text-[12px] text-muted"
      />
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className={`size-9 text-[20px] ${BUTTON}`}
      >
        +
      </button>
      <button type="button" onClick={onFit} className={`h-9 px-3.5 text-[13px] ${BUTTON}`}>
        Fit
      </button>
    </div>
  );
}
