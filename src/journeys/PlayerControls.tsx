import { FOCUS_RING } from "./focusRing";

type PlayerControlsProps = {
  visible: boolean;
  paused: boolean;
  step: number;
  steps: number;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onPlay: () => void;
};

const ROUND_BUTTON = `flex size-9 cursor-pointer items-center justify-center rounded-full ${FOCUS_RING}`;

export function PlayerControls({
  visible,
  paused,
  step,
  steps,
  onPrevious,
  onNext,
  onPause,
  onPlay,
}: PlayerControlsProps) {
  return (
    <div
      inert={!visible}
      className="absolute top-[calc(100%+10px)] left-0 flex items-center gap-1 whitespace-nowrap rounded-full border border-line bg-card p-1 shadow-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -8}px)`,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity .3s ease, transform .35s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <button
        type="button"
        title="Previous step"
        aria-label="Previous step"
        onClick={onPrevious}
        className={`${ROUND_BUTTON} hover:bg-line`}
        style={{ opacity: step > 0 ? 1 : 0.35 }}
      >
        <span className="h-2.5 w-0.5 rounded-[1px] bg-ink" />
        <span className="size-0 border-y-[5px] border-y-transparent border-r-8 border-r-ink" />
      </button>
      {paused ? (
        <button
          type="button"
          title="Play"
          aria-label="Play"
          onClick={onPlay}
          className={`${ROUND_BUTTON} bg-accent`}
        >
          <span className="ml-[3px] size-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-white" />
        </button>
      ) : (
        <button
          type="button"
          title="Pause"
          aria-label="Pause"
          onClick={onPause}
          className={`${ROUND_BUTTON} gap-1 bg-accent`}
        >
          <span className="h-[13px] w-[3.5px] rounded-[1px] bg-white" />
          <span className="h-[13px] w-[3.5px] rounded-[1px] bg-white" />
        </button>
      )}
      <button
        type="button"
        title="Next step"
        aria-label="Next step"
        onClick={onNext}
        className={`${ROUND_BUTTON} hover:bg-line`}
        style={{ opacity: step < steps - 1 ? 1 : 0.35 }}
      >
        <span className="size-0 border-y-[5px] border-y-transparent border-l-8 border-l-ink" />
        <span className="h-2.5 w-0.5 rounded-[1px] bg-ink" />
      </button>
      <span aria-hidden="true" className="mr-1.5 ml-1 h-[22px] w-px bg-line" />
      <span className="pr-3.5 font-mono text-[12px] text-muted">
        Step <strong className="font-medium text-ink">{step + 1}</strong> of {steps}
      </span>
    </div>
  );
}
