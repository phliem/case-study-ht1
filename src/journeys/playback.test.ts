import { describe, expect, it } from "vitest";
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
import { REGISTRATION_FLOW } from "./registrationFlow";

const outside = REGISTRATION_FLOW.journeys[2];
const at = (step: number, isPaused = false): Playback => ({
  playing: true,
  journey: outside,
  step,
  paused: isPaused,
  stepStartedAt: 0,
  entry: "centre",
});

describe("playback", () => {
  it("starts a journey on its first screen", () => {
    expect(started(outside, 100)).toEqual({ ...at(0), stepStartedAt: 100 });
  });

  it("advances along the edge to the next screen", () => {
    expect(advanced(at(1), 500)).toEqual({ ...at(2), stepStartedAt: 500, entry: "edge" });
  });

  it("pauses on the last screen instead of advancing", () => {
    expect(advanced(at(3), 500)).toEqual(at(3, true));
  });

  it("pauses where it is", () => {
    expect(paused(at(1))).toEqual(at(1, true));
  });

  it("resumes on the same screen, or from the start once it has finished", () => {
    expect(resumed(at(1, true), 700)).toEqual({ ...at(1), stepStartedAt: 700 });
    expect(resumed(at(3, true), 700)).toEqual({ ...at(0), stepStartedAt: 700 });
  });

  it("steps by hand, pausing, and stays within the journey", () => {
    expect(stepped(at(1), 1, 900)).toEqual({ ...at(2, true), stepStartedAt: 900 });
    expect(stepped(at(0), -1, 900)).toEqual({ ...at(0, true), stepStartedAt: 900 });
    expect(stepped(at(3), 1, 900)).toEqual({ ...at(3, true), stepStartedAt: 900 });
  });

  it("stops, keeping the journey and step it was on", () => {
    expect(stopped(at(2, true))).toEqual({ ...at(2), playing: false });
  });

  it("ignores the player while stopped", () => {
    const state = idle(outside);
    expect(advanced(state, 1)).toBe(state);
    expect(paused(state)).toBe(state);
    expect(resumed(state, 1)).toBe(state);
    expect(stepped(state, 1, 1)).toBe(state);
  });
});
