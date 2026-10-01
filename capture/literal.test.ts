import { describe, expect, it } from "vitest";
import { extractObjectLiteral, paletteGroups } from "./literal";

const SOURCE = `
import { x } from "./y";
/** The brand blues. {not a brace that counts} */
export const COLORS = {
  blue: { DEFAULT: "#005eb8", dark: "#002f5c" }, // a trailing } in a comment
  green: "#007f3b",
  grey: { 1: "#4c6272", 2: "#768692" },
} as const;
export const OTHER = { a: "b" };
`;

describe("extractObjectLiteral", () => {
  it("reads an exported object literal, skipping comments", () => {
    expect(extractObjectLiteral(SOURCE, "COLORS")).toEqual({
      blue: { DEFAULT: "#005eb8", dark: "#002f5c" },
      green: "#007f3b",
      grey: { 1: "#4c6272", 2: "#768692" },
    });
  });

  it("throws for a name that is not declared", () => {
    expect(() => extractObjectLiteral(SOURCE, "MISSING")).toThrow("MISSING is not declared");
  });
});

describe("paletteGroups", () => {
  it("flattens a palette into named groups of swatches", () => {
    expect(paletteGroups(extractObjectLiteral(SOURCE, "COLORS"))).toEqual([
      {
        name: "blue",
        swatches: [
          { name: "blue", hex: "#005EB8" },
          { name: "blue-dark", hex: "#002F5C" },
        ],
      },
      { name: "green", swatches: [{ name: "green", hex: "#007F3B" }] },
      {
        name: "grey",
        swatches: [
          { name: "grey-1", hex: "#4C6272" },
          { name: "grey-2", hex: "#768692" },
        ],
      },
    ]);
  });

  it("rejects values that are not colours", () => {
    expect(() => paletteGroups({ blue: 3 })).toThrow(
      "blue is neither a colour nor a set of colours",
    );
  });
});
