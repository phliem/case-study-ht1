import { describe, expect, it } from "vitest";
import {
  colourCount,
  groundSummary,
  headlineSummary,
  rgbToHex,
  shadowSummary,
  splitTopLevel,
  typefaceName,
} from "./tokenFormat";

describe("typefaceName", () => {
  it("names the faces behind next/font's generated families", () => {
    expect(typefaceName("__frutiger_5a2b7c, __frutiger_Fallback_5a2b7c")).toBe("Frutiger");
    expect(
      typefaceName('"__Hanken_Grotesk_a1b2c3", "__Hanken_Grotesk_Fallback_a1b2c3", system-ui'),
    ).toBe("Hanken Grotesk");
    expect(typefaceName('"Helvetica Neue", Arial')).toBe("Helvetica Neue");
  });
});

describe("headlineSummary", () => {
  it("joins size, leading, weight and tracking", () => {
    const base = { fontFamily: "x", fontSize: "64px", fontWeight: "600" };
    expect(headlineSummary({ ...base, lineHeight: "72px", letterSpacing: "normal" })).toBe(
      "64px / 72px · 600 · no tracking",
    );
    expect(
      headlineSummary({ ...base, lineHeight: "64px", letterSpacing: "-2.24px", fontWeight: "800" }),
    ).toBe("64px / 64px · 800 · -2.24px tracking");
  });
});

describe("splitTopLevel", () => {
  it("splits on commas outside brackets", () => {
    expect(splitTopLevel("a(1, 2), b, c(3)")).toEqual(["a(1, 2)", "b", "c(3)"]);
  });
});

describe("shadowSummary", () => {
  it("counts the layers and finds the deepest blur", () => {
    expect(
      shadowSummary("rgba(0, 0, 0, 0.24) 0px 8px 48px 0px, rgb(216, 221, 224) 0px 4px 0px 0px"),
    ).toBe("2 layers, up to 48px blur");
    expect(shadowSummary("rgba(3, 20, 45, 0.42) 0px 30px 72px 0px")).toBe("1 layer, 72px blur");
    expect(shadowSummary("none")).toBe("No shadow");
  });

  it("ignores the fully transparent layers Tailwind's ring utilities leave behind", () => {
    const ring = "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px";
    expect(shadowSummary(`${ring}, rgba(3, 20, 45, 0.42) 0px 30px 72px 0px`)).toBe(
      "1 layer, 72px blur",
    );
    expect(shadowSummary(ring)).toBe("No shadow");
  });
});

describe("groundSummary", () => {
  it("describes a flat colour by its hex", () => {
    expect(rgbToHex("rgb(0, 94, 184)")).toBe("#005EB8");
    expect(groundSummary("rgb(0, 94, 184)")).toBe("Flat #005EB8");
  });

  it("counts a radial gradient's stops", () => {
    expect(
      groundSummary(
        "radial-gradient(125% 130% at 12% 0%, rgb(19, 135, 204) 0%, rgb(10, 99, 172) 40%, rgb(8, 63, 128) 72%, rgb(5, 47, 96) 100%)",
      ),
    ).toBe("Radial gradient, 4 stops");
  });
});

describe("colourCount", () => {
  it("counts every swatch in every group", () => {
    expect(
      colourCount([
        {
          name: "blue",
          swatches: [
            { name: "blue", hex: "#005EB8" },
            { name: "blue-dark", hex: "#002F5C" },
          ],
        },
        { name: "green", swatches: [{ name: "green", hex: "#007F3B" }] },
      ]),
    ).toBe(3);
  });
});
