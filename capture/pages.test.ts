import { describe, expect, it } from "vitest";
import { PAGE_IDS, sectionIds } from "../src/data/pages";
import type { PageId, Version } from "../src/data/types";
import { anchorList, buildsFor, PAGE_SOURCES } from "./pages";

const VERSIONS: readonly Version[] = ["before", "after"];

function pinnedIds(page: PageId, version: Version): string[] {
  return PAGE_SOURCES[page][version].pinned.map((query) => query.id);
}

describe("PAGE_SOURCES", () => {
  it("anchors every group of every page on both versions", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        expect(anchorList(page, version).map(([id]) => id)).toEqual(sectionIds(page));
      }
    }
  });

  it("starts every page at its top and ends it on the footer after main", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        const kinds = anchorList(page, version).map(([, anchor]) => anchor.kind);
        expect(kinds.at(0)).toBe("page-top");
        expect(kinds.at(-1)).toBe("footer-after-main");
      }
    }
  });

  it("leaves only the old how-to page without common questions", () => {
    const absent = PAGE_IDS.flatMap((page) =>
      VERSIONS.flatMap((version) =>
        anchorList(page, version)
          .filter(([, anchor]) => anchor.kind === "absent")
          .map(([id]) => `${page} ${version} ${id}`),
      ),
    );
    expect(absent).toEqual(["article before questions"]);
  });

  it("pins the new pages' sticky parts and none of the old pages'", () => {
    expect(PAGE_IDS.map((page) => pinnedIds(page, "before"))).toEqual([[], [], []]);
    expect(pinnedIds("home", "after")).toEqual(["header"]);
    expect(pinnedIds("article", "after")).toEqual(["header", "breadcrumbs", "contents"]);
    expect(pinnedIds("help", "after")).toEqual(["header", "breadcrumbs"]);
  });
});

describe("buildsFor", () => {
  it("builds only what the chosen pages need", () => {
    expect(buildsFor(["home"])).toEqual(["home-before", "after"]);
    expect(buildsFor(["article", "help"])).toEqual(["article-before", "after", "help-before"]);
  });
});
