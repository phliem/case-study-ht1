import { describe, expect, it } from "vitest";
import { PAGE_IDS } from "../src/data/pages";
import type {
  Capture,
  CapturesFile,
  Device,
  MeasuredTokens,
  PageId,
  Version,
} from "../src/data/types";
import { type HomeExtras, mergeCaptures } from "./merge";

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

function fake(page: PageId, version: Version, device: Device, commit: string): Capture {
  return {
    page,
    version,
    device,
    commit,
    capturedAt: "2026-10-01T12:00:00.000Z",
    viewport: { width: 1440, height: 900 },
    scale: 2,
    pageHeight: 3000,
    tiles: [],
    sections: [],
    pinned: [],
    loops: [],
  };
}

function pageCaptures(page: PageId, commit: string): Capture[] {
  return VERSIONS.flatMap((version) =>
    DEVICES.map((device) => fake(page, version, device, commit)),
  );
}

const TOKENS: MeasuredTokens = {
  headline: {
    fontFamily: "Frutiger",
    fontSize: "48px",
    lineHeight: "56px",
    letterSpacing: "normal",
    fontWeight: "700",
  },
  heroGround: "rgb(0, 94, 184)",
  search: { borderRadius: "4px", boxShadow: "none" },
  card: { borderRadius: "4px", boxShadow: "none" },
};

function extras(radius: string): HomeExtras {
  return {
    tokens: { before: TOKENS, after: TOKENS },
    palettes: { before: [], after: [] },
    radiusScale: [radius],
    specimens: { frutiger: "captures/specimen-frutiger.png" },
  };
}

const EXISTING: CapturesFile = {
  captures: PAGE_IDS.flatMap((page) => pageCaptures(page, "old")),
  ...extras("4px"),
};

describe("mergeCaptures", () => {
  it("replaces one page's captures and leaves every other entry as it was", () => {
    const merged = mergeCaptures(EXISTING, pageCaptures("article", "new"), null);
    expect(merged.captures.map((capture) => `${capture.page}:${capture.commit}`)).toEqual([
      ...Array.from({ length: 4 }, () => "home:old"),
      ...Array.from({ length: 4 }, () => "article:new"),
      ...Array.from({ length: 4 }, () => "help:old"),
      ...Array.from({ length: 4 }, () => "carenav:old"),
      ...Array.from({ length: 4 }, () => "search:old"),
      ...Array.from({ length: 4 }, () => "gp:old"),
      ...Array.from({ length: 4 }, () => "booking:old"),
      ...Array.from({ length: 4 }, () => "clinician:old"),
    ]);
    const untouched = (file: CapturesFile) =>
      JSON.stringify(file.captures.filter((capture) => capture.page !== "article"));
    expect(untouched(merged)).toBe(untouched(EXISTING));
  });

  it("replaces only the versions it was given", () => {
    const after = pageCaptures("gp", "new").filter((capture) => capture.version === "after");
    const merged = mergeCaptures(EXISTING, after, null);
    expect(
      merged.captures
        .filter((capture) => capture.page === "gp")
        .map((capture) => `${capture.version} ${capture.device}:${capture.commit}`),
    ).toEqual(["before desktop:old", "before mobile:old", "after desktop:new", "after mobile:new"]);
  });

  it("orders captures by page, then version, then device", () => {
    const merged = mergeCaptures(EXISTING, pageCaptures("help", "new").reverse(), null);
    expect(
      merged.captures.slice(8, 12).map((capture) => `${capture.version} ${capture.device}`),
    ).toEqual(["before desktop", "before mobile", "after desktop", "after mobile"]);
  });

  it("keeps the homepage extras unless the homepage was captured", () => {
    expect(mergeCaptures(EXISTING, pageCaptures("help", "new"), null).radiusScale).toEqual(["4px"]);
    expect(mergeCaptures(EXISTING, pageCaptures("home", "new"), extras("8px")).radiusScale).toEqual(
      ["8px"],
    );
  });

  it("refuses to write a file that is missing a page", () => {
    expect(() => mergeCaptures(null, pageCaptures("article", "new"), null)).toThrow(
      "captures.json would have 0 home before desktop captures",
    );
  });

  it("refuses a first file without the homepage extras", () => {
    const everything = PAGE_IDS.flatMap((page) => pageCaptures(page, "new"));
    expect(() => mergeCaptures(null, everything, null)).toThrow(
      "The homepage's tokens and palettes come from a homepage capture",
    );
  });

  it("writes the file's fields in a fixed order", () => {
    expect(Object.keys(mergeCaptures(EXISTING, pageCaptures("help", "new"), null))).toEqual([
      "captures",
      "tokens",
      "palettes",
      "radiusScale",
      "specimens",
    ]);
  });
});
