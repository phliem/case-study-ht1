import { describe, expect, it } from "vitest";
import { PAGE_IDS } from "./pages";
import { VIEWS } from "./views";

describe("VIEWS", () => {
  it("puts every comparison in exactly one view", () => {
    const listed: string[] = Object.values(VIEWS).flat();
    expect([...listed].sort()).toEqual([...PAGE_IDS].sort());
  });

  it("keeps the main page's three comparisons in their order", () => {
    expect(VIEWS.main).toEqual(["home", "article", "help"]);
  });
});
