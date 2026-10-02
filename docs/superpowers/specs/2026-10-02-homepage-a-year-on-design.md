# The homepage, a year on — design

Date: 2026-10-02 · Owner: Liem Pham · Status: approved in conversation; extends
[the showcase design](2026-10-01-before-after-showcase-design.md) and
[the article and help-centre comparisons](2026-10-01-article-and-help-comparisons-design.md), which
still hold wherever this document is silent.

## 1. Purpose

A second view of the site sets Bookable's homepage from 30 September 2025, on the NHS design system,
against v2 a year later, section by section, with the same stage as the existing comparisons. The
existing page stays as it is, apart from one link to the new view.

## 2. Source material

| Side | Commit | Path |
|---|---|---|
| Before | `d914fbe7db53acc671025f4c8f67f6e4ae38587f`, the last develop commit of September 2025 (30 Sept, #5513) | `/` |
| After | `c016453be7` (1 Oct 2026), the same build the homepage comparison uses | `/` |

The homepage went through three designs in September 2025; this is the last. Its sections stayed in
place until the June 2026 redesign (#9071), though the headline changed to "See a GP near you this
week." in May 2026 (#8439). Top to bottom: the NHS organisation header
("Bookable", the NHS logo, "Providing NHS services"); a hero on an NHS-blue band, "Get an
appointment with a new GP surgery this week.", over a white box holding an "appointments available"
count and a postcode form; "How it works", three bulleted steps; "What people say about Bookable",
12 star-rated reviews in a strip that scrolls sideways; "Frequently asked questions", five
accordions and a "See all frequently asked questions" link; the NHS footer.

The local sanny clone is shallow (its develop history starts on 9 June 2026). This machine's clone
still holds the commit object; a clone that lacks it fetches it (§4.1).

## 3. The view

### 3.1 Reaching it

- `/?view=a-year-on` renders the new view; no `view`, or any other value, renders the main page.
- The main page is unchanged apart from one link at the end of its header: "See the homepage a year
  on →".
- The new view opens with a link back, above its eyebrow: "← Bookable, before & after".
- Both are plain links (a full page load), base-aware via `import.meta.env.BASE_URL`.
- Link previews stay shared: one `index.html`, one title and description for crawlers. While the
  new view is open, `document.title` is "The homepage, a year on · Bookable".

### 3.2 Layout and copy

Top to bottom: the glow background, the header, the comparison, the credits.

- **Header.** Eyebrow "Case study · Bookable"; `h1` "The homepage, a year on"; lede "Bookable's
  homepage on 30 September 2025, on the NHS design system, against v2 a year later. Drag the
  divider, scroll inside the frame, or press Play."; details: Before "30 Sept 2025", After "v2,
  shipped 29 Sept 2026", Live "bookable.health". Same type scale and left edge as the main page's
  header.
- **Comparison.** Loaded at once (eager). No intro block of its own: the header introduces it, and
  the stage's region is named by the header's `h1`. Rail, callouts, device toggle and Play as on
  the main page.
- **Side labels.** "Sept 2025 · NHS design system" and "Sept 2026 · v2"; on phones "2025" and "v2".
  The main page's labels are unchanged ("Before · NHS design system", "After · v2"; "Before",
  "After").
- **Credits.** As the main page's, dated by the captures this view shows.
- **Not on this view:** the design-system diff. It measures the September 2026 homepage, and the
  main page already shows it.

### 3.3 Groups

2025 has how it works before the reviews; v2 swaps them. The scroll mapping must stay monotonic, so
the two are one group.

| Id | Rail label | 2025 | v2 |
|---|---|---|---|
| `hero` | Hero | header and hero | header and hero |
| `proof-how` | Reviews & how it works | "How it works", then the reviews | the testimonials, then "How Bookable works" |
| `faq-about` | FAQ & About | "Frequently asked questions" | "Questions before you start" and "About finding an NHS GP in England" |
| `areas` | Areas | absent | "Find an NHS GP surgery in your area" |
| `footer` | Footer | NHS footer | site footer |

An absent group has no height, so the 2025 side holds still while v2 scrolls through Areas.

### 3.4 Callouts

| Group | Notes |
|---|---|
| `hero` | The headline "Get an appointment with a new GP surgery this week." becomes "Register and book with an NHS GP". · A boxed postcode form under an "appointments available" count becomes the hero's single control: one postcode search, with a reel of appointment cards beside it on desktop. · The NHS-blue header and its "Providing NHS services" logo give way to Bookable's own, which lies clear over the hero until the page moves. |
| `proof-how` | Reviews move above how it works. · Twelve star-rated reviews in a strip that scrolls sideways become one testimonials section, with headline figures under the quotes. · Three bulleted steps become a looping product vignette each, labelled Step 1, Step 2, Step 3. |
| `faq-about` | Five NHS accordions under "Frequently asked questions" become a new five under "Questions before you start". · New in v2: "About finding an NHS GP in England" follows them. |
| `areas` | New in v2: "Find an NHS GP surgery in your area", with the areas where Bookable is live underneath. · The 2025 homepage had no areas section, so its side waits here while v2 scrolls past. |
| `footer` | The NHS footer, with three links, "Made with 💙 in Stratford" and a copyright line, becomes the site-wide v2 footer: brand, inline nav, the 111/999 disclaimer and legal links. · On phones the nav becomes 56px full-width rows and the legal links a two-column grid. |

Each claim is checked against the 2025 capture and both commits' source before it lands. The
appointment count is computed, not live (`800 + 30 − the current minute`), so no note quotes it or
calls it live.

### 3.5 Play and recording

- Full tour: desktop stops `proof-how`, `faq-about`, `areas`, `footer`; mobile stops `proof-how`,
  `faq-about` (30.4 s). Short tour: `proof-how`, `faq-about` (14.8 s). Same opening and mobile
  sweeps as the other pages; the existing tours are unchanged.
- `?record=16x9&page=home-2025` renders only this stage. In recording mode a missing or unknown
  `page` means the view's first comparison: `home` on the main view (as today), `home-2025` with
  `view=a-year-on`.

## 4. Capture

### 4.1 Builds

- New build `home-2025`: commit `d914fbe7db53acc671025f4c8f67f6e4ae38587f`, port 3065. Installed,
  built and served exactly as the others; the 2025 tree needed no changes to the build step
  (probed: pnpm 10.14, lockfile v9, Next 15.3.0, React 19.0.0, the same env variable names).
- A build whose commit is in the local sanny clone is exported from it, as today. Otherwise
  `prepareBuild` fetches that one commit (`git fetch --depth=1 <sanny's origin URL> <sha>`) into a
  bare cache repo at `CAPTURE_WORK_DIR/sanny-history.git` and exports it from there. Only a full
  40-character SHA can be fetched this way; a short or relative ref that is not in the clone stops
  the capture with a message saying so. Nothing is written to sanny. (Probed: the fetch takes about
  4 s; `git archive` gives the same tree either way.)

### 4.2 Sources and anchors

`PAGE_SOURCES["home-2025"]`:

- **before**: build `home-2025`, path `/`; anchors `hero` page top, `proof-how` the main child with
  heading "How it works", `faq-about` the main child with heading "Frequently asked questions",
  `areas` absent, `footer` the footer after `main`; no pinned layers (nothing on the page is sticky;
  probed).
- **after**: `null`, because it is reused (§4.3). `PAGE_SOURCES[page].after` is `null` exactly for
  pages whose after side is reused, and the type enforces it.

The existing consent preset (`SOCS` rejected in local storage) also keeps the 2025 cookie drawer
closed; probed, with no page errors. The floating-element check stays as the guard.

Probed tops: desktop 0, 460, 1384, 2273, 2273 of 2438; mobile 0, 484, 1208, 1937, 1937 of 2166.

### 4.3 The reused v2 side

The v2 side is not shot again. `captureFor("home-2025", "after", device)` returns the homepage's v2
capture for that device with `page` set to `home-2025` and its sections regrouped; tiles, pinned
layers, loops, height, commit and capture time are the homepage's own. Each group starts where a
homepage group starts:

| `home-2025` group | starts at `home` group |
|---|---|
| `hero` | `hero` |
| `proof-how` | `proof` |
| `faq-about` | `faq-about` |
| `areas` | `areas` |
| `footer` | `footer` |

The mapping is declared once, in `src/data`. Regrouping throws if a start group is missing or the
starts are out of order. Recapturing `home` updates both views; the two views always show the same
v2.

### 4.4 One page at a time

- `pnpm capture --page home-2025` builds and serves only `home-2025`, takes its two captures
  (desktop and mobile), and replaces only its entries in `captures.json`; every other entry stays
  byte-identical. Without `--page`, every page is captured, reused sides skipped.
- The merge expects exactly one stored capture for every shot side and none for a reused side.
- Tokens, palettes, loops and the Frutiger specimen stay homepage-only.
- Assets in `public/captures/home-2025/before/<device>/`.
- The appointment count reflects the minute of capture (771 to 830); it is not pinned.

## 5. Code

- `src/data/types.ts`: `PageId` gains `"home-2025"`, with its section ids
  (`hero | proof-how | faq-about | areas | footer`).
- `src/data/views.ts` (new): `ViewId = "main" | "a-year-on"` and the comparisons of each view, in
  order: main `home`, `article`, `help`; a-year-on `home-2025`. Every comparison is in exactly one
  view.
- `src/data/pages.ts`: the `home-2025` entry (name "Homepage", noun "homepage", route `/`, groups),
  side labels per comparison, and the intro copy (number, summary, shipped) made optional per
  comparison: present for the main view's three, absent for `home-2025`.
- `src/data/changes.ts`, `src/lib/playScript.ts`: `home-2025` notes and tours.
- `src/data/captures.ts`: `captureFor` returns stored or regrouped captures; the regrouping is a
  pure, tested function.
- `src/data/caseStudy.ts`: the new view's copy.
- `urlOptions`: `view`, and the view-aware `page` default.
- `App`: renders the view; the main view is unchanged apart from the link.
- `ComparisonStage`: renders its intro when the comparison has one, otherwise takes the id of the
  heading that names it (throws if it has neither). `VersionLabels` reads the comparison's labels.
- `YearHeader` (new): the new view's header. `SiteCredits` dates the captures of the comparisons it
  is given. `CaseHeader` gains the link.
- Capture: the build, the clone-or-fetch export in `capture/builds.ts`, the sources in
  `capture/pages.ts`, reused sides skipped in `buildsFor`, the capture loop and `mergeCaptures`.

## 6. Testing

- **Unit, test-first.**
  - `urlOptions`: `view` parsing and fallback; the `page` default per view.
  - Views: every comparison in exactly one view; the main view's order unchanged.
  - Regrouping: ids in the new order; tops equal the homepage's start groups; everything else
    identical to the homepage capture; throws on a missing or out-of-order start.
  - Section map: built for `home-2025` on both devices; the absent Areas group holds the 2025 side
    still.
  - Tours: every stop a group of its page; `home-2025` durations; existing durations unchanged.
  - Capture args: `--page home-2025` accepted.
  - `buildsFor`: `["home-2025"]` gives only `home-2025`.
  - Merge: replaces only `home-2025`; rejects a stored capture for a reused side; still rejects a
    missing shot side.
  - Builds: the clone-or-fetch choice and the full-SHA rule.
  - Capture data: every file exists; stored captures carry their page's groups; `captureFor` answers
    for every comparison, version and device.
- **End to end.**
  - The main page's link opens the new view; the back link returns; neither view logs console
    errors; the document title.
  - The new view: header, details, the stage named "The homepage, a year on", five rail entries,
    callouts, credits; its `h1` shares the main page header's left edge.
  - Stage behaviour on the new view: divider keys and drag, locked scroll, resize, phone captures
    without sideways scrolling; the 2025 side holds still through Areas; switching device keeps the
    group; Play tours it; recording mode with `page=home-2025`, and with `view=a-year-on` alone.
  - Tests that loop over every comparison open each on its own view. Existing tests otherwise stay
    as they are.
- **Review shots** (`pnpm review`): the new view's top, its stage on desktop and on a phone, and the
  main page's header with the new link.
- **Browser check.** The new view scrolled through in Chrome at desktop and phone widths.

## 7. Budgets and accessibility

- Initial JS stays under 100 KB gzipped (96.8 KB before this work; the extra copy and data are
  expected to add 1–2 KB). If it goes over, the new view's code is split out and loaded only on that
  view.
- First-paint images stay under 1.5 MB on each view. The budget script gains the new view's line:
  its desktop 2025 and v2 first tiles and v2 header layers.
- Names: the stage region is "The homepage, a year on"; its rail "Homepage sections"; its slider
  "Homepage: divider between before and after". Alt text as the homepage comparison's ("Before: the
  Bookable homepage on the NHS design system, desktop"), which holds for 2025 too.

## 8. Risks

| Risk | Handling |
|---|---|
| The fetch from GitHub fails (offline, no SSH key) | `prepareBuild` stops with a message naming the commit and the cache path |
| A 2025 overlay appears in a shot | The floating-element check stops the capture; add it to the hidden list |
| A homepage recapture drops or reorders a group the regrouping starts at | Regrouping throws; the unit test fails first |
| The extra code and data push the main page over its JS budget | Split out the new view's code |
| The sanny clone is deepened later | The commit is then exported from the clone; the tree is identical |
