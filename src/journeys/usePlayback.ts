import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Journey } from "./flow";
import {
  advanced,
  idle,
  type Playback,
  paused,
  resumed,
  started,
  stepped,
  stopped,
} from "./playback";

type PlaybackOptions = {
  firstJourney: Journey;
  stepMs: number;
  onStep: (state: Playback) => void;
};

export type PlaybackControls = {
  state: Playback;
  latest: RefObject<Playback>;
  play: (journey: Journey) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  step: (delta: number) => void;
};

export function usePlayback({ firstJourney, stepMs, onStep }: PlaybackOptions): PlaybackControls {
  const [state, setState] = useState(() => idle(firstJourney));
  const latest = useRef(state);
  const onStepRef = useRef(onStep);
  useLayoutEffect(() => {
    onStepRef.current = onStep;
  });

  const update = useCallback((next: Playback) => {
    const previous = latest.current;
    latest.current = next;
    setState(next);
    const movedOn =
      next.playing && (!previous.playing || next.stepStartedAt !== previous.stepStartedAt);
    if (movedOn) onStepRef.current(next);
  }, []);

  useEffect(() => {
    if (!state.playing || state.paused) return;
    const timer = window.setTimeout(
      () => update(advanced(latest.current, performance.now())),
      stepMs,
    );
    return () => window.clearTimeout(timer);
  }, [state, stepMs, update]);

  const play = useCallback(
    (journey: Journey) => update(started(journey, performance.now())),
    [update],
  );
  const stop = useCallback(() => update(stopped(latest.current)), [update]);
  const pause = useCallback(() => update(paused(latest.current)), [update]);
  const resume = useCallback(() => update(resumed(latest.current, performance.now())), [update]);
  const step = useCallback(
    (delta: number) => update(stepped(latest.current, delta, performance.now())),
    [update],
  );
  return useMemo(
    () => ({ state, latest, play, stop, pause, resume, step }),
    [state, play, stop, pause, resume, step],
  );
}
