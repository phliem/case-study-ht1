import { describe, expect, it } from "vitest";
import { edgeKey, screenOf } from "./flow";
import { REGISTRATION_FLOW } from "./registrationFlow";

const { screens, edges, journeys } = REGISTRATION_FLOW;
const edgeKeys = new Set(edges.map((edge) => edgeKey(edge.from, edge.to)));

describe("the registration flow", () => {
  it("gives every screen its own id", () => {
    expect(new Set(screens.map((screen) => screen.id)).size).toBe(screens.length);
  });

  it("joins only screens it has", () => {
    for (const edge of edges) {
      expect(() => screenOf(REGISTRATION_FLOW, edge.from)).not.toThrow();
      expect(() => screenOf(REGISTRATION_FLOW, edge.to)).not.toThrow();
    }
  });

  it("walks every journey along its edges, from the first screen to an end", () => {
    for (const journey of journeys) {
      const steps = journey.path.map((id) => screenOf(REGISTRATION_FLOW, id));
      expect(steps[0].column, journey.id).toBe(0);
      expect(steps.at(-1)?.end, journey.id).toBe(true);
      for (let index = 1; index < journey.path.length; index++) {
        expect(
          edgeKeys.has(edgeKey(journey.path[index - 1], journey.path[index])),
          journey.id,
        ).toBe(true);
      }
    }
  });

  it("leads nowhere from an end", () => {
    const ends = new Set(screens.filter((screen) => screen.end).map((screen) => screen.id));
    expect(edges.filter((edge) => ends.has(edge.from))).toEqual([]);
  });
});
