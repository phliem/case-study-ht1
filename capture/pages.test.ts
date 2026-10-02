import { describe, expect, it } from "vitest";
import { PAGE_IDS, sectionIds } from "../src/data/pages";
import { isReused } from "../src/data/reuse";
import type { PageId, Version } from "../src/data/types";
import { anchorList, buildsFor, PAGE_SOURCES, shotSides } from "./pages";

const VERSIONS: readonly Version[] = ["before", "after"];

function pinnedIds(page: PageId, version: Version): string[] {
  const shot = shotSides([page]).find((entry) => entry.version === version);
  if (!shot) throw new Error(`The ${page} ${version} side is not shot`);
  return shot.side.pinned.map((query) => query.id);
}

describe("PAGE_SOURCES", () => {
  it("anchors every group of every side that is shot", () => {
    for (const { page, version } of shotSides(PAGE_IDS)) {
      expect(anchorList(page, version).map(([id]) => id)).toEqual(sectionIds(page));
    }
  });

  it("starts every page at its top and ends it on the footer after main", () => {
    for (const { page, version } of shotSides(PAGE_IDS)) {
      const kinds = anchorList(page, version).map(([, anchor]) => anchor.kind);
      expect(kinds.at(0)).toBe("page-top");
      expect(kinds.at(-1)).toBe("footer-after-main");
    }
  });

  it("leaves only the old how-to page without common questions and the 2025 homepage without areas", () => {
    const absent = shotSides(PAGE_IDS).flatMap(({ page, version }) =>
      anchorList(page, version)
        .filter(([, anchor]) => anchor.kind === "absent")
        .map(([id]) => `${page} ${version} ${id}`),
    );
    expect(absent).toEqual(["article before questions", "home-2025 before areas"]);
  });

  it("pins the new pages' sticky parts and none of the old pages'", () => {
    expect(PAGE_IDS.map((page) => pinnedIds(page, "before"))).toEqual([[], [], [], []]);
    expect(pinnedIds("home", "after")).toEqual(["header"]);
    expect(pinnedIds("article", "after")).toEqual(["header", "breadcrumbs", "contents"]);
    expect(pinnedIds("help", "after")).toEqual(["header", "breadcrumbs"]);
  });

  it("shoots no side whose capture is reused", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        expect(PAGE_SOURCES[page][version] === null, `${page} ${version}`).toBe(
          isReused(page, version),
        );
      }
    }
  });

  it("has no anchors for a reused side", () => {
    expect(() => anchorList("home-2025", "after")).toThrow(
      "The home-2025 after side reuses another page's capture",
    );
  });
});

describe("buildsFor", () => {
  it("builds only what the chosen pages need", () => {
    expect(buildsFor(["home"])).toEqual(["home-before", "after"]);
    expect(buildsFor(["article", "help"])).toEqual(["article-before", "after", "help-before"]);
    expect(buildsFor(["home-2025"])).toEqual(["home-2025"]);
  });
});
