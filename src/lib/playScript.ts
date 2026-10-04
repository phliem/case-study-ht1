import type { Device, PageId, SectionId } from "../data/types";
import { easeInOutCubic, lerp } from "./math";

export type ScrollTarget = SectionId | "top";

export type PlayStep =
  | { kind: "divider"; to: number; ms: number }
  | { kind: "glide"; to: ScrollTarget; ms: number }
  | { kind: "hold"; via: number; ms: number }
  | { kind: "device"; to: Device; ms: number };

export type PlayScript = {
  start: { device: Device; divider: number };
  steps: readonly PlayStep[];
};

export type PlayState = {
  device: Device;
  divider: number;
  scrollTop: number;
  target: ScrollTarget;
  stepIndex: number;
};

export type ScrollResolver = (device: Device, target: ScrollTarget) => number;

function tour(stops: readonly SectionId[]): PlayStep[] {
  return stops.flatMap((stop): PlayStep[] => [
    { kind: "glide", to: stop, ms: 1200 },
    { kind: "hold", via: 0.25, ms: 2400 },
  ]);
}

const OPENING_SWEEP: PlayStep[] = [
  { kind: "divider", to: 0, ms: 1600 },
  { kind: "divider", to: 0.5, ms: 800 },
];

const MOBILE_SWEEP: PlayStep[] = [
  { kind: "glide", to: "top", ms: 1200 },
  { kind: "device", to: "mobile", ms: 800 },
  { kind: "divider", to: 1, ms: 600 },
  { kind: "divider", to: 0, ms: 1200 },
  { kind: "divider", to: 0.5, ms: 600 },
];

function fullTour(
  desktopStops: readonly SectionId[],
  mobileStops: readonly SectionId[],
): PlayScript {
  return {
    start: { device: "desktop", divider: 1 },
    steps: [
      ...OPENING_SWEEP,
      ...tour(desktopStops),
      ...MOBILE_SWEEP,
      ...tour(mobileStops),
      { kind: "glide", to: "top", ms: 1200 },
      { kind: "device", to: "desktop", ms: 800 },
    ],
  };
}

function shortTour(stops: readonly SectionId[]): PlayScript {
  return {
    start: { device: "desktop", divider: 1 },
    steps: [
      ...OPENING_SWEEP,
      ...tour(stops),
      ...MOBILE_SWEEP,
      { kind: "device", to: "desktop", ms: 800 },
    ],
  };
}

export type Tours = { full: PlayScript; short: PlayScript };

export const TOURS: Record<PageId, Tours> = {
  home: {
    full: fullTour(["proof", "how", "faq-about", "areas", "footer"], ["proof", "how"]),
    short: shortTour(["proof", "how"]),
  },
  article: {
    full: fullTour(["guide", "questions", "next", "footer"], ["guide", "questions"]),
    short: shortTour(["guide", "questions"]),
  },
  help: {
    full: fullTour(["questions", "more-help", "footer"], ["questions", "more-help"]),
    short: shortTour(["questions", "more-help"]),
  },
};

export function durationOf(script: PlayScript): number {
  return script.steps.reduce((total, step) => total + step.ms, 0);
}

function applyStep(
  state: PlayState,
  step: PlayStep,
  progress: number,
  resolve: ScrollResolver,
  stepIndex: number,
): PlayState {
  switch (step.kind) {
    case "divider":
      return {
        ...state,
        stepIndex,
        divider: lerp(state.divider, step.to, easeInOutCubic(progress)),
      };
    case "glide":
      return {
        ...state,
        stepIndex,
        target: step.to,
        scrollTop: lerp(state.scrollTop, resolve(state.device, step.to), easeInOutCubic(progress)),
      };
    case "hold":
      return {
        ...state,
        stepIndex,
        divider: lerp(state.divider, step.via, (1 - Math.cos(2 * Math.PI * progress)) / 2),
      };
    case "device":
      return { ...state, stepIndex, device: step.to, scrollTop: resolve(step.to, state.target) };
  }
}

export function stateAt(
  script: PlayScript,
  elapsedMs: number,
  resolve: ScrollResolver,
  cut = false,
): PlayState {
  let state: PlayState = {
    device: script.start.device,
    divider: script.start.divider,
    scrollTop: resolve(script.start.device, "top"),
    target: "top",
    stepIndex: 0,
  };
  let remaining = Math.max(0, elapsedMs);
  for (const [index, step] of script.steps.entries()) {
    const finished = remaining >= step.ms;
    state = applyStep(state, step, finished || cut ? 1 : remaining / step.ms, resolve, index);
    if (!finished) return state;
    remaining -= step.ms;
  }
  return { ...state, stepIndex: script.steps.length };
}
