import { sectionIds } from "../src/data/pages";
import type { HomeSectionId, SectionId, SectionTop, Version } from "../src/data/types";

export type SectionAnchor =
  | { kind: "page-top" }
  | { kind: "main-child"; index: number }
  | { kind: "main-child-with-heading"; text: string }
  | { kind: "footer-after-main" };

export const SECTION_ANCHORS: Record<Version, Record<HomeSectionId, SectionAnchor>> = {
  before: {
    hero: { kind: "page-top" },
    proof: { kind: "main-child", index: 2 },
    how: { kind: "main-child-with-heading", text: "How Bookable works" },
    "faq-about": { kind: "main-child-with-heading", text: "About finding an NHS GP in England" },
    areas: { kind: "main-child-with-heading", text: "Looking for a GP in a specific city?" },
    footer: { kind: "footer-after-main" },
  },
  after: {
    hero: { kind: "page-top" },
    proof: { kind: "main-child-with-heading", text: "What people say about Bookable" },
    how: { kind: "main-child-with-heading", text: "How Bookable works" },
    "faq-about": { kind: "main-child-with-heading", text: "Questions before you start" },
    areas: { kind: "main-child-with-heading", text: "Find an NHS GP surgery in your area" },
    footer: { kind: "footer-after-main" },
  },
};

export function anchorList(version: Version): [SectionId, SectionAnchor][] {
  const anchors: Partial<Record<SectionId, SectionAnchor>> = SECTION_ANCHORS[version];
  return sectionIds("home").map((id): [SectionId, SectionAnchor] => {
    const anchor = anchors[id];
    if (!anchor) throw new Error(`The homepage ${version} has no anchor for ${id}`);
    return [id, anchor];
  });
}

export function assertSections(found: readonly { id: string; top: number }[]): SectionTop[] {
  const ids = found.map((section) => section.id).join(",");
  if (ids !== sectionIds("home").join(",")) throw new Error(`Sections came back as ${ids}`);
  for (const [index, section] of found.entries()) {
    const previous = found[index - 1];
    if (previous && section.top <= previous.top) {
      throw new Error(
        `${section.id} starts at ${section.top}px, not below ${previous.id} at ${previous.top}px`,
      );
    }
  }
  return found as SectionTop[];
}
