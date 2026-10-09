import type { PageId, SectionId, SectionIdOf } from "./types";

export type PageSection = { id: SectionId; label: string };

export type PageInfo = {
  id: PageId;
  number: string;
  name: string;
  noun: string;
  summary: string;
  route: { before: string; after: string };
  when: { before: string; after: string };
  sections: readonly PageSection[];
};

const JANUARY_TO_TODAY = { before: "January 2026", after: "October 2026" } as const;

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

const SEARCH_SECTIONS = [
  { id: "title", label: "Search & switch" },
  { id: "results", label: "Results" },
  { id: "about", label: "About" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"search">;

const GP_SECTIONS = [
  { id: "title", label: "Surgery & booking" },
  { id: "nearby", label: "Nearby surgeries" },
  { id: "team", label: "Care team" },
  { id: "questions", label: "Common questions" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"gp">;

const CLINICIAN_SECTIONS = [
  { id: "title", label: "Profile & booking" },
  { id: "details", label: "Where & how" },
  { id: "footer", label: "Footer" },
] as const satisfies SectionsOf<"clinician">;

const CARENAV_SECTIONS = [
  { id: "start", label: "Start" },
  { id: "about", label: "About you" },
  { id: "reason", label: "Reason" },
  { id: "emergency", label: "Emergency check" },
  { id: "result", label: "Results" },
] as const satisfies SectionsOf<"carenav">;

const BOOKING_SECTIONS = [
  { id: "patient", label: "New patient?" },
  { id: "time", label: "Time" },
  { id: "review", label: "Review" },
  { id: "details", label: "Your details" },
  { id: "verify", label: "Code check" },
  { id: "confirmed", label: "Confirmed" },
] as const satisfies SectionsOf<"booking">;

export const PAGE_IDS: readonly PageId[] = [
  "home",
  "article",
  "help",
  "carenav",
  "search",
  "gp",
  "booking",
  "clinician",
];

export const PAGES: Record<PageId, PageInfo> = {
  home: {
    id: "home",
    number: "01",
    name: "Homepage",
    noun: "homepage",
    summary:
      "January's homepage was a blue band with a postcode box, three numbered steps, five short reviews and a list of questions. Today's leads with one search, puts testimonials first, shows each step as a live vignette and ends on the areas Bookable covers.",
    route: { before: "/", after: "/" },
    when: JANUARY_TO_TODAY,
    sections: HOME_SECTIONS,
  },
  article: {
    id: "article",
    number: "02",
    name: "Guide article",
    noun: "guide article",
    summary:
      "January's how-to page, plain NHS text with one button at the end, becomes today's article template: a hero, a summary up top, a contents list that follows the reader on desktop, and questions answered in place.",
    route: {
      before: "/how-to/book-doctor-appointment-nhs",
      after: "/articles/book-a-gp-appointment",
    },
    when: JANUARY_TO_TODAY,
    sections: ARTICLE_SECTIONS,
  },
  help: {
    id: "help",
    number: "03",
    name: "Help centre",
    noun: "help centre",
    summary:
      "January's FAQ, one long page of accordions in eleven sections, becomes a help centre you can search, with popular questions up front and a page for every topic.",
    route: { before: "/faq", after: "/help" },
    when: JANUARY_TO_TODAY,
    sections: HELP_SECTIONS,
  },
  search: {
    id: "search",
    number: "05",
    name: "GP search",
    noun: "GP search",
    summary:
      "In January the GP search listed surgeries and nothing else, beside a map that stayed in view. In v2 a switch searches by GP surgery or by clinician, under a bar that says why and where you are searching.",
    route: { before: "/gp/search", after: "/gp/search" },
    when: JANUARY_TO_TODAY,
    sections: SEARCH_SECTIONS,
  },
  gp: {
    id: "gp",
    number: "06",
    name: "GP surgery page",
    noun: "GP surgery page",
    summary:
      "The page most patients book from, here for Caversham Group Practice in Kentish Town. January stacked NHS cards: a photo, a score box, the booking calendar with a Book bar docked to the window, directions, the team and opening hours. Today it is a v2 surgery page with a booking card, nearby surgeries, the care team, facilities, common questions and a rail with the photo, map and opening hours.",
    route: {
      before: "/gp/caversham-group-practice-loc_9a5qmml0z01t",
      after: "/gp/caversham-group-practice-loc_9a5qmml0z01t",
    },
    when: JANUARY_TO_TODAY,
    sections: GP_SECTIONS,
  },
  clinician: {
    id: "clinician",
    number: "08",
    name: "Clinician page",
    noun: "clinician page",
    summary:
      "Clinician pages did not exist in January, so the left side is the page as it first shipped in September, still on the NHS design system with a calendar straight on the page. Today it reads like a GP surgery page and books through the same window.",
    route: { before: "/clinician/cli_9a5qmmqhn4r5", after: "/clinician/cli_9a5qmmqhn4r5" },
    when: { before: "September 2026", after: "October 2026" },
    sections: CLINICIAN_SECTIONS,
  },
  carenav: {
    id: "carenav",
    number: "04",
    name: "Care navigation",
    noun: "care navigation",
    summary:
      "In January the homepage search led into four question pages before the results. Today Book an appointment opens a two-step window over the GP search, and the reason stays on the results. The answers are fictional.",
    route: { before: "/care-navigation/date-of-birth", after: "/choose" },
    when: JANUARY_TO_TODAY,
    sections: CARENAV_SECTIONS,
  },
  booking: {
    id: "booking",
    number: "07",
    name: "Booking",
    noun: "booking journey",
    summary:
      "In January booking took a calendar and a drawer on the surgery page, then a contact page, a code page and the confirmation. Today the question, the time, your details and the code all happen in one window over the surgery page. Every input is filled in with fictional details.",
    route: {
      before: "/gp/john-smith-medical-centre-loc_9a5qmmkpexdu",
      after: "/gp/john-smith-medical-centre-loc_9a5qmmkpexdu",
    },
    when: JANUARY_TO_TODAY,
    sections: BOOKING_SECTIONS,
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
