import { sectionIds } from "../src/data/pages";
import type { ReusedPage } from "../src/data/reuse";
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
};

type PageSource<P extends PageId> = {
  before: PageSide<P>;
  after: P extends ReusedPage ? null : PageSide<P>;
};

export type ShotSide = {
  page: PageId;
  version: Version;
  side: {
    build: BuildName;
    path: string;
    anchors: Partial<Record<SectionId, SectionAnchor>>;
    pinned: readonly PinnedQuery[];
  };
};

const VERSIONS: readonly Version[] = ["before", "after"];

const BOTH: readonly Device[] = ["desktop", "mobile"];
const HEADER: PinnedQuery = { id: "header", selector: "header", devices: BOTH };
const BREADCRUMBS: PinnedQuery = {
  id: "breadcrumbs",
  selector: 'nav[aria-label="Breadcrumb"]',
  devices: BOTH,
};
const CONTENTS: PinnedQuery = { id: "contents", selector: "main aside", devices: ["desktop"] };

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
  "home-2025": {
    before: {
      build: "home-2025",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        "proof-how": { kind: "main-child-with-heading", text: "How it works" },
        "faq-about": { kind: "main-child-with-heading", text: "Frequently asked questions" },
        areas: { kind: "absent" },
        footer: { kind: "footer-after-main" },
      },
      pinned: [],
    },
    after: null,
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

export function shotSides(pages: readonly PageId[]): ShotSide[] {
  return pages.flatMap((page) =>
    VERSIONS.flatMap((version): ShotSide[] => {
      const side: ShotSide["side"] | null = PAGE_SOURCES[page][version];
      return side === null ? [] : [{ page, version, side }];
    }),
  );
}

export function anchorList(page: PageId, version: Version): [SectionId, SectionAnchor][] {
  const side: ShotSide["side"] | null = PAGE_SOURCES[page][version];
  if (side === null) throw new Error(`The ${page} ${version} side reuses another page's capture`);
  return sectionIds(page).map((id): [SectionId, SectionAnchor] => {
    const anchor = side.anchors[id];
    if (!anchor) throw new Error(`The ${page} ${version} page has no anchor for ${id}`);
    return [id, anchor];
  });
}

export function buildsFor(pages: readonly PageId[]): BuildName[] {
  return [...new Set(shotSides(pages).map(({ side }) => side.build))];
}
