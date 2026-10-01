# Bookable homepage, before & after — design

Date: 2026-10-01 · Owner: Liem Pham · Status: approved; amended while planning (see the plan's notes);
extended to the guide article and help centre by
[the article and help-centre design](2026-10-01-article-and-help-comparisons-design.md), which wins
where the two differ

## 1. Purpose

A one-page, standalone portfolio piece that shows how the Bookable homepage (bookable.health)
changed when it moved from the NHS design system ("before", v0) to Bookable's own design system
("after", v2). Visitors play with it: drag a before/after divider, scroll both versions in lockstep,
switch desktop/mobile. A scripted **Play** mode runs the same story on its own so it can be
screen-recorded as a portfolio shot.

It is a separate project (`~/Desktop/repos/bookable-before-after`, its own git repo). Nothing is
added to the sanny monorepo; sanny is only read at capture time.

## 2. Success criteria

1. A visitor can compare any section of the homepage like for like within 10 seconds of landing.
2. Both versions are faithful: the "after" capture matches live bookable.health at the same
   viewport, and the "before" capture is the 22 Sept 2026 build.
3. The page reads as animated and alive (intro, divider sweep, live loops, morphs, reveals) and
   stays smooth (no dropped frames while dragging on a recent laptop or phone).
4. `?record=16x9` and `?record=4x3` give a clean, controls-free, looping sequence that can be
   screen-recorded without editing.
5. Deploys as static files to any host or sub-path, and works embedded in an iframe.
6. Every claim on the page is true: callout copy is checked against both commits' source, token
   values are measured or imported, and no outcome metrics are invented.

## 3. Scope

In: the homepage only (`/`), desktop (1440px) and mobile (390px), English.

Out: the `/a/` area pages and other routes; translated variants; live iframes of either version;
analytics; outcome metrics (v2 shipped 29 Sept 2026, so there is no outcome data yet); pushing to
any remote (only on request).

## 4. Source material

| | Before (v0) | After (v2) |
|---|---|---|
| Commit (sanny `develop`) | `0a143c6820` (22 Sept 2026) | `c016453be7` (1 Oct 2026) |
| Header | `LandingTopNav`, static NHS-blue bar | `HeroSiteHeader`, sticky, transparent over the hero, solid after scrolling |
| Typeface | Frutiger (NHS licence) | Hanken Grotesk 500/700/800 (OFL) |

The redesign shipped in four chunks:

| Date | Chunk |
|---|---|
| 22 Sept 2026 | v2 site footer, swapped in everywhere but triage |
| 29 Sept 2026 | v2 site header, NHS header retired |
| 29 Sept 2026 | v2 postcode search in the homepage hero |
| 29 Sept 2026 | Homepage and area pages rebuilt on the v2 landing design |

Data: both builds read `https://api.ht1.uk/v2/bookable/landing/metrics` (public, read-only,
returns 200 without auth), so both show the same live-site figures.

### Section pairs

The page is split into six groups. A group runs from its first element's top to the next group's
top, so the groups tile the whole page with no gaps.

| Id | Rail label | Before | After |
|---|---|---|---|
| `hero` | Hero | `LandingTopNav` + `LandingHero` | `HeroSiteHeader` + `LandingHero` |
| `proof` | Social proof | `LandingStats` + `LandingTopRated` + `LandingReviews` | `LandingTestimonials` |
| `how` | How it works | `LandingHowItWorks` | `LandingHowItWorks` |
| `faq-about` | FAQ & About | `SectionAbout` + `LandingFaq` | `LandingFaq` + `LandingAbout` |
| `areas` | Areas | `LandingTags` | `LandingAreaCta` |
| `footer` | Footer | `Footer` | `SiteFooter` |

`faq-about` is one group because the two sections swapped order, which a monotonic scroll mapping
cannot pair individually.

## 5. The page

Top to bottom. Dark-only showpiece.

**Look.** Ground `#061528` with a slow-drifting radial glow made from the v2 hero gradient stops
(`#1387CC`, `#0A63AC`, `#083F80`, `#052F60`). Hanken Grotesk throughout (Google Fonts): display
72–120px at -0.035em tracking, uppercase microlabels at 0.09em / 800 weight, echoing v2's own
captions. "Before" chip in slate (`#8895A0` on 6% white), "After" chip in mint (`#6FE0AC`).

### 5.1 Case-study header

Title "Bookable homepage, before & after"; role line (default "Front-end engineering", set in
`src/data/caseStudy.ts`); "Shipped 29 Sept 2026"; stack chips (Next.js, React, Tailwind, design
tokens); link to https://bookable.health. Title words rise in on a stagger; the glow drifts behind.

### 5.2 Comparison stage

About one viewport tall.

- **Frame.** Desktop: browser chrome (three dots, URL pill "bookable.health") around a
  1440×900 page viewport scaled to fit. Mobile: phone body with rounded corners and an island
  around a 390×844 viewport. Switching device morphs one frame into the other (Motion layout
  animation). Default device is mobile when the visitor's own viewport is under 768px wide.
- **Layers.** The after page is the base layer and the real scroll container (native scrolling and
  momentum). The before page sits above it, clipped to the left of the divider, with
  `pointer-events: none` so scrolling always reaches the after layer.
- **Divider.** Labels "Before · NHS design system" (left) and "After · v2" (right). A visually
  hidden native range input carries the keyboard and screen-reader semantics: ←/→ 5%,
  Shift+←/→ 20%, Home/End to 0%/100%, and `aria-valuetext` such as "40% before, 60% after". The
  visible handle takes mouse and touch drags (pointer capture, `touch-action: none`).
- **Locked scroll.** The before layer follows the after layer through a piecewise-linear mapping
  over the section groups, using a proportional anchor: `anchor = scroll / maxScroll × pageHeight`.
  The anchor sweeps from the frame's top edge at the top of the page to its bottom edge at the
  end, so both pages' tops and bottoms always line up. A fixed mid-frame anchor, the first draft,
  could leave one version short of its footer. An anchor at fraction `t` through after group `i`
  maps to fraction `t` through before group `i`, then back to a scroll position:
  `scrollB = anchorB / pageHeightB × maxScrollB`. So How it works lines up with How it works,
  whatever their heights.
- **Sticky header.** A version whose header is sticky gets it pinned in the frame from captured
  state images, flipping state at the captured scroll threshold. The solid state sits on a
  `backdrop-filter: blur()` matching the site's. The full-page capture of such a version is taken
  with its header hidden, so the header never appears twice.
- **Live loops.** On the after layer, captured video loops sit exactly over the regions that animate
  on the real site (see 6.3). They play only while visible in the frame, and not under reduced
  motion.
- **Section rail.** The six rail labels beside the frame (above it on narrow screens, as a sideways-scrolling row); the current
  group is highlighted; clicking glides the frame to that group.
- **"What changed" callouts.** Two or three notes per group animate in as the group reaches the
  frame's anchor (beside the frame on wide screens, below on narrow). The final copy lives in
  `src/data/changes.ts`, and each note was checked against both commits' source:

| Group | Notes |
|---|---|
| `hero` | The postcode search becomes the hero's single control, lifted further here than anywhere else it appears. · A reel of appointment cards scrolls beside the search on desktop. · The header lies clear over the hero and turns solid as soon as the page moves. |
| `proof` | Stats, a top-rated surgeries list and reviews, three NHS-styled blocks, merge into one testimonials section. · Headline figures sit under the quotes they back up. |
| `how` | Icons give way to looping product vignettes for each step. · Steps are numbered with tracked microlabels: Step 1, Step 2, Step 3. |
| `faq-about` | The FAQ moves above About. · Its title changes from "Common questions about finding an NHS GP in England" to "Questions before you start". |
| `areas` | The "Looking for a GP in a specific city?" tag list becomes a call to action: "Find an NHS GP surgery in your area". · The areas where Bookable is live sit underneath, ready to browse. |
| `footer` | The NHS three-column footer becomes one site-wide footer: brand, inline nav, the 111/999 disclaimer and legal links. · On phones the nav becomes 56px full-width rows and the legal links a two-column grid. |

### 5.3 Play

A ▶ Play button runs a script defined as data in `src/lib/playScript.ts`:

1. Desktop, top of page, divider at 100% (all before) → sweeps to 0% over 1.6s → settles at
   50% over 0.8s.
2. Tour `proof`, `how`, `faq-about`, `areas`, `footer`: glide to the group (1.2s), hold 2.4s
   while its callouts show, with the divider easing 50% → 25% → 50% during the hold.
3. Glide back to the top (1.2s), morph to mobile (0.8s), sweep 100% → 0% → 50% (2.4s), tour
   `proof` and `how`.
4. Morph back to desktop, top of page, divider at 50%.

A short cut (`?tour=short`, about 20s) runs step 1, tours `proof` and `how`, then the mobile sweep.
Any pointer-down, wheel or key press on the stage stops Play and leaves everything where it is.

### 5.4 Recording mode

`?record=16x9` or `?record=4x3`: the stage fills the browser viewport letterboxed to that aspect;
the device toggle, Play button and drag hint are hidden; the cursor is hidden over the stage;
callouts and rail stay; Play starts on load and loops (1s hold between runs). Combinable with
`?tour=short`.

### 5.5 Design-system diff

Six token cards that morph from the before value to the after value as they scroll into view;
clicking a card flips it back and forth.

| Card | Before | After |
|---|---|---|
| Typeface | Frutiger specimen (rendered PNG) | Hanken Grotesk, live text, 500/700/800 |
| Headline | measured hero `h1` size, line-height, tracking, weight | same, measured |
| Corners | measured radius of the search control and a card | same, measured, plus the v2 radius scale |
| Elevation | measured shadows of the same elements | same, measured |
| Hero ground | measured hero band background | same, measured (the radial gradient) |
| Palette | the before commit's NHS colour constants | the after commit's `UI_COLORS` hue steps |

### 5.6 Outro timeline

Removed on 2026-10-01.

### 5.7 Throughout

Under `prefers-reduced-motion: reduce`: no glow drift, no title stagger, no loops; sweeps, morphs,
glides and reveals become instant state changes. Play still steps through its tour when pressed,
cutting between states. Recording mode ignores the setting, since it is an explicit request for
motion.

## 6. Capture pipeline

`pnpm capture` (Node + tsx + Playwright Chromium + sharp + ffmpeg). Reads `SANNY_REPO`
(default `~/Desktop/repos/sanny`). Outputs are committed, so the page builds without sanny.

### 6.1 Builds

For each pinned commit:

1. Export it with `git archive <sha> | tar -x` into `CAPTURE_WORK_DIR/<version>` (default
   `<os tmp>/bookable-before-after`). This writes nothing to sanny, neither the working tree nor
   git metadata.
2. `pnpm install --frozen-lockfile --filter "bookable..."`, then
   `pnpm --filter "bookable^..." run build` for bookable's workspace dependencies.
3. Write `packages/bookable/.env.local` with `NEXT_PUBLIC_WEBAPI_BASE_URL=https://api.ht1.uk/v2`,
   plus the Weglot key copied from the main checkout's `packages/bookable/.env.local` if present.
4. `next build`, then `next start` on port 3061 (before) or 3062 (after); wait until it answers.
   The capture refuses to start if something already answers on either port.
5. After capturing, stop both servers; this also runs on failure. A build is reused while its
   commit is unchanged, and `pnpm capture:clean` deletes the work directory.

### 6.2 Shots

Viewports: desktop 1440×900; mobile 390×844 with `isMobile` and `hasTouch`. `deviceScaleFactor`
2. Before each shot:

- An init script sets the cookie consent to its "reject non-essential" value and clears `wglang`.
- Injected CSS hides the floating phone-help bubble.
- Wait for `document.fonts.ready` and network idle; scroll the page through once so lazy images
  and scroll-triggered reveals run; finish every finite animation; return to the top.
- Pause every infinite animation at its current time; this moment is frame 0 of every loop, so a
  loop starts exactly where the still image is.

Then record:

- **Tiles.** The full page is stitched from screenshots taken at the capture viewport, one
  viewport at a time. That keeps viewport-relative heights exact, such as the v2 hero's
  `100vh − 96px`, which a single tall screenshot can distort. A sticky header is hidden; any
  other visible fixed or sticky element stops the capture until it is added to the hidden list.
  The page is cut into tiles 2000 CSS px tall, each encoded to AVIF and WebP with sharp. Single
  images cannot hold a page this tall (WebP's limit is 16383px).
- **Sections.** Each group's top from the selector map in `capture/sections.ts`, plus the page
  height.
- **Header.** If the header is sticky: its scroll threshold (scroll down until its computed
  background changes), and a transparent-background PNG of each state, taken with the rest of the
  page hidden.
- **Tokens.** Computed styles for the hero `h1`, the hero band, the search control and a card.
- **Palettes.** Imported from each worktree's colour constant files.
- **Frutiger specimen.** From the before build only: a specimen element injected into the page
  using its loaded Frutiger, screenshotted to PNG. No font file is copied.

### 6.3 Live loops

Regions, after version only:

| Loop | Device | Region | Length |
|---|---|---|---|
| `hero` | desktop | the whole hero band | 10.2s (`ui-slot-step`) |
| `how-1..3` | desktop and mobile | each How it works vignette panel | 7s (`ui-vignette-*`) |

Loop frames are taken in the same page state as the tiles (sticky header hidden), so a loop and
the still under it are pixel-identical at frame 0. Frames are stepped, not recorded: for frame `n`
at 30fps, every animation's `currentTime` is set to
its frame-0 time plus `n/30` seconds, then the region is screenshotted. An animation whose period
does not divide the loop length is time-scaled by up to 5% so it completes whole cycles (e.g. the
2s live pulse runs at 2.04s, five cycles per 10.2s), which makes every loop seamless. If no
scaling within 5% fits, the loop grows to the smallest multiple of its longest period that does:
a 2.6s pulse beside a 7s vignette makes a 21s loop. Frame 0 of each loop is checked against the
still under it, and the capture stops if they differ. ffmpeg encodes
the frames to H.264 MP4 and VP9 WebM, tagged BT.709. Each region's edges are colour edges (band or
panel edges), so any small video colour shift does not show as a seam.

### 6.4 Data file

`src/data/captures.json`, written by the capture and read by the page:

```ts
type SectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";

type Capture = {
  version: "before" | "after";
  device: "desktop" | "mobile";
  commit: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  scale: number;
  pageHeight: number;
  tiles: { avif: string; webp: string; top: number; height: number }[];
  sections: { id: SectionId; top: number }[];
  header: {
    flipAt: number;
    states: { id: "top" | "scrolled"; src: string; height: number; blur: number | null }[];
  } | null;
  loops: {
    id: string;
    rect: { x: number; y: number; width: number; height: number };
    radius: [number, number, number, number];
    mp4: string;
    webm: string;
    duration: number;
  }[];
  tokens: {
    headline: {
      fontFamily: string;
      fontSize: string;
      lineHeight: string;
      letterSpacing: string;
      fontWeight: string;
    };
    heroGround: string;
    search: { borderRadius: string; boxShadow: string };
    card: { borderRadius: string; boxShadow: string };
  };
};

type PaletteGroup = { name: string; swatches: { name: string; hex: string }[] };

type CapturesFile = {
  captures: Capture[];
  palettes: { before: PaletteGroup[]; after: PaletteGroup[] };
  radiusScale: string[];
  specimens: { frutiger: string };
};
```

All positions are CSS px in page coordinates.

## 7. Code

Vite + React 19 + TypeScript strict, Motion (`motion/react`, loaded through `LazyMotion`),
Tailwind v4 (`@tailwindcss/vite`), Biome (100-character lines, 2-space indent), Vitest,
Playwright, pnpm, Node 24. Conventions: one component per file, a named `XProps` type per
component, `type` rather than `interface`, comments only where the why is not readable from the
code.

```
capture/          capture.ts, builds.ts, sections.ts, shoot.ts, loops.ts
public/captures/  committed outputs
src/data/         captures.json, caseStudy.ts, changes.ts, timeline.ts
src/lib/          sectionMap.ts, playScript.ts
src/hooks/        useFrameScroll.ts, usePlayback.ts
src/components/   CaseHeader, ComparisonStage, DeviceFrame, PageLayer, LiveLoop,
                  StickyHeaderOverlay, WipeDivider, SectionRail, ChangeCallouts,
                  PlayButton, DeviceToggle, DesignDiff, TokenCard, ShipTimeline
e2e/              smoke.spec.ts
```

- `sectionMap.ts`: pure; builds the mapping from two captures' sections and page heights and
  exposes `mapScroll(scrollA, viewportHeight)` plus `groupAt(scrollA, viewportHeight)`.
- `playScript.ts`: pure; the tours as data and `stateAt(script, elapsedMs)` returning device,
  scroll target, divider position and active group.
- `useFrameScroll`: binds the after layer's scroll to the before layer's transform through
  `sectionMap`, using Motion values so scrolling causes no React re-renders.
- `usePlayback`: drives `playScript` on animation frames, stops on user input.

## 8. Testing

- **Unit, test-first.** `sectionMap`: identity when both captures match; group boundaries map
  exactly; clamping at both ends; the merged `faq-about` group; different heights per device;
  monotonic output. `playScript`: state at step boundaries, mid-ease values, end state, and the
  short cut.
- **Playwright smoke** against `vite preview`: loads with no console errors; dragging the handle
  and pressing arrow keys change `aria-valuenow`; scrolling the after layer to the `how` group puts
  the before layer at its own `how` group within 2px; the device toggle swaps to mobile captures;
  `?record=16x9` hides the controls and starts Play; with reduced motion emulated, loops do not
  play and pressing Play moves the divider without animating it.
- **Visual check.** Screenshots of the key states from headless Chromium, reviewed against the
  live bookable.health at the same viewport. The Claude Browser pane runs as a hidden document
  (animations frozen), so it is not used to judge motion.

## 9. Deploy, performance, accessibility

- `pnpm build` writes static `dist/`. `VITE_BASE` sets a sub-path. The stage sizes to its
  container, so the page also works inside an iframe. `pnpm og` writes `public/og.png` (the stage
  at 50%) for link previews.
- Budgets: initial JS under 100 KB gzipped; first-paint images under 1.5 MB (the hero tiles for
  the current device only). Other tiles load as they near the frame; loops load after idle with
  the still image showing until then.
- Targets: current Chrome, Safari, Firefox and Edge; iOS Safari 17+.
- The first tile of each page layer carries alt text ("Before: the Bookable homepage on the NHS
  design system, desktop"). The slider and rail are keyboard operable. Text contrast meets
  WCAG AA on the dark ground.

## 10. Licensing and privacy

- Frutiger is licensed to the NHS: no Frutiger file is copied into this project; the specimen is a
  rendered image.
- Hanken Grotesk is OFL and loads from Google Fonts.
- Captures show the public homepage only, with public production figures and public surgery names
  and photos; no patient data is involved.
- Whether screenshots of Bookable may appear on a public portfolio is Liem's call with
  Healthtech 1.

## 11. Risks

| Risk | Handling |
|---|---|
| The 22 Sept commit fails to build in a fresh worktree | Fall back to `next dev` for that build, with the dev indicator hidden by injected CSS |
| Weglot refuses localhost, so header language pills or flags are missing | Compare the after capture with the live site; if the after header differs, take its header states from bookable.health; record any before-side gap in the README |
| Video colours drift from the stills | Regions end on colour edges; BT.709 tagging; check each loop over its still in Chrome and Safari |
| Section selectors drift between commits | `sections.ts` holds a selector per version and group; the capture fails loudly if any is missing |
