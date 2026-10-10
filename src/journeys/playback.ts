import { clamp } from "../lib/math";
import type { Journey } from "./flow";

export type Playback = {
  playing: boolean;
  journey: Journey;
  step: number;
  paused: boolean;
  stepStartedAt: number;
  entry: "centre" | "edge";
};

const lastStep = (state: Playback) => state.journey.path.length - 1;

export function idle(journey: Journey): Playback {
  return { playing: false, journey, step: 0, paused: false, stepStartedAt: 0, entry: "centre" };
}

export function started(journey: Journey, now: number): Playback {
  return { playing: true, journey, step: 0, paused: false, stepStartedAt: now, entry: "centre" };
}

export function stopped(state: Playback): Playback {
  return { ...state, playing: false, paused: false };
}

export function advanced(state: Playback, now: number): Playback {
  if (!state.playing) return state;
  if (state.step >= lastStep(state)) return { ...state, paused: true };
  return { ...state, step: state.step + 1, stepStartedAt: now, entry: "edge" };
}

export function paused(state: Playback): Playback {
  return state.playing ? { ...state, paused: true } : state;
}

export function resumed(state: Playback, now: number): Playback {
  if (!state.playing) return state;
  const step = state.step >= lastStep(state) ? 0 : state.step;
  return { ...state, step, paused: false, stepStartedAt: now, entry: "centre" };
}

export function stepped(state: Playback, delta: number, now: number): Playback {
  if (!state.playing) return state;
  const step = clamp(state.step + delta, 0, lastStep(state));
  return { ...state, step, paused: true, stepStartedAt: now, entry: "centre" };
}
