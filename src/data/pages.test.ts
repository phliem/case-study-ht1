import { describe, expect, it } from "vitest";
import { CHANGES } from "./changes";
import { addressOf, isPageId, PAGE_IDS, PAGES, sectionIds, sectionLabel } from "./pages";
import { VIEWS } from "./views";

describe("pages", () => {
  it("lists every page's groups in the order its notes are written", () => {
    for (const page of PAGE_IDS) expect(sectionIds(page)).toEqual(Object.keys(CHANGES[page]));
  });

  it("gives every group two or three notes", () => {
    for (const page of PAGE_IDS) {
      for (const notes of Object.values(CHANGES[page])) {
        expect(notes.length).toBeGreaterThanOrEqual(2);
        expect(notes.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("labels each page's groups", () => {
    expect(sectionLabel("home", "how")).toBe("How it works");
    expect(sectionLabel("article", "questions")).toBe("Common questions");
    expect(sectionLabel("help", "questions")).toBe("Questions");
    expect(sectionLabel("home-2025", "proof-how")).toBe("Reviews & how it works");
    expect(sectionLabel("home-2025", "faq-about")).toBe("FAQ & About");
    expect(() => sectionLabel("help", "hero")).toThrow("hero is not a group of the help page");
  });

  it("addresses each frame by the after page's path", () => {
    expect(addressOf("home")).toBe("bookable.health");
    expect(addressOf("article")).toBe("bookable.health/book-a-gp-appointment");
    expect(addressOf("help")).toBe("bookable.health/help");
    expect(addressOf("home-2025")).toBe("bookable.health");
  });

  it("recognises page ids", () => {
    expect(isPageId("article")).toBe(true);
    expect(isPageId("home-2025")).toBe(true);
    expect(isPageId("faq")).toBe(false);
    expect(isPageId(null)).toBe(false);
  });

  it("gives an intro to the main page's comparisons only", () => {
    expect(PAGE_IDS.filter((page) => PAGES[page].intro === null)).toEqual(["home-2025"]);
    expect(VIEWS.main.map((page) => PAGES[page].intro?.number)).toEqual(["01", "02", "03"]);
  });
});
