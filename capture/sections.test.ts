import { describe, expect, it } from "vitest";
import { resolveSections } from "./sections";

const VALID = [
  { id: "hero", top: 0 },
  { id: "proof", top: 804 },
  { id: "how", top: 2100 },
  { id: "faq-about", top: 3300 },
  { id: "areas", top: 5200 },
  { id: "footer", top: 5800 },
];

describe("resolveSections", () => {
  it("passes a page's groups in order", () => {
    expect(resolveSections("home", VALID, 6400)).toEqual(VALID);
  });

  it("rejects groups out of order", () => {
    const swapped = [VALID[0], VALID[2], VALID[1], ...VALID.slice(3)];
    expect(() => resolveSections("home", swapped, 6400)).toThrow(
      "Sections came back as hero,how,proof",
    );
  });

  it("rejects a group that does not start below the one before", () => {
    const flat = VALID.map((section, index) => (index === 2 ? { ...section, top: 804 } : section));
    expect(() => resolveSections("home", flat, 6400)).toThrow(
      "how starts at 804px, not below proof at 804px",
    );
  });

  it("gives an absent group the next group's top", () => {
    const found = [
      { id: "title", top: 0 },
      { id: "guide", top: 310 },
      { id: "questions", top: null },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ];
    expect(resolveSections("article", found, 2100)).toEqual([
      { id: "title", top: 0 },
      { id: "guide", top: 310 },
      { id: "questions", top: 1450 },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ]);
  });

  it("still rejects a group that starts above an absent one", () => {
    const found = [
      { id: "title", top: 0 },
      { id: "guide", top: 1500 },
      { id: "questions", top: null },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ];
    expect(() => resolveSections("article", found, 2100)).toThrow(
      "questions starts at 1450px, not below guide at 1500px",
    );
  });
});
