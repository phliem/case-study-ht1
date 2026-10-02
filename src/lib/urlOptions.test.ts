import { describe, expect, it } from "vitest";
import { parseUrlOptions } from "./urlOptions";

describe("parseUrlOptions", () => {
  it("defaults to the full tour with no recording", () => {
    expect(parseUrlOptions("")).toEqual({ record: null, tour: "full", page: "home", view: "main" });
  });

  it("reads the 16:9 recording mode", () => {
    expect(parseUrlOptions("?record=16x9")).toEqual({
      record: "16x9",
      tour: "full",
      page: "home",
      view: "main",
    });
  });

  it("reads the 4:3 recording mode with the short tour", () => {
    expect(parseUrlOptions("?record=4x3&tour=short")).toEqual({
      record: "4x3",
      tour: "short",
      page: "home",
      view: "main",
    });
  });

  it("ignores an aspect it does not know", () => {
    expect(parseUrlOptions("?record=21x9")).toEqual({
      record: null,
      tour: "full",
      page: "home",
      view: "main",
    });
    expect(parseUrlOptions("?record")).toEqual({
      record: null,
      tour: "full",
      page: "home",
      view: "main",
    });
  });

  it("reads the page to record", () => {
    expect(parseUrlOptions("?record=16x9&page=article")).toEqual({
      record: "16x9",
      tour: "full",
      page: "article",
      view: "main",
    });
  });

  it("falls back to the homepage for a page it does not know", () => {
    expect(parseUrlOptions("?record=16x9&page=nope").page).toBe("home");
    expect(parseUrlOptions("?page").page).toBe("home");
  });

  it("opens the year-on view", () => {
    expect(parseUrlOptions("?view=a-year-on")).toEqual({
      record: null,
      tour: "full",
      page: "home-2025",
      view: "a-year-on",
    });
  });

  it("opens the main view for a view it does not know", () => {
    expect(parseUrlOptions("?view=year").view).toBe("main");
    expect(parseUrlOptions("?view=A-YEAR-ON").view).toBe("main");
    expect(parseUrlOptions("?view").view).toBe("main");
  });

  it("records the view's first comparison unless a page is asked for", () => {
    expect(parseUrlOptions("?view=a-year-on&record=16x9").page).toBe("home-2025");
    expect(parseUrlOptions("?view=a-year-on&record=16x9&page=help").page).toBe("help");
    expect(parseUrlOptions("?record=16x9&page=home-2025")).toEqual({
      record: "16x9",
      tour: "full",
      page: "home-2025",
      view: "main",
    });
  });

  it("keeps the year-on view when a page is asked for outside recording", () => {
    expect(parseUrlOptions("?view=a-year-on&page=article")).toEqual({
      record: null,
      tour: "full",
      page: "article",
      view: "a-year-on",
    });
  });
});
