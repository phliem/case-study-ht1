import type { PageId, SectionId, SectionIdOf } from "./types";

export type PageSection = { id: SectionId; label: string };

export type StageIntroCopy = { number: string; summary: string; shipped: string };

export type PageInfo = {
  id: PageId;
  name: string;
  noun: string;
  route: { before: string; after: string };
  sections: readonly PageSection[];
  intro: StageIntroCopy | null;
};

type SectionsOf<P extends PageId> = readonly { id: SectionIdOf[P]; label: string }[];

const HOME_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "proof", label: "Social proof" },
  { id: "how", label: "How it works" },
  { id: "faq-about", label: "FAQ & About" },
  { id: "areas", label: "Areas" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"home">;

const ARTICLE_SECTIONS = [
  { id: "title", label: "Title" },
  { id: "guide", label: "The guide" },
  { id: "questions", label: "Common questions" },
  { id: "next", label: "Next steps" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"article">;

const HELP_SECTIONS = [
  { id: "title", label: "Title & search" },
  { id: "questions", label: "Questions" },
  { id: "more-help", label: "More help" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"help">;

const HOME_2025_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "proof-how", label: "Reviews & how it works" },
  { id: "faq-about", label: "FAQ & About" },
  { id: "areas", label: "Areas" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"home-2025">;

export const PAGE_IDS: readonly PageId[] = ["home", "article", "help", "home-2025"];

export const PAGES: Record<PageId, PageInfo> = {
  home: {
    id: "home",
    name: "Homepage",
    noun: "homepage",
    route: { before: "/", after: "/" },
    sections: HOME_SECTIONS,
    intro: {
      number: "01",
      summary:
        "The landing page: one postcode search at the heart of the hero, one testimonials section in place of three proof blocks, and a live vignette for each step of how it works.",
      shipped: "29 Sept 2026",
    },
  },
  article: {
    id: "article",
    name: "Guide article",
    noun: "guide article",
    route: { before: "/how-to/book-doctor-appointment-nhs", after: "/book-a-gp-appointment" },
    sections: ARTICLE_SECTIONS,
    intro: {
      number: "02",
      summary:
        "A how-to page on the NHS design system becomes the v2 article template: a hero, a summary up top, a contents list that follows the reader on desktop, and questions answered in place.",
      shipped: "22 Sept 2026",
    },
  },
  help: {
    id: "help",
    name: "Help centre",
    noun: "help centre",
    route: { before: "/faq", after: "/help" },
    sections: HELP_SECTIONS,
    intro: {
      number: "03",
      summary:
        "One long page of FAQ accordions becomes a help centre you can search, with popular questions up front and a page for every topic.",
      shipped: "11 Sept 2026",
    },
  },
  "home-2025": {
    id: "home-2025",
    name: "Homepage",
    noun: "homepage",
    route: { before: "/", after: "/" },
    sections: HOME_2025_SECTIONS,
    intro: null,
  },
};

export function isPageId(value: string | null): value is PageId {
  return PAGE_IDS.some((id) => id === value);
}

export function sectionIds(page: PageId): SectionId[] {
  return PAGES[page].sections.map((section) => section.id);
}

export function sectionLabel(page: PageId, id: SectionId): string {
  const section = PAGES[page].sections.find((entry) => entry.id === id);
  if (!section) throw new Error(`${id} is not a group of the ${page} page`);
  return section.label;
}

export function addressOf(page: PageId): string {
  const path = PAGES[page].route.after;
  return path === "/" ? "bookable.health" : `bookable.health${path}`;
}
