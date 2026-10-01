import { describe, expect, it } from "vitest";
import { assertSections } from "./sections";

const VALID = [
  { id: "hero", top: 0 },
  { id: "proof", top: 804 },
  { id: "how", top: 2100 },
  { id: "faq-about", top: 3300 },
  { id: "areas", top: 5200 },
  { id: "footer", top: 5800 },
];

describe("assertSections", () => {
  it("passes six ascending groups in order", () => {
    expect(assertSections(VALID)).toEqual(VALID);
  });

  it("rejects groups out of order", () => {
    const swapped = [VALID[0], VALID[2], VALID[1], ...VALID.slice(3)];
    expect(() => assertSections(swapped)).toThrow("Sections came back as hero,how,proof");
  });

  it("rejects a group that does not start below the one before", () => {
    const flat = VALID.map((section, index) => (index === 2 ? { ...section, top: 804 } : section));
    expect(() => assertSections(flat)).toThrow("how starts at 804px, not below proof at 804px");
  });
});
