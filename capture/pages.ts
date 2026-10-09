import { sectionIds } from "../src/data/pages";
import type {
  Device,
  FlowPageId,
  PageId,
  SectionId,
  SectionIdOf,
  Version,
} from "../src/data/types";
import type { BuildName } from "./builds";
import { FLOW_SOURCES } from "./flows";
import type { TokenSelectors } from "./inPage";
import type { SectionAnchor } from "./sections";

export type PinnedQuery = { id: string; selector: string; devices: readonly Device[] };

type PageSide<P extends PageId> = {
  build: BuildName;
  path: string;
  anchors: Record<SectionIdOf[P], SectionAnchor>;
  pinned: readonly PinnedQuery[];
  unstick?: readonly string[];
};

type PageSource<P extends PageId> = { before: PageSide<P>; after: PageSide<P> };

export type StaticPageId = Exclude<PageId, FlowPageId>;

export function isFlowPage(page: PageId): page is FlowPageId {
  return page in FLOW_SOURCES;
}

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
const FOOTER: SectionAnchor = { kind: "footer-after-main" };

export const PAGE_SOURCES: { [P in StaticPageId]: PageSource<P> } = {
  home: {
    before: {
      build: "january",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        proof: { kind: "absent" },
        how: { kind: "main-child-with-heading", text: "How it works" },
        "faq-about": { kind: "main-child-with-heading", text: "Frequently asked questions" },
        areas: { kind: "absent" },
        footer: FOOTER,
      },
      pinned: [],
    },
    after: {
      build: "latest",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        proof: { kind: "main-child-with-heading", text: "What people say about Bookable" },
        how: { kind: "main-child-with-heading", text: "How to register and book with an NHS GP" },
        "faq-about": {
          kind: "main-child-with-heading",
          text: "Questions about registering with a GP",
        },
        areas: { kind: "main-child-with-heading", text: "Find an NHS GP surgery in your area" },
        footer: FOOTER,
      },
      pinned: [HEADER],
    },
  },
  article: {
    before: {
      build: "january",
      path: "/how-to/book-doctor-appointment-nhs",
      anchors: {
        title: { kind: "page-top" },
        guide: { kind: "element", selector: "main h2", text: "What sort of care do you need?" },
        questions: { kind: "absent" },
        next: { kind: "element", selector: "main a", text: "Find a new GP surgery near you" },
        footer: FOOTER,
      },
      pinned: [],
    },
    after: {
      build: "latest",
      path: "/articles/book-a-gp-appointment",
      anchors: {
        title: { kind: "page-top" },
        guide: {
          kind: "element",
          selector: "main h2",
          text: "How to book a GP appointment online",
        },
        questions: { kind: "element", selector: "main h2", text: "Common questions" },
        next: { kind: "element", selector: "main h2", text: "Ready when you are" },
        footer: FOOTER,
      },
      pinned: [HEADER, BREADCRUMBS, CONTENTS],
    },
  },
  help: {
    before: {
      build: "january",
      path: "/faq",
      anchors: {
        title: { kind: "page-top" },
        questions: {
          kind: "element",
          selector: "main h2",
          text: "Getting started and registration",
        },
        "more-help": { kind: "element", selector: "main h2", text: "Need more help?" },
        footer: FOOTER,
      },
      pinned: [],
    },
    after: {
      build: "latest",
      path: "/help",
      anchors: {
        title: { kind: "page-top" },
        questions: { kind: "element", selector: "main h2", text: "Popular questions" },
        "more-help": { kind: "element", selector: "main h2, main h3", text: "Still need help?" },
        footer: FOOTER,
      },
      pinned: [HEADER, BREADCRUMBS],
    },
  },
  search: {
    before: {
      build: "january",
      path: SEARCH_PATH,
      anchors: {
        title: { kind: "page-top" },
        results: { kind: "element", selector: 'main [class~="lg:col-span-7"]' },
        about: { kind: "absent" },
        footer: FOOTER,
      },
      pinned: [
        {
          id: "controls",
          selector: '[class*="z-index-control-bar-sticky"]',
          devices: ["desktop", "mobile"],
        },
        { id: "map", selector: 'main .sticky[class*="h-[60vh]"]', devices: ["desktop"] },
      ],
    },
    after: {
      build: "latest",
      path: SEARCH_PATH,
      anchors: {
        title: { kind: "page-top" },
        results: { kind: "element", selector: '[data-testid="search-results"]' },
        about: { kind: "main-child-with-heading", text: "About finding an NHS GP in England" },
        footer: FOOTER,
      },
      pinned: [HEADER],
    },
  },
  gp: {
    before: {
      build: "january",
      path: GP_PATH,
      anchors: {
        title: { kind: "page-top" },
        reviews: { kind: "absent" },
        team: { kind: "element", selector: "main h2, main h3, main h4", text: "Meet the team" },
        questions: { kind: "absent" },
        footer: FOOTER,
      },
      pinned: [],
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
        footer: FOOTER,
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
        details: { kind: "element", selector: "main h2, main h3", text: "Directions" },
        footer: FOOTER,
      },
      pinned: [],
    },
    after: {
      build: "latest",
      path: CLINICIAN_PATH,
      anchors: {
        title: { kind: "page-top" },
        details: { kind: "main-child", index: 2 },
        footer: FOOTER,
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
    search: "main > section:first-of-type .nhs-rounded",
    card: "main > section:nth-of-type(3) .overflow-x-auto > div > div",
  },
  after: {
    headline: "main h1",
    heroGround: "main > section:first-of-type",
    search: '[class*="shadow-ui-search-pill-hero"]',
    card: "main figure",
  },
};

export function anchorList(page: StaticPageId, version: Version): [SectionId, SectionAnchor][] {
  const anchors: Partial<Record<SectionId, SectionAnchor>> = PAGE_SOURCES[page][version].anchors;
  return sectionIds(page).map((id): [SectionId, SectionAnchor] => {
    const anchor = anchors[id];
    if (!anchor) throw new Error(`The ${page} ${version} page has no anchor for ${id}`);
    return [id, anchor];
  });
}

export function buildsFor(pages: readonly PageId[]): BuildName[] {
  const names = pages.flatMap((page) => {
    const source = isFlowPage(page) ? FLOW_SOURCES[page] : PAGE_SOURCES[page];
    return [source.before.build, source.after.build];
  });
  return [...new Set(names)];
}
