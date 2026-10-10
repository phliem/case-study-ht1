import { useEffect, useLayoutEffect, useRef } from "react";

export function useFrameLoop(onFrame: (now: number) => void) {
  const latest = useRef(onFrame);
  useLayoutEffect(() => {
    latest.current = onFrame;
  });
  useEffect(() => {
    let frame = requestAnimationFrame(function loop(now) {
      latest.current(now);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}
