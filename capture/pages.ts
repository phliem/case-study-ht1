import { sectionIds } from "../src/data/pages";
import type { Device, PageId, SectionId, SectionIdOf, Version } from "../src/data/types";
import type { BuildName } from "./builds";
import type { TokenSelectors } from "./inPage";
import type { SectionAnchor } from "./sections";

export type PinnedQuery = { id: string; selector: string; devices: readonly Device[] };

type PageSide<P extends PageId> = {
  build: BuildName;
  path: string;
  anchors: Record<SectionIdOf[P], SectionAnchor>;
  pinned: readonly PinnedQuery[];
  unstick?: readonly string[];
  nhsFooter?: true;
  nhsHeader?: true;
};

type PageSource<P extends PageId> = { before: PageSide<P>; after: PageSide<P> };

const BOTH: readonly Device[] = ["desktop", "mobile"];
const HEADER: PinnedQuery = { id: "header", selector: "header", devices: BOTH };
const BREADCRUMBS: PinnedQuery = {
  id: "breadcrumbs",
  selector: 'nav[aria-label="Breadcrumb"]',
  devices: BOTH,
};
const CONTENTS: PinnedQuery = { id: "contents", selector: "main aside", devices: ["desktop"] };

// The surgery and clinician rail sticks both ways and is taller than the window, which a pinned
// layer cannot show, so the capture lets it scroll with the page.
const RAIL = "main aside";
const GP_PATH = "/gp/john-smith-medical-centre-loc_9a5qmmkpexdu?postcode=IG1%202UT";
const CLINICIAN_PATH = "/clinician/cli_9a5qmmqhn4r5?postcode=IG1%202UT";
const SEARCH_PATH = "/gp/search?postcode=IG1%202UT";
const SEARCH_ANCHORS: Record<SectionIdOf["search"], SectionAnchor> = {
  title: { kind: "page-top" },
  results: { kind: "element", selector: '[data-testid="search-results"]' },
  about: { kind: "main-child-with-heading", text: "About finding an NHS GP in England" },
  footer: { kind: "footer-after-main" },
};

export const PAGE_SOURCES: { [P in PageId]: PageSource<P> } = {
  home: {
    before: {
      build: "home-before",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        proof: { kind: "main-child", index: 2 },
        how: { kind: "main-child-with-heading", text: "How Bookable works" },
        "faq-about": {
          kind: "main-child-with-heading",
          text: "About finding an NHS GP in England",
        },
        areas: { kind: "main-child-with-heading", text: "Looking for a GP in a specific city?" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
    },
    after: {
      build: "after",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        proof: { kind: "main-child-with-heading", text: "What people say about Bookable" },
        how: { kind: "main-child-with-heading", text: "How Bookable works" },
        "faq-about": { kind: "main-child-with-heading", text: "Questions before you start" },
        areas: { kind: "main-child-with-heading", text: "Find an NHS GP surgery in your area" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [HEADER],
    },
  },
  article: {
    before: {
      build: "article-before",
      path: "/how-to/book-doctor-appointment-nhs",
      anchors: {
        title: { kind: "page-top" },
        guide: { kind: "element", selector: "main article > header + p" },
        questions: { kind: "absent" },
        next: { kind: "element", selector: "main a", text: "Find a new GP surgery near you" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
    },
    after: {
      build: "after",
      path: "/book-a-gp-appointment",
      anchors: {
        title: { kind: "page-top" },
        guide: { kind: "element", selector: "main article" },
        questions: { kind: "element", selector: "main h2", text: "Common questions" },
        next: { kind: "element", selector: "main h2", text: "Ready when you are" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [HEADER, BREADCRUMBS, CONTENTS],
    },
  },
  help: {
    before: {
      build: "help-before",
      path: "/faq",
      anchors: {
        title: { kind: "page-top" },
        questions: {
          kind: "element",
          selector: "main h2",
          text: "Getting started and registration",
        },
        "more-help": { kind: "element", selector: "main h2", text: "Need more help?" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
    },
    after: {
      build: "after",
      path: "/help",
      anchors: {
        title: { kind: "page-top" },
        questions: { kind: "element", selector: "main h2", text: "Popular questions" },
        "more-help": { kind: "element", selector: "main h2, main h3", text: "Still need help?" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [HEADER, BREADCRUMBS],
    },
  },
  search: {
    before: {
      build: "search-before",
      path: SEARCH_PATH,
      anchors: SEARCH_ANCHORS,
      pinned: [],
      nhsFooter: true,
    },
    after: {
      build: "latest",
      path: SEARCH_PATH,
      anchors: SEARCH_ANCHORS,
      pinned: [HEADER],
    },
  },
  gp: {
    before: {
      build: "gp-before",
      path: GP_PATH,
      anchors: {
        title: { kind: "page-top" },
        reviews: { kind: "element", selector: "main h3", text: "Ratings and reviews" },
        team: { kind: "element", selector: "main h3", text: "Meet the team" },
        questions: { kind: "absent" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
      nhsHeader: true,
      nhsFooter: true,
    },
    after: {
      build: "latest",
      path: GP_PATH,
      anchors: {
        title: { kind: "page-top" },
        reviews: { kind: "element", selector: "main h2", text: "What patients say" },
        team: { kind: "element", selector: "main h2", text: "Care team" },
        questions: {
          kind: "element",
          selector: "main h2",
          text: "Common questions about John Smith Medical Centre",
        },
        footer: { kind: "footer-after-main" },
      },
      pinned: [HEADER],
      unstick: [RAIL],
    },
  },
  clinician: {
    before: {
      build: "clinician-before",
      path: CLINICIAN_PATH,
      anchors: {
        title: { kind: "page-top" },
        details: { kind: "element", selector: "main h3", text: "Directions" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
      nhsHeader: true,
      nhsFooter: true,
    },
    after: {
      build: "latest",
      path: CLINICIAN_PATH,
      anchors: {
        title: { kind: "page-top" },
        details: { kind: "main-child", index: 2 },
        footer: { kind: "footer-after-main" },
      },
      pinned: [HEADER],
      unstick: [RAIL],
    },
  },
};

export const HOME_TOKEN_SELECTORS: Record<Version, TokenSelectors> = {
  before: {
    headline: "main h1",
    heroGround: "main > section:first-of-type",
    search: "main > section:first-of-type .rounded-2xl",
    card: "main > section:nth-of-type(3) article > div:last-child",
  },
  after: {
    headline: "main h1",
    heroGround: "main > section:first-of-type",
    search: '[class*="shadow-ui-search-pill-hero"]',
    card: "main figure",
  },
};

export function anchorList(page: PageId, version: Version): [SectionId, SectionAnchor][] {
  const anchors: Partial<Record<SectionId, SectionAnchor>> = PAGE_SOURCES[page][version].anchors;
  return sectionIds(page).map((id): [SectionId, SectionAnchor] => {
    const anchor = anchors[id];
    if (!anchor) throw new Error(`The ${page} ${version} page has no anchor for ${id}`);
    return [id, anchor];
  });
}

// Pages built after the v2 footer landed (7721c5b954) wear the last NHS footer instead, shot
// from the homepage before build, so every before page dates from before v2.
export const NHS_FOOTER_BUILD: BuildName = "home-before";

export function needsNhsFooter(pages: readonly PageId[]): boolean {
  return pages.some((page) => PAGE_SOURCES[page].before.nhsFooter === true);
}

// Pages built after the v2 header landed (9a5d90ba1d) wear the NHS header and Back bar that the
// same route had just before it.
export const NHS_HEADER_BUILD: BuildName = "header-before";

export function needsNhsHeader(pages: readonly PageId[]): boolean {
  return pages.some((page) => PAGE_SOURCES[page].before.nhsHeader === true);
}

export function buildsFor(pages: readonly PageId[]): BuildName[] {
  const names = pages.flatMap((page) => [
    PAGE_SOURCES[page].before.build,
    PAGE_SOURCES[page].after.build,
  ]);
  if (needsNhsFooter(pages)) names.push(NHS_FOOTER_BUILD);
  if (needsNhsHeader(pages)) names.push(NHS_HEADER_BUILD);
  return [...new Set(names)];
}
