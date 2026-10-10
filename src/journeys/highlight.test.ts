import { describe, expect, it } from "vitest";
import { journeySoFar, routeTo } from "./highlight";
import { REGISTRATION_FLOW } from "./registrationFlow";

const [uk] = REGISTRATION_FLOW.journeys;

describe("routeTo", () => {
  it("traces every route that reaches a screen", () => {
    const route = routeTo(REGISTRATION_FLOW.edges, "health");
    expect(route.active).toBe("health");
    expect([...route.screens].sort()).toEqual([
      "about",
      "abroad",
      "contact",
      "health",
      "postcode",
      "practice",
      "prevgp",
    ]);
    expect([...route.edges].sort()).toEqual([
      "about-contact",
      "abroad-health",
      "contact-abroad",
      "contact-prevgp",
      "postcode-about",
      "practice-postcode",
      "prevgp-health",
    ]);
  });

  it("lights only the first screen when nothing leads to it", () => {
    const route = routeTo(REGISTRATION_FLOW.edges, "practice");
    expect([...route.screens]).toEqual(["practice"]);
    expect([...route.edges]).toEqual([]);
  });
});

describe("journeySoFar", () => {
  it("lights the screens and edges played so far, ending on the current step", () => {
    const played = journeySoFar(uk, 2);
    expect(played.active).toBe("about");
    expect([...played.screens]).toEqual(["practice", "postcode", "about"]);
    expect([...played.edges]).toEqual(["practice-postcode", "postcode-about"]);
  });
});
