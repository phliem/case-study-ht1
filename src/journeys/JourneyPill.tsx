import type { Journey } from "./flow";
import { FOCUS_RING } from "./focusRing";

type JourneyPillProps = {
  playing: Journey | null;
  menuOpen: boolean;
  menuId: string;
  onToggleMenu: () => void;
  onStop: () => void;
};

export function JourneyPill({ playing, menuOpen, menuId, onToggleMenu, onStop }: JourneyPillProps) {
  return (
    <div
      className={`pointer-events-auto flex items-center gap-1 rounded-full border bg-card p-1 shadow-card transition-[border-color] duration-200 ${menuOpen ? "border-accent" : "border-line"}`}
    >
      {playing ? (
        <>
          <span className="flex-none whitespace-nowrap py-[9px] pr-1 pl-3.5 font-semibold text-[14px]">
            {playing.label}
          </span>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onStop}
            className={`relative size-9 flex-none cursor-pointer rounded-full hover:bg-line ${FOCUS_RING}`}
          >
            <span className="absolute top-[17px] left-[11px] h-[1.8px] w-3.5 rotate-45 rounded-[1px] bg-ink" />
            <span className="-rotate-45 absolute top-[17px] left-[11px] h-[1.8px] w-3.5 rounded-[1px] bg-ink" />
          </button>
        </>
      ) : (
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={onToggleMenu}
          className={`flex-none cursor-pointer whitespace-nowrap rounded-full px-3.5 py-[9px] font-semibold text-[14px] hover:bg-line ${FOCUS_RING}`}
        >
          Select your journey
        </button>
      )}
    </div>
  );
}
