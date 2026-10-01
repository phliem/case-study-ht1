import { describe, expect, it } from "vitest";
import type { SectionId } from "../data/types";
import {
  durationOf,
  FULL_TOUR,
  type PlayScript,
  type ScrollResolver,
  SHORT_TOUR,
  stateAt,
} from "./playScript";

const TOPS: Record<"desktop" | "mobile", Record<SectionId, number>> = {
  desktop: { hero: 0, proof: 1000, how: 2000, "faq-about": 3000, areas: 4000, footer: 4500 },
  mobile: { hero: 0, proof: 3000, how: 6000, "faq-about": 9000, areas: 12000, footer: 13000 },
};

const resolve: ScrollResolver = (device, target) => (target === "top" ? 0 : TOPS[device][target]);

function startOf(script: PlayScript, index: number): number {
  return script.steps.slice(0, index).reduce((total, step) => total + step.ms, 0);
}

describe("stateAt", () => {
  it("starts on desktop at the top with the frame all before", () => {
    expect(stateAt(FULL_TOUR, 0, resolve)).toEqual({
      device: "desktop",
      divider: 1,
      scrollTop: 0,
      target: "top",
      stepIndex: 0,
    });
  });

  it("is halfway through the opening sweep at 800ms", () => {
    expect(stateAt(FULL_TOUR, 800, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("settles the divider in the middle once the opening sweep ends", () => {
    expect(stateAt(FULL_TOUR, 2400, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("glides to the social proof group on the current device", () => {
    expect(stateAt(FULL_TOUR, 3000, resolve).scrollTop).toBeCloseTo(500, 6);
    expect(stateAt(FULL_TOUR, 3600, resolve)).toMatchObject({ scrollTop: 1000, target: "proof" });
  });

  it("swings the divider to its via point halfway through a hold", () => {
    expect(stateAt(FULL_TOUR, 4800, resolve).divider).toBeCloseTo(0.25, 6);
  });

  it("brings the divider back to where the hold began", () => {
    expect(stateAt(FULL_TOUR, 6000, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("switches device as soon as the device step begins and keeps the scroll target", () => {
    const deviceStep = FULL_TOUR.steps.findIndex((step) => step.kind === "device");
    expect(stateAt(FULL_TOUR, startOf(FULL_TOUR, deviceStep) + 1, resolve)).toMatchObject({
      device: "mobile",
      target: "top",
      scrollTop: 0,
    });
  });

  it("ends on desktop at the top with the divider in the middle", () => {
    const end = stateAt(FULL_TOUR, durationOf(FULL_TOUR), resolve);
    expect(end).toMatchObject({
      device: "desktop",
      scrollTop: 0,
      target: "top",
      stepIndex: FULL_TOUR.steps.length,
    });
    expect(end.divider).toBeCloseTo(0.5, 6);
  });

  it("holds the end state once the script has finished", () => {
    const end = stateAt(FULL_TOUR, durationOf(FULL_TOUR), resolve);
    expect(stateAt(FULL_TOUR, durationOf(FULL_TOUR) + 5000, resolve)).toEqual(end);
  });

  it("cuts straight to the end of the current step", () => {
    expect(stateAt(FULL_TOUR, 100, resolve, true).divider).toBe(0);
  });

  it("offers a short cut under 20 seconds that ends where the full tour ends", () => {
    expect(durationOf(SHORT_TOUR)).toBeLessThan(20_000);
    expect(durationOf(SHORT_TOUR)).toBeLessThan(durationOf(FULL_TOUR));
    const end = stateAt(SHORT_TOUR, durationOf(SHORT_TOUR), resolve);
    expect(end).toMatchObject({ device: "desktop", scrollTop: 0 });
    expect(end.divider).toBeCloseTo(0.5, 6);
  });
});
