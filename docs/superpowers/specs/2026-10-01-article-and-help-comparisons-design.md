# Article and help-centre comparisons — design

Date: 2026-10-01 · Owner: Liem Pham · Status: approved in conversation; extends
[the showcase design](2026-10-01-before-after-showcase-design.md), which still holds wherever this
document is silent.

## 1. Purpose

The showcase compares one page. It grows to three, so it shows the redesign across Bookable's public
pages rather than the homepage alone:

1. **Homepage**: unchanged.
2. **Guide article**: the old how-to page against the v2 article template.
3. **Help centre**: the old FAQ page against the v2 help centre.

The "How it shipped" timeline is removed.

## 2. Source material

| Page | Before | After (all at `c016453be7`) |
|---|---|---|
| Homepage | `/` at `0a143c6820` (22 Sept 2026) | `/` |
| Guide article | `/how-to/book-doctor-appointment-nhs` at `b750cbef25` (31 July 2026) | `/book-a-gp-appointment` |
| Help centre | `/faq` at `b4e56b67e8` (8 Sept 2026) | `/help` |

Each "before" is the last commit before the old page was replaced: `1e021d8370` replaced the how-to
pages with the guide pages (and 301s `/how-to/book-doctor-appointment-nhs` to
`/book-a-gp-appointment`); `38facb0a65` replaced `/faq` with `/help` (and 301s it). The interim
designs between those swaps and v2 (the July guide page, the 8 Sept help centre) are skipped on
purpose: the comparison is old page against v2.

The two old pages need their own builds: between 31 July and 8 Sept the shared NHS footer and
`globals.css` changed, so one older build would misrepresent the FAQ page.

Ship dates of the v2 versions: help centre 11 Sept 2026 (#11687), article template 22 Sept 2026
(#11842), homepage 29 Sept 2026.

## 3. The page

Top to bottom: case header, then three comparisons, then the design-system diff and the credits.

### 3.1 Copy

- Title "Bookable, before & after" (page `<title>`, `og:title` and the case header).
- Lede: "In September 2026 Bookable's homepage, guide articles and help centre moved off the NHS
  design system and onto Bookable's own. Drag a divider, scroll inside a frame, or press Play."
- "Shipped" meta: "Sept 2026".

### 3.2 Comparison intro

Each comparison opens with a short intro: number, name (an `h2` that names the comparison's
region), a one-line summary, the route change and the v2 ship date.

| # | Name | Route | Shipped |
|---|---|---|---|
| 01 | Homepage | `/` | 29 Sept 2026 |
| 02 | Guide article | `/how-to/book-doctor-appointment-nhs` → `/book-a-gp-appointment` | 22 Sept 2026 |
| 03 | Help centre | `/faq` → `/help` | 11 Sept 2026 |

Summaries are written with the callouts and checked the same way.

### 3.3 The stage, per page

Each comparison is the existing stage: divider, locked scroll over section groups, desktop/mobile
frame, rail, callouts, Play. Each stage keeps its own device, divider and Play state.

**Article groups.** The old page covers "What sort of care do you need?" before "How to book a GP
appointment?"; the new one does the reverse, and the scroll mapping must stay monotonic, so the
whole body is one group.

| Id | Rail label | Before | After |
|---|---|---|---|
| `title` | Title | header, `h1` | header, hero, breadcrumbs |
| `guide` | The guide | from the intro paragraph down to the button | the article body: lede, "In short", the six sections |
| `questions` | Common questions | absent | "Common questions" |
| `next` | Next steps | the "Find a new GP surgery near you" button | "Ready when you are" card and "Related articles" |
| `footer` | Footer | NHS footer | site footer |

An absent group has no height, so the before page holds still while the after page scrolls through
it.

**Help groups.**

| Id | Rail label | Before | After |
|---|---|---|---|
| `title` | Title & search | header, `h1`, contents list | header, hero with search, breadcrumbs |
| `questions` | Questions | the question sections | "Popular questions" and "Browse by topic" |
| `more-help` | More help | "Need more help?" | "Still need help?" |
| `footer` | Footer | NHS footer | site footer |

**Pinned layers.** Sticky elements render as live layers over the frame, the way the homepage
header already does, so they stick in the frame as they stick on the site. On the new pages: the
header (sticky and solid over a blur from the first pixel), the breadcrumb bar (pins under the header), and on
desktop the article's "On this page" sidebar (follows the reader, current section highlighted).

**Callouts.** Two or three notes per group, in `src/data/changes.ts`, each claim checked against
the captures and both commits' source before it is written. Themes to check:

- Article. `title`: a plain NHS `h1` becomes a hero with category, read time and review date;
  breadcrumbs pin under the header. `guide`: two headed sections grow into six, opened by "In
  short"; on desktop "On this page" follows the reader. `questions`: questions answered in place,
  new in v2. `next`: a single button becomes a call-to-action card with the postcode search inside,
  then related articles. `footer`: the NHS footer becomes the site footer.
- Help. `title`: a heading and a contents list become a search-first hero, "How can we help?".
  `questions`: one long list of accordions becomes popular questions and a grid of topics with
  their own pages. `more-help`: "Need more help?" and its bullet list become the "Still need help?"
  panel. `footer`: as the article.

### 3.4 Play and recording

- Each page has a full and a short tour built from its own groups, with the same opening sweep and
  mobile sweep as the homepage. The homepage tours are unchanged (34s and under 20s).
- `?page=home|article|help` picks the page in recording mode; missing or unknown means `home`.
  `?record=16x9&page=article` renders only the article stage, controls-free, looping. Combinable
  with `?tour=short`.

## 4. Capture pipeline

### 4.1 Builds

Builds are keyed by name: `home-before` (`0a143c6820`, port 3061), `after` (`c016453be7`, 3062),
`article-before` (`1e021d8370^`, 3063), `help-before` (`38facb0a65^`, 3064). Each is exported,
installed, built and served exactly as today, in `CAPTURE_WORK_DIR/<build name>`. Nothing is written
to sanny. If an older commit needs more than the current build step gives it, the fix goes in the
capture scripts.

### 4.2 Pages and anchors

A page list (`capture/pages.ts`) gives each page's before and after build and path, its section
anchors per version, and its pinned elements per version. Anchors gain two kinds: a heading by its
exact text, and `absent`. Only an absent group may share its top with the next group; any other
equal or out-of-order top stops the capture.

### 4.3 Pinned layers

For each declared pinned element:

- **Box.** Its natural position and width in page coordinates (at scroll 0), the `top` it sticks
  at, and where its containing block ends.
- **States.** The page is scrolled through; wherever the element's markup or computed paint
  changes, a new state starts. Each change is narrowed to the exact pixel. Each state is
  screenshotted with the rest of the page hidden and a transparent background (as the header is
  today). The header's backdrop blur stays a per-state value.
- **Check.** At several scroll positions, including past the release point, the element's real
  position must match `max(y, min(scroll + stickTop, releaseAt − height))` within 1px, or the
  capture stops.
- **Tiles.** Pinned elements are hidden while the tiles are taken. A visible fixed or sticky element
  that is neither pinned nor on the hidden list stops the capture, now checked at every viewport
  stop rather than only at the top.

Paint order follows the elements' stacking order: later layers draw on top.

### 4.4 One page at a time

`pnpm capture --page <id>` builds and serves only the builds that page needs, takes its four
captures (before and after, desktop and mobile), and replaces only that page's entries in
`captures.json`. Without `--page`, every page is captured. The homepage-only fields (tokens,
palettes, radius scale, Frutiger specimen) are rewritten only when the homepage is captured. Loops
stay homepage-only.

Assets live in `public/captures/<page>/<version>/<device>/`. The homepage's existing files move
there with `git mv` and their paths in `captures.json` are rewritten, so no homepage pixel changes.
`pnpm capture:compare --page <id>` sets the live page beside the after capture.

### 4.5 Data file

```ts
type PageId = "home" | "article" | "help";

type PinnedState = { from: number; src: string; height: number; blur: number | null };

type PinnedLayer = {
  id: string; // "header", "breadcrumbs", "contents"
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  states: PinnedState[]; // ascending `from`, the first at 0
};

type Capture = {
  page: PageId;
  version: "before" | "after";
  device: "desktop" | "mobile";
  commit: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  scale: number;
  pageHeight: number;
  tiles: Tile[];
  sections: { id: SectionId; top: number }[];
  pinned: PinnedLayer[]; // replaces `header`
  loops: Loop[];
};

type CapturesFile = {
  captures: Capture[];
  tokens: { before: MeasuredTokens; after: MeasuredTokens }; // homepage, desktop; was per capture
  palettes: { before: PaletteGroup[]; after: PaletteGroup[] };
  radiusScale: string[];
  specimens: { frutiger: string };
};
```

The homepage's existing `header` converts to one pinned layer: `x` and `y` 0, the viewport's
width, `stickTop` 0, `releaseAt` the page height, states `top` from 0 and `scrolled` from its `flipAt`.

## 5. Code

- `src/data/pages.ts`: per page, the intro fields, section ids and rail labels (replaces
  `sections.ts`). `SectionId` is the union of every page's ids; `changes.ts` and the labels are
  typed per page so no group lacks copy.
- `captureFor(page, version, device)`.
- `src/lib/pinned.ts` (pure): a layer's top and active state at a given scroll.
- `urlOptions` gains `page`; `playScript` gains per-page tours.
- `ComparisonStage`, `StageViewport`, `SectionRail` and `ChangeCallouts` take a `page`. Each stage
  sits in its own `LayoutGroup`, so the rail pill and frame morphs stay inside it.
- `StageIntro` (new); `PinnedLayers` replaces `StickyHeaderOverlay` and writes positions to the DOM
  directly (Motion's lazily loaded features drop early style values; see `useLiveStyle`).
- `App` renders the stages from the page list; recording mode renders only the chosen one.
- Removed: `ShipTimeline`, `src/data/timeline.ts`, `e2e/timeline.spec.ts`. Its credits assertion
  moves to the smoke test.
- Capture: `capture/pages.ts`, builds keyed by name, pinned-layer capture in `shoot.ts` and
  `inPage.ts`, page-aware anchors in `sections.ts`, `--page` merging as a pure, tested function.

## 6. Testing

- **Unit, test-first.** `pinned`: before sticking, stuck, released, state boundaries. `sectionMap`:
  an absent group holds the before page still. `urlOptions`: `page` parsing and fallback. Tours:
  every stop is a group of its page; homepage durations unchanged. `assertSections`: equal tops only
  for absent groups. Capture merge: replaces one page's entries and leaves the rest identical. Every
  capture's groups match its page's list.
- **End to end.** Stage tests run per page: divider keys and drag, locked scroll, resize, phone
  captures, touch scroll chaining, and the two "before the animation code has loaded" regressions
  (homepage and article). New: on the article, mid-guide the breadcrumb bar sits under the header
  and the sidebar shows that section's state, and past the guide the sidebar has released;
  `?record=16x9&page=help` renders only the help stage and plays; the three regions, sliders and
  rails have distinct accessible names.
- **Review shots** (`pnpm review`): the article and help stages on desktop and phone, and one
  recording frame of a new page. The timeline shot goes.
- **Browser check.** Each new stage scrolled through in Chrome, against the live pages.

## 7. Budgets and accessibility

- Initial JS stays under 100 KB gzipped. It is 95.9 KB before this work; if the extra data pushes
  it over, the design-system diff (below the fold) is split out and loaded on approach.
- First-paint images stay under 1.5 MB, counting the homepage stage only: stages 2 and 3, their
  tiles and their layer images all load lazily.
- Distinct names: regions "Homepage", "Guide article", "Help centre"; sliders such as "Guide
  article: divider between before and after"; rails such as "Help centre sections". Ids come from
  `useId`. Alt text names the page: "Before: the Bookable guide article on the NHS design system,
  desktop".

## 8. Risks

| Risk | Handling |
|---|---|
| A July or September commit fails to build with today's build step | Fix it in `capture/builds.ts` (env, flags); fall back to `next dev` with the dev indicator hidden |
| The FAQ page's feedback modal or another overlay appears in a shot | The floating-element check stops the capture; add it to the hidden list |
| Live numbers on the old pages ("GP appointments available") | Captured as they render; no callout quotes them |
| The sticky model drifts from the browser's | The position check stops the capture |
| Section headings drift between commits | Anchors are per version; a missing heading stops the capture |
