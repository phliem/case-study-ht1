import type { Journey } from "./flow";
import { FOCUS_RING } from "./focusRing";

type JourneyMenuProps = {
  id: string;
  journeys: readonly Journey[];
  open: boolean;
  onPick: (journey: Journey) => void;
};

const GLIDE = "cubic-bezier(.2,.8,.2,1)";

export function JourneyMenu({ id, journeys, open, onPick }: JourneyMenuProps) {
  const last = journeys.length - 1;
  return (
    <div
      id={id}
      inert={!open}
      className="-left-1.5 absolute top-full flex flex-col items-start pt-0.5"
    >
      {journeys.map((journey, index) => {
        const delay = `${open ? index * 0.06 : (last - index) * 0.04}s`;
        return (
          <div
            key={journey.id}
            className="flex-none overflow-hidden px-1.5"
            style={{
              maxHeight: open ? 60 : 0,
              marginTop: open ? 8 : 0,
              opacity: open ? 1 : 0,
              transform: `translateY(${open ? 0 : -10}px)`,
              pointerEvents: open ? "auto" : "none",
              transition: `max-height .45s ${GLIDE} ${delay}, margin-top .45s ${GLIDE} ${delay}, opacity .3s ease ${delay}, transform .4s ${GLIDE} ${delay}`,
            }}
          >
            <button
              type="button"
              onClick={() => onPick(journey)}
              className={`flex cursor-pointer items-center gap-[9px] whitespace-nowrap rounded-full border border-line bg-card px-[18px] py-[11px] font-medium text-[14px] shadow-card transition-[border-color,background-color,color] duration-200 hover:border-accent hover:bg-accent hover:text-white ${FOCUS_RING}`}
            >
              {journey.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
