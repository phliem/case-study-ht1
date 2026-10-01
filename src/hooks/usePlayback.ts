import type { MotionValue } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Device } from "../data/types";
import { durationOf, type PlayScript, type ScrollResolver, stateAt } from "../lib/playScript";

export const LOOP_HOLD_MS = 1000;

export type PlaybackTargets = {
  divider: MotionValue<number>;
  resolve: ScrollResolver;
  setDevice: (device: Device, scrollTop: number) => void;
  scrollTo: (pagePx: number, device: Device) => void;
};

export type PlaybackOptions = { loop: boolean; cut: boolean };

export type Playback = { playing: boolean; play: () => void; stop: () => void };

export function usePlayback(
  script: PlayScript,
  targets: PlaybackTargets,
  options: PlaybackOptions,
): Playback {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const latest = useRef({ script, targets, options });

  useLayoutEffect(() => {
    latest.current = { script, targets, options };
  });

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const stop = useCallback(() => {
    cancel();
    setPlaying(false);
  }, [cancel]);

  const play = useCallback(() => {
    cancel();
    setPlaying(true);
    const startedAt = performance.now();
    let device: Device | null = null;
    const tick = (now: number) => {
      const { script: current, targets: on, options: mode } = latest.current;
      const duration = durationOf(current);
      const elapsed = mode.loop ? (now - startedAt) % (duration + LOOP_HOLD_MS) : now - startedAt;
      const state = stateAt(current, elapsed, on.resolve, mode.cut);
      if (state.device !== device) {
        device = state.device;
        on.setDevice(device, state.scrollTop);
      }
      on.divider.set(state.divider);
      on.scrollTo(state.scrollTop, state.device);
      if (!mode.loop && elapsed >= duration) {
        frame.current = null;
        setPlaying(false);
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { playing, play, stop };
}
