import { describe, expect, it } from "vitest";
import { CHANGES } from "./changes";
import { addressOf, isPageId, PAGE_IDS, sectionIds, sectionLabel } from "./pages";

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
    expect(() => sectionLabel("help", "hero")).toThrow("hero is not a group of the help page");
  });

  it("addresses each frame by the after page's path", () => {
    expect(addressOf("home")).toBe("bookable.health");
    expect(addressOf("article")).toBe("bookable.health/articles/book-a-gp-appointment");
    expect(addressOf("help")).toBe("bookable.health/help");
    expect(addressOf("search")).toBe("bookable.health/gp/search");
    expect(addressOf("clinician")).toBe("bookable.health/clinician/cli_9a5qmmqhn4r5");
  });

  it("recognises page ids", () => {
    expect(isPageId("article")).toBe(true);
    expect(isPageId("faq")).toBe(false);
    expect(isPageId(null)).toBe(false);
  });
});
