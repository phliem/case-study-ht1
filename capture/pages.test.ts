import { describe, expect, it } from "vitest";
import { PAGE_IDS, sectionIds } from "../src/data/pages";
import type { Version } from "../src/data/types";
import { anchorList, buildsFor, isFlowPage, PAGE_SOURCES, type StaticPageId } from "./pages";

const STATIC_PAGE_IDS = PAGE_IDS.filter((page): page is StaticPageId => !isFlowPage(page));

const VERSIONS: readonly Version[] = ["before", "after"];

function pinnedIds(page: StaticPageId, version: Version): string[] {
  return PAGE_SOURCES[page][version].pinned.map((query) => query.id);
}

describe("PAGE_SOURCES", () => {
  it("anchors every group of every page on both versions", () => {
    for (const page of STATIC_PAGE_IDS) {
      for (const version of VERSIONS) {
        expect(anchorList(page, version).map(([id]) => id)).toEqual(sectionIds(page));
      }
    }
  });

  it("starts every page at its top and ends it on the footer after main", () => {
    for (const page of STATIC_PAGE_IDS) {
      for (const version of VERSIONS) {
        const kinds = anchorList(page, version).map(([, anchor]) => anchor.kind);
        expect(kinds.at(0)).toBe("page-top");
        expect(kinds.at(-1)).toBe("footer-after-main");
      }
    }
  });

  it("marks only the sections an old page did not have as absent", () => {
    const absent = STATIC_PAGE_IDS.flatMap((page) =>
      VERSIONS.flatMap((version) =>
        anchorList(page, version)
          .filter(([, anchor]) => anchor.kind === "absent")
          .map(([id]) => `${page} ${version} ${id}`),
      ),
    );
    expect(absent).toEqual([
      "article before questions",
      "search before about",
      "gp before questions",
    ]);
  });

  it("pins each page's sticky parts", () => {
    expect(STATIC_PAGE_IDS.map((page) => pinnedIds(page, "before"))).toEqual([
      [],
      [],
      [],
      ["controls", "map"],
      [],
      [],
    ]);
    expect(pinnedIds("home", "after")).toEqual(["header"]);
    expect(pinnedIds("article", "after")).toEqual(["header", "breadcrumbs", "contents"]);
    expect(pinnedIds("help", "after")).toEqual(["header", "breadcrumbs"]);
    expect(pinnedIds("search", "after")).toEqual(["header"]);
    expect(pinnedIds("gp", "after")).toEqual(["header"]);
    expect(pinnedIds("clinician", "after")).toEqual(["header"]);
  });
});

describe("NHS header and footer", () => {
  it("gives the NHS footer to exactly the before pages built after the v2 footer", () => {
    const wearing = STATIC_PAGE_IDS.filter((page) => PAGE_SOURCES[page].before.nhsFooter === true);
    expect(wearing).toEqual(["gp", "clinician"]);
    expect(STATIC_PAGE_IDS.filter((page) => PAGE_SOURCES[page].after.nhsFooter === true)).toEqual(
      [],
    );
  });

  it("gives the NHS header to exactly the before pages built after the v2 header", () => {
    const wearing = STATIC_PAGE_IDS.filter((page) => PAGE_SOURCES[page].before.nhsHeader === true);
    expect(wearing).toEqual(["gp", "clinician"]);
  });
});

describe("buildsFor", () => {
  it("builds only what the chosen pages need", () => {
    expect(buildsFor(["home"])).toEqual(["home-before", "after"]);
    expect(buildsFor(["article", "help"])).toEqual(["article-before", "after", "help-before"]);
    expect(buildsFor(["search"])).toEqual(["search-before", "latest"]);
    expect(buildsFor(["gp", "clinician"])).toEqual([
      "gp-before",
      "latest",
      "clinician-before",
      "home-before",
      "header-before",
    ]);
  });
});
