import type { FlowScreen } from "./flow";
import type { ScreenBox } from "./layout";
import { ScreenPlaceholder } from "./ScreenPlaceholder";

type ScreenCardProps = {
  screen: FlowScreen;
  box: ScreenBox;
  delay: number;
  revealed: boolean;
  animated: boolean;
  active: boolean;
  dimmed: boolean;
};

export function ScreenCard({
  screen,
  box,
  delay,
  revealed,
  animated,
  active,
  dimmed,
}: ScreenCardProps) {
  const code = `${String(screen.column + 1).padStart(2, "0")}${screen.branch ? " · alt" : ""}`;
  return (
    <div
      data-screen={screen.id}
      className="absolute"
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0) scale(1)" : "translateY(14px) scale(.94)",
        transition: animated
          ? `opacity 1.2s ease ${delay}ms, transform 1.4s cubic-bezier(.2,.8,.2,1) ${delay}ms`
          : "none",
      }}
    >
      <div
        data-dimmed={dimmed}
        className="flex flex-col gap-3 transition-opacity duration-[350ms]"
        style={{ opacity: dimmed ? 0.28 : 1 }}
      >
        <div
          className={`relative overflow-hidden rounded-[6px] border bg-card transition-[box-shadow,border-color] duration-[350ms] ${active ? "border-accent shadow-active" : "border-line shadow-card"}`}
          style={{ width: box.width, height: box.height }}
        >
          {screen.screenshot ? (
            <img
              src={screen.screenshot}
              alt={`The ${screen.title} screen`}
              className="size-full object-cover object-top"
            />
          ) : (
            <ScreenPlaceholder label={`Screenshot: ${screen.title}`} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
            <span>{code}</span>
            {screen.end && (
              <span className="rounded-full border border-line px-[7px] py-px">End</span>
            )}
          </div>
          {screen.title && (
            <h2
              className={`font-semibold font-serif leading-[1.2] ${screen.branch ? "text-[16px]" : "text-[18px]"}`}
            >
              {screen.title}
            </h2>
          )}
          {screen.description && (
            <p className="text-pretty text-[13px] text-muted leading-[1.45]">
              {screen.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
