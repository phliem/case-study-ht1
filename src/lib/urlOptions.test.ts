import { describe, expect, it } from "vitest";
import { parseUrlOptions } from "./urlOptions";

describe("parseUrlOptions", () => {
  it("defaults to the full tour with no recording", () => {
    expect(parseUrlOptions("")).toEqual({ record: null, tour: "full" });
  });

  it("reads the 16:9 recording mode", () => {
    expect(parseUrlOptions("?record=16x9")).toEqual({ record: "16x9", tour: "full" });
  });

  it("reads the 4:3 recording mode with the short tour", () => {
    expect(parseUrlOptions("?record=4x3&tour=short")).toEqual({ record: "4x3", tour: "short" });
  });

  it("ignores an aspect it does not know", () => {
    expect(parseUrlOptions("?record=21x9")).toEqual({ record: null, tour: "full" });
    expect(parseUrlOptions("?record")).toEqual({ record: null, tour: "full" });
  });
});
