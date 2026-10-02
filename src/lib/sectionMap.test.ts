import { describe, expect, it } from "vitest";
import type { SectionId, SectionTop } from "../data/types";
import { createSectionMap, type PageLayout } from "./sectionMap";

const IDS: readonly SectionId[] = ["hero", "proof", "how", "faq-about", "areas", "footer"];

function layout(heights: readonly number[], ids: readonly SectionId[] = IDS): PageLayout {
  let top = 0;
  const sections: SectionTop[] = heights.map((height, index) => {
    const section = { id: ids[index], top };
    top += height;
    return section;
  });
  return { sections, pageHeight: top };
}

function scrollAnchoredAt(anchor: number, page: PageLayout, maxScroll: number): number {
  return (anchor / page.pageHeight) * maxScroll;
}

const AFTER = layout([800, 1500, 1100, 1300, 400, 450]);
const BEFORE = layout([700, 2600, 900, 2100, 300, 600]);
const VIEWPORT = 900;

describe("createSectionMap", () => {
  it("maps a page onto an identical page one to one", () => {
    const page = layout([900, 1200, 1000, 1600, 500, 400]);
    const map = createSectionMap(page, page, VIEWPORT);
    for (const scroll of [0, 250, 1234, 3000, map.maxScrollA]) {
      expect(map.mapScroll(scroll)).toBeCloseTo(scroll, 6);
    }
  });

  it("puts the top on the top and the bottom on the bottom", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.mapScroll(0)).toBe(0);
    expect(map.mapScroll(map.maxScrollA)).toBe(map.maxScrollB);
  });

  it("lands a group boundary on the same group boundary", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    const scrollA = scrollAnchoredAt(AFTER.sections[2].top, AFTER, map.maxScrollA);
    const expected = scrollAnchoredAt(BEFORE.sections[2].top, BEFORE, map.maxScrollB);
    expect(map.mapScroll(scrollA)).toBeCloseTo(expected, 6);
  });

  it("lands the middle of the swapped FAQ and About group on the middle of its pair", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    const middleA = AFTER.sections[3].top + 1300 / 2;
    const middleB = BEFORE.sections[3].top + 2100 / 2;
    const scrollA = scrollAnchoredAt(middleA, AFTER, map.maxScrollA);
    expect(map.mapScroll(scrollA)).toBeCloseTo(
      scrollAnchoredAt(middleB, BEFORE, map.maxScrollB),
      6,
    );
  });

  it("clamps scroll positions outside the page", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.mapScroll(-100)).toBe(0);
    expect(map.mapScroll(map.maxScrollA + 500)).toBe(map.maxScrollB);
  });

  it("never moves the before page backwards while the after page scrolls down", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    let previous = -1;
    for (let scroll = 0; scroll <= map.maxScrollA; scroll += 7) {
      const value = map.mapScroll(scroll);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("works for tall phone pages with a shorter viewport", () => {
    const after = layout([1400, 3100, 2600, 2900, 700, 900]);
    const before = layout([1500, 5200, 2100, 4300, 600, 1300]);
    const map = createSectionMap(after, before, 844);
    const scrollA = scrollAnchoredAt(after.sections[4].top, after, map.maxScrollA);
    expect(map.mapScroll(scrollA)).toBeCloseTo(
      scrollAnchoredAt(before.sections[4].top, before, map.maxScrollB),
      6,
    );
  });

  it("names the hero at the top and the footer at the bottom", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.groupAt(0)).toBe("hero");
    expect(map.groupAt(map.maxScrollA)).toBe("footer");
  });

  it("scrolls to a group so that the group is the one named", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    for (const id of IDS) {
      expect(map.groupAt(map.scrollForGroup(id))).toBe(id);
    }
    expect(map.scrollForGroup("hero")).toBe(0);
    expect(map.scrollForGroup("footer")).toBe(map.maxScrollA);
  });

  it("rejects pages whose groups differ", () => {
    const missing: PageLayout = {
      sections: AFTER.sections.filter((section) => section.id !== "areas"),
      pageHeight: AFTER.pageHeight,
    };
    expect(() => createSectionMap(AFTER, missing, VIEWPORT)).toThrow("Section groups differ");
  });

  it("handles a page no taller than the frame", () => {
    const short = layout([300, 100, 100, 100, 100, 50]);
    const map = createSectionMap(short, short, VIEWPORT);
    expect(map.maxScrollA).toBe(0);
    expect(map.mapScroll(0)).toBe(0);
    expect(map.groupAt(0)).toBe("hero");
  });

  it("holds the before page still while the after page scrolls through a group it lacks", () => {
    const ids: readonly SectionId[] = ["title", "guide", "questions", "next", "footer"];
    const after = layout([600, 2400, 500, 700, 600], ids);
    const before = layout([400, 1200, 0, 150, 500], ids);
    const map = createSectionMap(after, before, VIEWPORT);
    const enter = scrollAnchoredAt(after.sections[2].top + 1, after, map.maxScrollA);
    const leave = scrollAnchoredAt(after.sections[3].top - 1, after, map.maxScrollA);
    const held = scrollAnchoredAt(before.sections[2].top, before, map.maxScrollB);
    expect(map.mapScroll(enter)).toBeCloseTo(held, 6);
    expect(map.mapScroll(leave)).toBeCloseTo(held, 6);
    expect(map.groupAt(enter)).toBe("questions");
  });
});
