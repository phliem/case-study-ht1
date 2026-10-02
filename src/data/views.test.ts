import { describe, expect, it } from "vitest";
import { PAGE_IDS } from "./pages";
import { isViewId, VIEWS, viewHref } from "./views";

describe("VIEWS", () => {
  it("puts every comparison in exactly one view", () => {
    const listed: string[] = Object.values(VIEWS).flat();
    expect([...listed].sort()).toEqual([...PAGE_IDS].sort());
  });

  it("keeps the main page's three comparisons in their order", () => {
    expect(VIEWS.main).toEqual(["home", "article", "help"]);
  });
});

describe("isViewId", () => {
  it("recognises view ids", () => {
    expect(isViewId("main")).toBe(true);
    expect(isViewId("a-year-on")).toBe(true);
    expect(isViewId("year")).toBe(false);
    expect(isViewId(null)).toBe(false);
  });
});

describe("viewHref", () => {
  it("links to each view from the site root", () => {
    expect(viewHref("/", "main")).toBe("/");
    expect(viewHref("/", "a-year-on")).toBe("/?view=a-year-on");
  });

  it("keeps a sub-path base", () => {
    expect(viewHref("/work/bookable/", "main")).toBe("/work/bookable/");
    expect(viewHref("/work/bookable/", "a-year-on")).toBe("/work/bookable/?view=a-year-on");
  });
});
