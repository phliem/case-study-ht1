import { type RefObject, useCallback, useRef } from "react";
import { cursorPose, type NextEdge, PAUSED_AT } from "./cursor";
import { edgeKey, type Flow, screenOf } from "./flow";
import { type Point, screenBox } from "./layout";
import type { Playback } from "./playback";

type PlayCursorOptions = {
  flow: Flow;
  edgesRef: RefObject<SVGSVGElement | null>;
  cursorRef: RefObject<HTMLDivElement | null>;
  rippleRef: RefObject<HTMLDivElement | null>;
};

type Trail = { step: string | null; from: Point | null; handoff: Point | null };

function nextEdge(
  svg: SVGSVGElement | null,
  from: string,
  to: string | undefined,
): NextEdge | null {
  const path = to ? svg?.querySelector<SVGPathElement>(`[data-edge="${edgeKey(from, to)}"]`) : null;
  if (!path) return null;
  const length = path.getTotalLength();
  return {
    start: path.getPointAtLength(0),
    pointAt: (fraction) => path.getPointAtLength(fraction * length),
  };
}

export function usePlayCursor({ flow, edgesRef, cursorRef, rippleRef }: PlayCursorOptions) {
  const trail = useRef<Trail>({ step: null, from: null, handoff: null });

  return useCallback(
    (now: number, state: Playback) => {
      const cursor = cursorRef.current;
      const ripple = rippleRef.current;
      if (!cursor || !ripple) return;
      if (!state.playing) {
        cursor.style.opacity = "0";
        ripple.style.opacity = "0";
        trail.current = { step: null, from: null, handoff: null };
        return;
      }
      const { journey, step, stepStartedAt, entry } = state;
      const stepKey = `${journey.id}/${step}/${stepStartedAt}`;
      if (trail.current.step !== stepKey) {
        const from = entry === "edge" ? trail.current.handoff : null;
        trail.current = { step: stepKey, from, handoff: null };
      }
      const box = screenBox(screenOf(flow, journey.path[step]));
      const next = nextEdge(edgesRef.current, journey.path[step], journey.path[step + 1]);
      const running = Math.max(0, now - stepStartedAt);
      const elapsed = state.paused ? Math.min(running, PAUSED_AT) : running;
      const start = trail.current.from ?? { x: box.centreX, y: box.middleY };
      const pose = cursorPose(elapsed, start, box.button, next);
      if (pose.travelling) trail.current.handoff = pose.position;
      cursor.style.opacity = `${pose.opacity}`;
      cursor.style.transform = `translate(${pose.position.x - 2}px, ${pose.position.y - 2}px)`;
      ripple.style.opacity = pose.ripple ? `${pose.ripple.opacity}` : "0";
      if (pose.ripple) {
        ripple.style.transform = `translate(${box.button.x}px, ${box.button.y}px) scale(${pose.ripple.scale})`;
      }
    },
    [flow, edgesRef, cursorRef, rippleRef],
  );
}
