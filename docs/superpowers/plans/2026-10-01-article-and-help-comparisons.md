# Article and Help-Centre Comparisons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the showcase from one comparison to three (homepage, guide article, help centre), draw the new pages' sticky parts as live pinned layers, capture pages one at a time, and remove the ship timeline.

**Architecture:** One `ComparisonStage` driven by page data: captures, section groups, labels, notes and Play tours are keyed by `PageId`. The capture pipeline gains named builds for four sanny commits, a page list with section anchors and pinned elements, a generic pinned-layer capture (scan the page for each layer's looks, shoot each look, check the result against the CSS sticky rule), and `--page` merging that leaves every other page's data untouched. The homepage's existing data moves to the new shape without a re-shoot.

**Tech Stack:** unchanged: Vite 8, React 19, TypeScript 7, Motion 13 (`motion/react`), Tailwind CSS 4, Biome 2.5, Vitest 5, Playwright 1.63, sharp, ffmpeg, pnpm 10, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-01-article-and-help-comparisons-design.md`, which extends `docs/superpowers/specs/2026-10-01-before-after-showcase-design.md`. The first wins where they differ; the second holds wherever the first is silent.

## Global Constraints

- Work in `~/Desktop/repos/bookable-before-after` on the existing `build-showcase` branch. Never write into sanny: it is only read (`git archive`, `git rev-parse`, `git show`, reading `packages/bookable/.env.local`).
- Builds (name, commit, port): `home-before` `0a143c6820` 3061; `after` `c016453be7` 3062; `article-before` `1e021d8370^` (= `b750cbef25`) 3063; `help-before` `38facb0a65^` (= `b4e56b67e8`) 3064.
- Page paths, before → after: homepage `/` → `/`; guide article `/how-to/book-doctor-appointment-nhs` → `/book-a-gp-appointment`; help centre `/faq` → `/help`.
- Capture viewports stay desktop 1440×900 and mobile 390×844 at `deviceScaleFactor` 2; tiles 2000 CSS px tall; loops 30fps and homepage-only. All builds read `https://api.ht1.uk/v2`.
- No Frutiger font file is ever copied.
- Page title, `og:title` and case header: "Bookable, before & after". Lede: "In September 2026 Bookable's homepage, guide articles and help centre moved off the NHS design system and onto Bookable's own. Drag a divider, scroll inside a frame, or press Play." Shipped meta: "Sept 2026".
- Comparison intros: `01` Homepage, shipped 29 Sept 2026; `02` Guide article, shipped 22 Sept 2026; `03` Help centre, shipped 11 Sept 2026.
- Groups (id, rail label). Homepage: unchanged. Article: `title` Title, `guide` The guide, `questions` Common questions, `next` Next steps, `footer` Footer. Help: `title` Title & search, `questions` Questions, `more-help` More help, `footer` Footer. Only the article's before page has an absent group (`questions`).
- Pinned layer ids: `header`, `breadcrumbs`, `contents` (the article sidebar, desktop only).
- Accessible names: regions "Homepage", "Guide article", "Help centre"; sliders "<name>: divider between before and after"; rails "<name> sections".
- `?page=home|article|help` picks the page in recording mode; missing or unknown means `home`.
- The homepage tours stay exactly as they were: 34,000 ms full, 14,800 ms short.
- No homepage pixel changes: its files only move with `git mv`.
- Budgets: initial JS under 100 KB gzipped; first-paint images under 1.5 MB, counting the homepage stage only.
- Reduced motion behaves as before: no glow drift, title stagger or loops; Play cuts between states; recording mode ignores the setting.
- Conventions: one React component per file; a named `XProps` type per component; `type`, never `interface`; comments only for a non-obvious why; Biome with 100-character lines and 2-space indent; never add a lint suppression.
- Every claim on the page must be true: callout notes and intro summaries are checked against the captures and both commits' source before they ship (Task 9).
- Commit after each task with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; never push.

## Review Focus

1. A keyboard visitor tabs into a comparison that has not loaded yet: focus should still reach its divider. Pinned in Task 8 (`a keyboard visitor tabbing into a comparison reaches its divider`).
2. A visitor switches Desktop/Mobile on the article while on Common questions, the group the old page lacks: they should stay on Common questions. Pinned in Task 7 (`switching device on the article keeps it on the questions the old page lacks`).
3. A visitor changes the device on one comparison: the other comparisons should stay as they were. Pinned in Task 7 (`each comparison keeps its own device`).
4. A visitor on a phone-width screen opens the guide article comparison, whose route line is the longest text on the page: mobile captures, no sideways scroll. Pinned in Task 7 (`Guide article opens on the mobile captures without scrolling sideways`).
5. A recording link names a page the site does not know (`?record=16x9&page=nope`): it should show the homepage, not crash. Pinned in Task 4 (`falls back to the homepage for a page it does not know`) and Task 7 (`recording mode falls back to the homepage for a page it does not know`).

---

## File map

```
capture/
  builds.ts       named builds for four commits (modified)
  pages.ts        NEW: per page, the build, path, section anchors and pinned elements per version
  sections.ts     anchor kinds + resolveSections (modified)
  args.ts         NEW: --page and --skip-loops parsing
  merge.ts        NEW: merge one page's captures into captures.json
  css.ts          NEW: hidden selectors, capture CSS, isolation CSS (moved out of shoot.ts)
  pinnedPlan.ts   NEW: pure helpers for pinned capture (shot scroll, check probes)
  pinned.ts       NEW: scan, shoot and check pinned layers in a page
  inPage.ts       in-page helpers: element/absent anchors, pinned helpers (modified)
  shoot.ts        one page: sections, tokens, pinned plan, tiles, loops, layers (modified)
  capture.ts      `pnpm capture [--page …]` (modified)
  serve.ts        `pnpm capture:serve [--page …]` (modified)
  compareLive.ts  `pnpm capture:compare [--page …]` (modified)
  paths.ts        captureDir(page, version, device) (modified)
public/captures/<page>/<version>/<device>/   assets (homepage moved here)
src/
  data/  types.ts, pages.ts (NEW, replaces sections.ts), changes.ts, captures.ts,
         captures.test.ts (NEW), pages.test.ts (NEW), caseStudy.ts
  lib/   pinned.ts (NEW), capturedOn.ts (NEW), playScript.ts, urlOptions.ts (+ tests)
  components/  StageIntro (NEW), PinnedLayers (NEW), PinnedLayerView (NEW), ComparisonStage,
               StageViewport, PageLayer, SectionRail, ChangeCallouts, WipeDivider, DeviceFrame,
               BrowserChrome, DesignDiff, SiteCredits; removed: ShipTimeline, StickyHeaderOverlay
e2e/     captureData.ts, stageHelpers.ts, stage, navigation, playback, layers, smoke, og specs,
         loading.spec.ts (NEW); removed: timeline.spec.ts
```

---

### Task 1: Remove the ship timeline

**Files:**
- Delete: `src/components/ShipTimeline.tsx`, `src/data/timeline.ts`, `e2e/timeline.spec.ts`
- Modify: `src/App.tsx`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing new. `SiteCredits` stays the page's `contentinfo`.

- [ ] **Step 1: Move the credits check into the smoke test**

`e2e/timeline.spec.ts` is the only test that checks the credits. Add this test to `e2e/smoke.spec.ts`, after "introduces the case study":

```ts
test("credits the captures", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
});
```

- [ ] **Step 2: Delete the timeline**

```bash
git rm -q src/components/ShipTimeline.tsx src/data/timeline.ts e2e/timeline.spec.ts
```

- [ ] **Step 3: Take it out of the page**

In `src/App.tsx`, delete the line `import { ShipTimeline } from "./components/ShipTimeline";` and the element `<ShipTimeline />`, so `main` reads:

```tsx
              <main className="pb-24">
                <ComparisonStage options={options} />
                <DesignDiff />
              </main>
```

- [ ] **Step 4: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: everything passes; the e2e list includes "credits the captures" and no longer "tells how the redesign shipped".

Run: `grep -rn "ShipTimeline\|TIMELINE\|How it shipped" src e2e README.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add -A src e2e
git commit -q -m "Remove the ship timeline" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The pinned-layer model

**Files:**
- Modify: `src/data/types.ts`
- Create: `src/lib/pinned.ts`
- Test: `src/lib/pinned.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: types `PinnedState = { from: number; src: string; height: number; blur: number | null }` and `PinnedLayer = { id: string; x: number; y: number; width: number; stickTop: number; releaseAt: number; states: PinnedState[] }` in `src/data/types.ts`; `pinnedStateIndex(layer: PinnedLayer, scroll: number): number` and `pinnedTop(layer: PinnedLayer, scroll: number): number` in `src/lib/pinned.ts`. All values are CSS px in page coordinates; `releaseAt` is the furthest page y the layer's bottom edge can reach.

- [ ] **Step 1: Add the types**

In `src/data/types.ts`, after the `Tile` type, add:

```ts
export type PinnedState = { from: number; src: string; height: number; blur: number | null };

export type PinnedLayer = {
  id: string;
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  states: PinnedState[];
};
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/pinned.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { PinnedLayer } from "../data/types";
import { pinnedStateIndex, pinnedTop } from "./pinned";

const BAR: PinnedLayer = {
  id: "breadcrumbs",
  x: 0,
  y: 400,
  width: 1440,
  stickTop: 67,
  releaseAt: 3000,
  states: [{ from: 0, src: "bar.png", height: 46, blur: null }],
};

const CONTENTS: PinnedLayer = {
  id: "contents",
  x: 1100,
  y: 500,
  width: 250,
  stickTop: 120,
  releaseAt: 2400,
  states: [
    { from: 0, src: "contents-0.png", height: 300, blur: null },
    { from: 900, src: "contents-1.png", height: 300, blur: null },
    { from: 1500, src: "contents-2.png", height: 320, blur: null },
  ],
};

describe("pinnedTop", () => {
  it("leaves a layer where it sits until the page scrolls it up to its sticking point", () => {
    expect(pinnedTop(BAR, 0)).toBe(400);
    expect(pinnedTop(BAR, 333)).toBe(400);
  });

  it("holds a stuck layer at its offset from the top of the frame", () => {
    expect(pinnedTop(BAR, 334)).toBe(401);
    expect(pinnedTop(BAR, 1200) - 1200).toBe(67);
  });

  it("lets a layer go when its container ends", () => {
    expect(pinnedTop(BAR, 2887)).toBe(2954);
    expect(pinnedTop(BAR, 2900)).toBe(2954);
    expect(pinnedTop(BAR, 4000)).toBe(2954);
  });

  it("uses the height of the state showing", () => {
    expect(pinnedTop(CONTENTS, 2300)).toBe(2080);
  });

  it("never lifts a layer above where it sits, even in a short container", () => {
    expect(pinnedTop({ ...BAR, releaseAt: 420 }, 1000)).toBe(400);
  });

  it("keeps a header at the top of the frame for the whole page", () => {
    const header: PinnedLayer = {
      id: "header",
      x: 0,
      y: 0,
      width: 1440,
      stickTop: 0,
      releaseAt: 3772,
      states: [
        { from: 0, src: "top.png", height: 67, blur: null },
        { from: 1, src: "scrolled.png", height: 67, blur: 10 },
      ],
    };
    for (const scroll of [0, 1, 500, 2872]) expect(pinnedTop(header, scroll)).toBe(scroll);
  });
});

describe("pinnedStateIndex", () => {
  it("shows each state from its start until the next one begins", () => {
    expect(pinnedStateIndex(CONTENTS, 0)).toBe(0);
    expect(pinnedStateIndex(CONTENTS, 899)).toBe(0);
    expect(pinnedStateIndex(CONTENTS, 900)).toBe(1);
    expect(pinnedStateIndex(CONTENTS, 1499)).toBe(1);
    expect(pinnedStateIndex(CONTENTS, 1500)).toBe(2);
    expect(pinnedStateIndex(CONTENTS, 9000)).toBe(2);
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `pnpm vitest run src/lib/pinned.test.ts`
Expected: FAIL, `Failed to resolve import "./pinned"`.

- [ ] **Step 4: Implement**

Create `src/lib/pinned.ts`:

```ts
import type { PinnedLayer } from "../data/types";

export function pinnedStateIndex(layer: PinnedLayer, scroll: number): number {
  let index = 0;
  for (const [candidate, state] of layer.states.entries()) {
    if (scroll >= state.from) index = candidate;
  }
  return index;
}

export function pinnedTop(layer: PinnedLayer, scroll: number): number {
  const { height } = layer.states[pinnedStateIndex(layer, scroll)];
  return Math.max(layer.y, Math.min(scroll + layer.stickTop, layer.releaseAt - height));
}
```

- [ ] **Step 5: Run it to see it pass**

Run: `pnpm vitest run src/lib/pinned.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add src/data/types.ts src/lib/pinned.ts src/lib/pinned.test.ts
git commit -q -m "Model pinned layers with the CSS sticky rule" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Move the homepage onto the per-page data format

The page and the capture keep showing only the homepage, but every capture now names its page, sticky parts are `pinned` layers, the design tokens sit at the top of the file, and assets live under `public/captures/home/`.

**Files:**
- Modify: `src/data/types.ts`, `src/data/captures.ts`, `src/data/captures.json` (rewritten by a script), `src/components/StageViewport.tsx`, `src/components/ComparisonStage.tsx`, `src/components/DesignDiff.tsx`, `src/components/SiteCredits.tsx`, `scripts/budget.ts`, `capture/paths.ts`, `capture/shoot.ts`, `capture/capture.ts`, `capture/compareLive.ts`, `e2e/captureData.ts`, `e2e/stage.spec.ts`, `e2e/layers.spec.ts`, `e2e/navigation.spec.ts`
- Move: `public/captures/before` → `public/captures/home/before`, `public/captures/after` → `public/captures/home/after`
- Create: `src/components/PinnedLayers.tsx`, `src/components/PinnedLayerView.tsx`, `.capture/migrate-captures.mjs` (gitignored, run once)
- Delete: `src/components/StickyHeaderOverlay.tsx`
- Test: `src/data/captures.test.ts`

**Interfaces:**
- Consumes: `PinnedLayer`, `PinnedState`, `pinnedStateIndex`, `pinnedTop` (Task 2).
- Produces: `PageId = "home" | "article" | "help"`; `Capture` gains `page: PageId` and `pinned: PinnedLayer[]`, loses `header` and `tokens`; `CapturesFile` gains `tokens: { before: MeasuredTokens; after: MeasuredTokens }`; `captureFor(page: PageId, version: Version, device: Device): Capture`; `captureDir(page: PageId, version: Version, device: Device): string`; `CaptureResult = { capture: Capture; tokens: MeasuredTokens }` from `capturePage`; `PinnedLayers` props `{ layers: readonly PinnedLayer[]; width: number; scale: number; scroll: MotionValue<number> }`; each layer renders `data-testid="pinned-<id>"` with `data-state="<index>"`, and each state `data-testid="pinned-<id>-<index>"`; `captureOf(page, version, device)` in `e2e/captureData.ts`.

- [ ] **Step 1: Write the failing data test**

Create `src/data/captures.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTURES } from "./captures";

const PUBLIC = join(import.meta.dirname, "../../public");

describe("captures.json", () => {
  it("names the page of every capture", () => {
    expect(CAPTURES.captures.filter((capture) => capture.page === undefined)).toEqual([]);
  });

  it("points only at files that exist", () => {
    const paths = CAPTURES.captures.flatMap((capture) => [
      ...capture.tiles.flatMap((tile) => [tile.avif, tile.webp]),
      ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
      ...capture.loops.flatMap((loop) => [loop.mp4, loop.webm]),
    ]);
    paths.push(CAPTURES.specimens.frutiger);
    expect(paths.filter((path) => !existsSync(join(PUBLIC, path)))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/data/captures.test.ts`
Expected: FAIL. The first test lists four captures with no `page`; the second throws `Cannot read properties of undefined (reading 'flatMap')`, because the file still has `header` rather than `pinned`.

- [ ] **Step 3: Reshape the types**

Replace `src/data/types.ts` with:

```ts
export type PageId = "home" | "article" | "help";
export type Version = "before" | "after";
export type Device = "desktop" | "mobile";
export type SectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";

export type Rect = { x: number; y: number; width: number; height: number };

export type Tile = { avif: string; webp: string; top: number; height: number };

export type PinnedState = { from: number; src: string; height: number; blur: number | null };

export type PinnedLayer = {
  id: string;
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  states: PinnedState[];
};

export type SectionTop = { id: SectionId; top: number };

export type Loop = {
  id: string;
  rect: Rect;
  radius: [number, number, number, number];
  mp4: string;
  webm: string;
  duration: number;
};

export type MeasuredTokens = {
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

export type Capture = {
  page: PageId;
  version: Version;
  device: Device;
  commit: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  scale: number;
  pageHeight: number;
  tiles: Tile[];
  sections: SectionTop[];
  pinned: PinnedLayer[];
  loops: Loop[];
};

export type PaletteGroup = { name: string; swatches: { name: string; hex: string }[] };

export type CapturesFile = {
  captures: Capture[];
  tokens: { before: MeasuredTokens; after: MeasuredTokens };
  palettes: { before: PaletteGroup[]; after: PaletteGroup[] };
  radiusScale: string[];
  specimens: { frutiger: string };
};
```

- [ ] **Step 4: Move the homepage assets**

```bash
mkdir -p public/captures/home
git mv public/captures/before public/captures/home/before
git mv public/captures/after public/captures/home/after
```

- [ ] **Step 5: Rewrite captures.json with a one-off script**

Create `.capture/migrate-captures.mjs` (the `.capture` directory is gitignored):

```js
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/data/captures.json";
const old = JSON.parse(readFileSync(FILE, "utf8"));
const moved = (path) => path.replace(/^captures\/(before|after)\//, "captures/home/$1/");

function tokensOf(version) {
  const capture = old.captures.find(
    (entry) => entry.version === version && entry.device === "desktop",
  );
  if (!capture) throw new Error(`There is no ${version} desktop capture`);
  return capture.tokens;
}

const captures = old.captures.map((capture) => ({
  page: "home",
  version: capture.version,
  device: capture.device,
  commit: capture.commit,
  capturedAt: capture.capturedAt,
  viewport: capture.viewport,
  scale: capture.scale,
  pageHeight: capture.pageHeight,
  tiles: capture.tiles.map((tile) => ({ ...tile, avif: moved(tile.avif), webp: moved(tile.webp) })),
  sections: capture.sections,
  pinned:
    capture.header === null
      ? []
      : [
          {
            id: "header",
            x: 0,
            y: 0,
            width: capture.viewport.width,
            stickTop: 0,
            releaseAt: capture.pageHeight,
            states: capture.header.states.map((state) => ({
              from: state.id === "top" ? 0 : capture.header.flipAt,
              src: moved(state.src),
              height: state.height,
              blur: state.blur,
            })),
          },
        ],
  loops: capture.loops.map((loop) => ({ ...loop, mp4: moved(loop.mp4), webm: moved(loop.webm) })),
}));

const file = {
  captures,
  tokens: { before: tokensOf("before"), after: tokensOf("after") },
  palettes: old.palettes,
  radiusScale: old.radiusScale,
  specimens: old.specimens,
};
writeFileSync(FILE, `${JSON.stringify(file, null, 2)}\n`);
console.log(`Rewrote ${FILE} with ${captures.length} homepage captures`);
```

Run: `node .capture/migrate-captures.mjs`
Expected: `Rewrote src/data/captures.json with 4 homepage captures`.

- [ ] **Step 6: Run the data test to see it pass**

Run: `pnpm vitest run src/data/captures.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 7: Look captures up by page**

In `src/data/captures.ts`, replace `captureFor` with:

```ts
export function captureFor(page: PageId, version: Version, device: Device): Capture {
  const capture = CAPTURES.captures.find(
    (entry) => entry.page === page && entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`There is no ${page} ${version} capture for ${device}`);
  return capture;
}
```

and change its type import to `import type { Capture, CapturesFile, Device, PageId, Version } from "./types";`.

- [ ] **Step 8: Draw pinned layers**

Create `src/components/PinnedLayerView.tsx`:

```tsx
import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { assetUrl } from "../data/captures";
import type { PinnedLayer } from "../data/types";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { pinnedStateIndex, pinnedTop } from "../lib/pinned";

type PinnedLayerViewProps = { layer: PinnedLayer; scroll: MotionValue<number> };

export function PinnedLayerView({ layer, scroll }: PinnedLayerViewProps) {
  const [shown, setShown] = useState(() => pinnedStateIndex(layer, scroll.get()));
  const position = useLiveStyle<HTMLDivElement>(
    scroll,
    "transform",
    (pagePx) => `translate(${layer.x}px, ${pinnedTop(layer, pagePx) - pagePx}px)`,
  );
  useMotionValueEvent(scroll, "change", (pagePx) => setShown(pinnedStateIndex(layer, pagePx)));
  return (
    <div
      ref={position.ref}
      data-testid={`pinned-${layer.id}`}
      data-state={shown}
      className="absolute top-0 left-0"
      style={{ ...position.style, width: layer.width }}
    >
      {layer.states.map((state, index) => (
        <div
          key={state.src}
          data-testid={`pinned-${layer.id}-${index}`}
          className="absolute top-0 left-0 transition-opacity duration-[250ms]"
          style={{
            width: layer.width,
            height: state.height,
            opacity: index === shown ? 1 : 0,
            backdropFilter: state.blur === null ? undefined : `blur(${state.blur}px)`,
          }}
        >
          <img
            src={assetUrl(state.src)}
            alt=""
            width={Math.round(layer.width)}
            height={Math.round(state.height)}
            className="block max-w-none"
            style={{ width: layer.width, height: state.height }}
          />
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/PinnedLayers.tsx`:

```tsx
import type { MotionValue } from "motion/react";
import type { PinnedLayer } from "../data/types";
import { PinnedLayerView } from "./PinnedLayerView";

type PinnedLayersProps = {
  layers: readonly PinnedLayer[];
  width: number;
  scale: number;
  scroll: MotionValue<number>;
};

export function PinnedLayers({ layers, width, scale, scroll }: PinnedLayersProps) {
  if (layers.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ width, transform: `scale(${scale})` }}
    >
      {layers.map((layer) => (
        <PinnedLayerView key={layer.id} layer={layer} scroll={scroll} />
      ))}
    </div>
  );
}
```

Delete the old overlay: `git rm -q src/components/StickyHeaderOverlay.tsx`

In `src/components/StageViewport.tsx`:
- replace `import { StickyHeaderOverlay } from "./StickyHeaderOverlay";` with `import { PinnedLayers } from "./PinnedLayers";`;
- change the two lookups to `captureFor("home", "before", device)` and `captureFor("home", "after", device)`;
- replace the after-side `{after.header && (<StickyHeaderOverlay … scroll={scrollA} />)}` block with:

```tsx
      <PinnedLayers
        layers={after.pinned}
        width={after.viewport.width}
        scale={scale}
        scroll={scrollA}
      />
```

- replace the before-side `{before.header && (<StickyHeaderOverlay … scroll={scrollB} />)}` block with:

```tsx
          <PinnedLayers
            layers={before.pinned}
            width={before.viewport.width}
            scale={scale}
            scroll={scrollB}
          />
```

- [ ] **Step 9: Point the other readers at the new shape**

In `src/components/ComparisonStage.tsx`, change `mapFor` and the frame lookup to pass `"home"` first: `captureFor("home", "after", device)` and `captureFor("home", "before", device)`.

In `src/components/SiteCredits.tsx`, change the lookup to `captureFor("home", "after", "desktop")`.

In `src/components/DesignDiff.tsx`, change the import to `import { CAPTURES } from "../data/captures";` and the first lines of the component to:

```tsx
  const { tokens, palettes, radiusScale, specimens } = CAPTURES;
  const { before, after } = tokens;
```

In `scripts/budget.ts`, replace the `firstPaint` expression with:

```ts
const firstPaint = data.captures
  .filter((capture) => capture.page === "home" && capture.device === "desktop")
  .flatMap((capture) => [
    capture.tiles[0].avif,
    ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
  ]);
```

- [ ] **Step 10: Write the new shape from the capture**

In `capture/paths.ts`, replace `captureDir` and its type import:

```ts
import type { Device, PageId, Version } from "../src/data/types";
```

```ts
export function captureDir(page: PageId, version: Version, device: Device): string {
  return join(PUBLIC_DIR, "captures", page, version, device);
}
```

In `capture/shoot.ts`:
- change the type import to `import type { Capture, MeasuredTokens, PageId, PinnedLayer, PinnedState, Tile, Version } from "../src/data/types";`;
- add `page: PageId;` as the first field of `PageJob`;
- add, after `PageJob`: `export type CaptureResult = { capture: Capture; tokens: MeasuredTokens };`;
- change `captureHeaderStates` to return `Promise<PinnedState[]>`, ending with:

```ts
  return [
    { from: 0, src: publicPath(top), height: topShot.height, blur: null },
    { from: flipAt, src: publicPath(scrolled), height: scrolledShot.height, blur: scrolledShot.blur },
  ];
```

- replace `capturePage` with:

```ts
export async function capturePage(browser: Browser, job: PageJob): Promise<CaptureResult> {
  const { context, page } = await openPage(browser, job.url, job.profile);
  try {
    await page.evaluate(settleInPage);
    await page.evaluate(pauseInfiniteAnimationsInPage);
    const sections = assertSections(
      await page.evaluate(sectionTopsInPage, anchorList(job.version)),
    );
    const tokens = await page.evaluate(measureTokensInPage, TOKEN_SELECTORS[job.version]);
    const sticky = await page.evaluate(markStickyHeaderInPage);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements: ${floating.join(", ")}. Add them to HIDDEN_SELECTORS in capture/shoot.ts.`,
      );
    }
    const outDir = captureDir(job.page, job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const { tiles, pageHeight, full } = await captureTiles(page, outDir);
    const loops = job.withLoops ? await captureLoops(page, job.profile.device, outDir, full) : [];
    const pinned: PinnedLayer[] = sticky
      ? [
          {
            id: "header",
            x: 0,
            y: 0,
            width: job.profile.viewport.width,
            stickTop: 0,
            releaseAt: pageHeight,
            states: await captureHeaderStates(page, outDir),
          },
        ]
      : [];
    if (job.withSpecimen) await captureSpecimen(page);
    return {
      capture: {
        page: job.page,
        version: job.version,
        device: job.profile.device,
        commit: job.commit,
        capturedAt: new Date().toISOString(),
        viewport: job.profile.viewport,
        scale: SCALE,
        pageHeight,
        tiles,
        sections,
        pinned,
        loops,
      },
      tokens,
    };
  } finally {
    await context.close();
  }
}
```

In `capture/capture.ts`:
- change the type import to `import type { CapturesFile, Device, MeasuredTokens, Version } from "../src/data/types";` and the shoot import to `import { type CaptureResult, capturePage } from "./shoot";`;
- rename `captures` to `results` (typed `CaptureResult[]`) and add `page: "home",` as the first field of the job passed to `capturePage`;
- replace the `file` object with:

```ts
    const tokensOf = (version: Version): MeasuredTokens => {
      const found = results.find(
        ({ capture }) => capture.version === version && capture.device === "desktop",
      );
      if (!found) throw new Error(`There is no ${version} desktop capture to take tokens from`);
      return found.tokens;
    };
    const file: CapturesFile = {
      captures: results.map(({ capture }) => capture),
      tokens: { before: tokensOf("before"), after: tokensOf("after") },
      palettes: {
        before: paletteGroups(
          extractObjectLiteral(
            sourceIn(before, "packages/bookable/tailwind.config.ts"),
            "NHS_COLORS",
          ),
        ),
        after: paletteGroups(
          extractObjectLiteral(
            sourceIn(after, "packages/bookable/app/_ui/tokens.colors.ts"),
            "UI_COLORS",
          ),
        ),
      },
      radiusScale: radiusScale(sourceIn(after, "packages/bookable/app/_ui/tokens.ts")),
      specimens: { frutiger: "captures/specimen-frutiger.png" },
    };
```

In `capture/compareLive.ts`, make the lookup `(capture) => capture.page === "home" && capture.version === "after" && capture.device === "desktop"`.

- [ ] **Step 11: Update the end-to-end helpers and specs**

In `e2e/captureData.ts`, change the type import to include `PageId` and replace `captureOf` with:

```ts
export function captureOf(page: PageId, version: Version, device: Device): Capture {
  const capture = FILE.captures.find(
    (entry) => entry.page === page && entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`No ${page} ${version} capture for ${device}`);
  return capture;
}
```

Then:
- `e2e/stage.spec.ts`: `captureOf("home", "after", "desktop")`, `captureOf("home", "before", "desktop")`, and the phone regex `/captures\/home\/after\/mobile\//`;
- `e2e/navigation.spec.ts`: `captureOf("home", "after", "desktop")` and the regex `/captures\/home\/after\/mobile\//`;
- `e2e/layers.spec.ts`: `captureOf("home", "after", "desktop")`, and in the header test `const solid = page.getByTestId("pinned-header-1");`.

- [ ] **Step 12: Verify**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all pass.

Run: `pnpm build && pnpm budget`
Expected: about `Initial JS: 96 KB` and `First-paint images: 0.33 MB`, both under budget.

Run: `git status --short public/captures | grep -v '^R '`
Expected: no output (every asset is a pure rename, so no pixel changed).

- [ ] **Step 13: Commit**

```bash
git add -A src e2e scripts capture public/captures
git commit -q -m "Move the homepage captures onto a per-page format with pinned layers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Per-page groups, notes and tours

The data and pure logic learn about all three pages. The page still renders only the homepage stage.

**Files:**
- Modify: `src/data/types.ts`, `src/data/changes.ts`, `src/lib/playScript.ts`, `src/lib/playScript.test.ts`, `src/lib/urlOptions.ts`, `src/lib/urlOptions.test.ts`, `src/lib/sectionMap.test.ts`, `src/components/SectionRail.tsx`, `src/components/ChangeCallouts.tsx`, `src/components/ComparisonStage.tsx`, `src/data/captures.test.ts`, `capture/sections.ts`
- Create: `src/data/pages.ts`, `src/data/pages.test.ts`
- Delete: `src/data/sections.ts`

**Interfaces:**
- Consumes: `PageId`, `captureFor` (Task 3).
- Produces: types `HomeSectionId`, `ArticleSectionId`, `HelpSectionId`, `SectionIdOf`, and `SectionId = SectionIdOf[PageId]`; from `src/data/pages.ts`: `PageSection`, `PageInfo = { id; number; name; noun; summary; route: { before: string; after: string }; shipped; sections: readonly PageSection[] }`, `PAGE_IDS`, `PAGES: Record<PageId, PageInfo>`, `isPageId(value: string | null): value is PageId`, `sectionIds(page): SectionId[]`, `sectionLabel(page, id): string`, `addressOf(page): string`; from `src/data/changes.ts`: `CHANGES` (typed per page) and `changesFor(page, id): readonly string[]`; from `src/lib/playScript.ts`: `Tours = { full: PlayScript; short: PlayScript }` and `TOURS: Record<PageId, Tours>` (replacing `FULL_TOUR` and `SHORT_TOUR`); `UrlOptions` gains `page: PageId`; `SectionRail` and `ChangeCallouts` take a `page: PageId` prop.

- [ ] **Step 1: Widen the group ids**

In `src/data/types.ts`, replace the `SectionId` line with:

```ts
export type HomeSectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";
export type ArticleSectionId = "title" | "guide" | "questions" | "next" | "footer";
export type HelpSectionId = "title" | "questions" | "more-help" | "footer";
export type SectionIdOf = { home: HomeSectionId; article: ArticleSectionId; help: HelpSectionId };
export type SectionId = SectionIdOf[PageId];
```

- [ ] **Step 2: Write the failing tests**

Create `src/data/pages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CHANGES } from "./changes";
import { addressOf, isPageId, PAGE_IDS, sectionIds, sectionLabel } from "./pages";

describe("pages", () => {
  it("lists every page's groups in the order its notes are written", () => {
    for (const page of PAGE_IDS) expect(sectionIds(page)).toEqual(Object.keys(CHANGES[page]));
  });

  it("gives every group two or three notes", () => {
    for (const page of PAGE_IDS) {
      for (const notes of Object.values(CHANGES[page])) {
        expect(notes.length).toBeGreaterThanOrEqual(2);
        expect(notes.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("labels each page's groups", () => {
    expect(sectionLabel("home", "how")).toBe("How it works");
    expect(sectionLabel("article", "questions")).toBe("Common questions");
    expect(sectionLabel("help", "questions")).toBe("Questions");
    expect(() => sectionLabel("help", "hero")).toThrow("hero is not a group of the help page");
  });

  it("addresses each frame by the after page's path", () => {
    expect(addressOf("home")).toBe("bookable.health");
    expect(addressOf("article")).toBe("bookable.health/book-a-gp-appointment");
    expect(addressOf("help")).toBe("bookable.health/help");
  });

  it("recognises page ids", () => {
    expect(isPageId("article")).toBe(true);
    expect(isPageId("faq")).toBe(false);
    expect(isPageId(null)).toBe(false);
  });
});
```

In `src/lib/urlOptions.test.ts`, add `page: "home"` to every expected object, and add:

```ts
  it("reads the page to record", () => {
    expect(parseUrlOptions("?record=16x9&page=article")).toEqual({
      record: "16x9",
      tour: "full",
      page: "article",
    });
  });

  it("falls back to the homepage for a page it does not know", () => {
    expect(parseUrlOptions("?record=16x9&page=nope").page).toBe("home");
    expect(parseUrlOptions("?page").page).toBe("home");
  });
```

In `src/lib/playScript.test.ts`:
- change the imports to `import { PAGE_IDS, sectionIds } from "../data/pages";`, `import type { Device, SectionId } from "../data/types";` and `import { durationOf, type PlayScript, type ScrollResolver, stateAt, TOURS } from "./playScript";`;
- type the fixture as `const TOPS: Record<Device, Partial<Record<SectionId, number>>> = { … }` (same values) and the resolver as `(device, target) => (target === "top" ? 0 : (TOPS[device][target] ?? Number.NaN))`;
- add, after the imports, `const FULL_TOUR = TOURS.home.full;` and `const SHORT_TOUR = TOURS.home.short;` so the existing tests read unchanged;
- add at the end:

```ts
function glideStops(script: PlayScript): string[] {
  return script.steps.flatMap((step) => (step.kind === "glide" ? [step.to] : []));
}

describe("TOURS", () => {
  it("keeps the homepage tours as they were", () => {
    expect(durationOf(TOURS.home.full)).toBe(34_000);
    expect(durationOf(TOURS.home.short)).toBe(14_800);
    expect(glideStops(TOURS.home.full)).toEqual([
      "proof",
      "how",
      "faq-about",
      "areas",
      "footer",
      "top",
      "proof",
      "how",
      "top",
    ]);
  });

  it("only glides to groups of its own page", () => {
    for (const page of PAGE_IDS) {
      const groups = new Set<string>(["top", ...sectionIds(page)]);
      for (const script of [TOURS[page].full, TOURS[page].short]) {
        expect(glideStops(script).filter((stop) => !groups.has(stop))).toEqual([]);
      }
    }
  });

  it("keeps every short tour under 20 seconds", () => {
    for (const page of PAGE_IDS) expect(durationOf(TOURS[page].short)).toBeLessThan(20_000);
  });
});
```

In `src/lib/sectionMap.test.ts`, change the helper to take the ids, `function layout(heights: readonly number[], ids: readonly SectionId[] = IDS): PageLayout`, using `ids[index]` for each section, and add inside the `describe`:

```ts
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
```

In `src/data/captures.test.ts`, add the import `import { sectionIds } from "./pages";` and this test:

```ts
  it("groups every capture by its page's groups", () => {
    for (const capture of CAPTURES.captures) {
      expect(capture.sections.map((section) => section.id)).toEqual(sectionIds(capture.page));
    }
  });
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm test`
Expected: FAIL. `pages.test.ts` and `captures.test.ts` cannot resolve `./pages`; `playScript.test.ts` reports `TOURS` is not exported; the `urlOptions` tests get no `page`. The new `sectionMap` test already passes: an empty group needs no new code, and the test pins that.

- [ ] **Step 4: Write the page list**

Create `src/data/pages.ts`:

```ts
import type { PageId, SectionId, SectionIdOf } from "./types";

export type PageSection = { id: SectionId; label: string };

export type PageInfo = {
  id: PageId;
  number: string;
  name: string;
  noun: string;
  summary: string;
  route: { before: string; after: string };
  shipped: string;
  sections: readonly PageSection[];
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

export const PAGE_IDS: readonly PageId[] = ["home", "article", "help"];

export const PAGES: Record<PageId, PageInfo> = {
  home: {
    id: "home",
    number: "01",
    name: "Homepage",
    noun: "homepage",
    summary:
      "The landing page: one postcode search at the heart of the hero, one testimonials section in place of three proof blocks, and a live vignette for each step of how it works.",
    route: { before: "/", after: "/" },
    shipped: "29 Sept 2026",
    sections: HOME_SECTIONS,
  },
  article: {
    id: "article",
    number: "02",
    name: "Guide article",
    noun: "guide article",
    summary:
      "A how-to page on the NHS design system becomes the v2 article template: a hero, a summary up top, a contents list that follows the reader, and questions answered in place.",
    route: { before: "/how-to/book-doctor-appointment-nhs", after: "/book-a-gp-appointment" },
    shipped: "22 Sept 2026",
    sections: ARTICLE_SECTIONS,
  },
  help: {
    id: "help",
    number: "03",
    name: "Help centre",
    noun: "help centre",
    summary:
      "One long page of FAQ accordions becomes a help centre you can search, with popular questions up front and a page for every topic.",
    route: { before: "/faq", after: "/help" },
    shipped: "11 Sept 2026",
    sections: HELP_SECTIONS,
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
```

Delete the old list: `git rm -q src/data/sections.ts`

- [ ] **Step 5: Write the notes per page**

Replace `src/data/changes.ts` with the version below. The homepage notes are unchanged. The article and help notes are drafts written from the source; Task 9 checks every one against the captures before they ship.

```ts
import type { PageId, SectionId, SectionIdOf } from "./types";

type PageChanges = { [P in PageId]: Record<SectionIdOf[P], readonly string[]> };

export const CHANGES: PageChanges = {
  home: {
    hero: [
      "The postcode search becomes the hero's single control, lifted further here than anywhere else it appears.",
      "A reel of appointment cards scrolls beside the search on desktop.",
      "The header lies clear over the hero and turns solid as soon as the page moves.",
    ],
    proof: [
      "Stats, a top-rated surgeries list and reviews, three NHS-styled blocks, merge into one testimonials section.",
      "Headline figures sit under the quotes they back up.",
    ],
    how: [
      "Icons give way to looping product vignettes for each step.",
      "Steps are numbered with tracked microlabels: Step 1, Step 2, Step 3.",
    ],
    "faq-about": [
      "The FAQ moves above About.",
      'Its title changes from "Common questions about finding an NHS GP in England" to "Questions before you start".',
    ],
    areas: [
      'The "Looking for a GP in a specific city?" tag list becomes a call to action: "Find an NHS GP surgery in your area".',
      "The areas where Bookable is live sit underneath, ready to browse.",
    ],
    footer: [
      "The NHS three-column footer becomes one site-wide footer: brand, inline nav, the 111/999 disclaimer and legal links.",
      "On phones the nav becomes 56px full-width rows and the legal links a two-column grid.",
    ],
  },
  article: {
    title: [
      "A bare NHS heading becomes a hero that names the category, Booking care, with a 4 min read time and when the guide was last reviewed.",
      "Breadcrumbs sit under the hero, then pin beneath the header as you read.",
    ],
    guide: [
      "Two headed sections grow into six, opened by an In short summary of three points.",
      "On desktop an On this page list follows you down the article and marks the section you are in.",
    ],
    questions: [
      "New in v2: four common questions answered on the page, each in its own card.",
      "The how-to page had no questions, so the before side waits here while they scroll past.",
    ],
    next: [
      'A lone "Find a new GP surgery near you" button becomes a "Ready when you are" card with the postcode search inside it.',
      "Related articles below carry the reader on to the next guide.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
  help: {
    title: [
      'A plain "Frequently asked questions" heading over a list of links becomes a search-first hero: "How can we help?"',
      "The search filters every answer as you type.",
    ],
    questions: [
      "49 questions in ten expanding sections give way to a short list of popular questions and a grid of topics.",
      "Each topic gets its own page, so an answer has an address worth sharing.",
    ],
    "more-help": [
      '"Need more help?" and its three bullets become a "Still need help?" panel.',
      "Its cards go straight to Call 111, nhs.uk and Call 999.",
    ],
    footer: [
      "The NHS footer becomes the site-wide footer the homepage ends on.",
      "On phones its nav becomes full-width rows and the legal links a two-column grid.",
    ],
  },
};

export function changesFor(page: PageId, id: SectionId): readonly string[] {
  const notes: Partial<Record<SectionId, readonly string[]>> = CHANGES[page];
  const found = notes[id];
  if (!found) throw new Error(`There are no notes for ${id} on the ${page} page`);
  return found;
}
```

- [ ] **Step 6: Build a tour for each page**

In `src/lib/playScript.ts`, change the type import to `import type { Device, PageId, SectionId } from "../data/types";`, and replace `FULL_TOUR` and `SHORT_TOUR` with:

```ts
function fullTour(desktopStops: readonly SectionId[], mobileStops: readonly SectionId[]): PlayScript {
  return {
    start: { device: "desktop", divider: 1 },
    steps: [
      ...OPENING_SWEEP,
      ...tour(desktopStops),
      ...MOBILE_SWEEP,
      ...tour(mobileStops),
      { kind: "glide", to: "top", ms: 1200 },
      { kind: "device", to: "desktop", ms: 800 },
    ],
  };
}

function shortTour(stops: readonly SectionId[]): PlayScript {
  return {
    start: { device: "desktop", divider: 1 },
    steps: [
      ...OPENING_SWEEP,
      ...tour(stops),
      ...MOBILE_SWEEP,
      { kind: "device", to: "desktop", ms: 800 },
    ],
  };
}

export type Tours = { full: PlayScript; short: PlayScript };

export const TOURS: Record<PageId, Tours> = {
  home: {
    full: fullTour(["proof", "how", "faq-about", "areas", "footer"], ["proof", "how"]),
    short: shortTour(["proof", "how"]),
  },
  article: {
    full: fullTour(["guide", "questions", "next", "footer"], ["guide", "questions"]),
    short: shortTour(["guide", "questions"]),
  },
  help: {
    full: fullTour(["questions", "more-help", "footer"], ["questions", "more-help"]),
    short: shortTour(["questions", "more-help"]),
  },
};
```

- [ ] **Step 7: Read the page from the URL**

Replace `src/lib/urlOptions.ts` with:

```ts
import { isPageId } from "../data/pages";
import type { PageId } from "../data/types";

export type RecordAspect = "16x9" | "4x3";

export type UrlOptions = { record: RecordAspect | null; tour: "full" | "short"; page: PageId };

export function parseUrlOptions(search: string): UrlOptions {
  const params = new URLSearchParams(search);
  const record = params.get("record");
  const page = params.get("page");
  return {
    record: record === "16x9" || record === "4x3" ? record : null,
    tour: params.get("tour") === "short" ? "short" : "full",
    page: isPageId(page) ? page : "home",
  };
}
```

- [ ] **Step 8: Run the tests to see them pass**

Run: `pnpm test`
Expected: the new tests pass; the remaining failures are type errors in components that still import `src/data/sections.ts`, fixed next.

- [ ] **Step 9: Give the rail and the callouts a page**

Replace `src/components/SectionRail.tsx` with:

```tsx
import { m } from "motion/react";
import { PAGES } from "../data/pages";
import type { PageId, SectionId } from "../data/types";

export type RailLayout = "responsive" | "vertical" | "horizontal";

type SectionRailProps = {
  page: PageId;
  active: SectionId;
  onSelect: (id: SectionId) => void;
  layout: RailLayout;
};

const LIST: Record<RailLayout, string> = {
  responsive:
    "flex gap-1 overflow-x-auto pb-1 @min-[1100px]/stage:flex-col @min-[1100px]/stage:overflow-visible @min-[1100px]/stage:pb-0",
  vertical: "flex flex-col gap-1",
  horizontal: "flex flex-wrap justify-center gap-1",
};

export function SectionRail({ page, active, onSelect, layout }: SectionRailProps) {
  const { name, sections } = PAGES[page];
  return (
    <nav aria-label={`${name} sections`}>
      <ol className={LIST[layout]}>
        {sections.map(({ id, label }) => (
          <li key={id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(id)}
              aria-current={id === active ? "true" : undefined}
              className="relative w-full whitespace-nowrap rounded-full px-3.5 py-2 text-left font-bold text-mist/60 text-sm transition-colors hover:text-mist aria-[current=true]:text-ink"
            >
              {id === active && (
                <m.span
                  layoutId="rail-active"
                  className="absolute inset-0 rounded-full bg-mint"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

Replace `src/components/ChangeCallouts.tsx` with:

```tsx
import { AnimatePresence, m } from "motion/react";
import { useId } from "react";
import { changesFor } from "../data/changes";
import { sectionLabel } from "../data/pages";
import type { PageId, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";

type ChangeCalloutsProps = { page: PageId; group: SectionId };

const LIST = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ChangeCallouts({ page, group }: ChangeCalloutsProps) {
  const { reduced } = useMotionPreference();
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} className="max-w-[420px]">
      <p id={headingId} className="caption text-mint">
        What changed · {sectionLabel(page, group)}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <m.ul
          key={group}
          className="mt-4 space-y-3"
          variants={LIST}
          initial={reduced ? false : "hidden"}
          animate="shown"
          exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
        >
          {changesFor(page, group).map((note) => (
            <m.li
              key={note}
              variants={reduced ? undefined : ITEM}
              className="flex gap-3 text-[15px] text-mist/85 leading-relaxed"
            >
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-mint" />
              {note}
            </m.li>
          ))}
        </m.ul>
      </AnimatePresence>
    </aside>
  );
}
```

In `src/components/ComparisonStage.tsx`:
- replace `import { FULL_TOUR, SHORT_TOUR } from "../lib/playScript";` with `import { TOURS } from "../lib/playScript";`;
- replace `const script = options.tour === "short" ? SHORT_TOUR : FULL_TOUR;` with `const script = TOURS.home[options.tour];`;
- pass `page="home"` to `<SectionRail … />` and `<ChangeCallouts … />`.

- [ ] **Step 10: Keep the capture's homepage anchors compiling**

In `capture/sections.ts`:
- replace `import { SECTION_IDS } from "../src/data/sections";` with `import { sectionIds } from "../src/data/pages";`, and the type import with `import type { HomeSectionId, SectionId, SectionTop, Version } from "../src/data/types";`;
- type the map as `Record<Version, Record<HomeSectionId, SectionAnchor>>`;
- replace `anchorList` with:

```ts
export function anchorList(version: Version): [SectionId, SectionAnchor][] {
  const anchors: Partial<Record<SectionId, SectionAnchor>> = SECTION_ANCHORS[version];
  return sectionIds("home").map((id): [SectionId, SectionAnchor] => {
    const anchor = anchors[id];
    if (!anchor) throw new Error(`The homepage ${version} has no anchor for ${id}`);
    return [id, anchor];
  });
}
```

- in `assertSections`, compare with `sectionIds("home").join(",")`.

- [ ] **Step 11: Verify**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all pass, with the homepage behaving exactly as before.

- [ ] **Step 12: Commit**

```bash
git add -A src capture
git commit -q -m "Give every page its own groups, notes and Play tours" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Capture plumbing for any page

The capture learns the four builds, the page list and its anchors, `--page`, and merging. Nothing is shot in this task. It ends by building and serving the two old commits, the riskiest step in the work.

**Files:**
- Create: `capture/pages.ts`, `capture/args.ts`, `capture/merge.ts`, `capture/css.ts`
- Modify: `capture/builds.ts`, `capture/sections.ts`, `capture/inPage.ts`, `capture/shoot.ts`, `capture/capture.ts`, `capture/serve.ts`
- Test: `capture/pages.test.ts`, `capture/args.test.ts`, `capture/merge.test.ts`, `capture/sections.test.ts` (rewritten)

**Interfaces:**
- Consumes: `PAGE_IDS`, `isPageId`, `sectionIds` (Task 4); `captureDir`, `CaptureResult`, `capturePage` (Task 3).
- Produces:
  - `capture/builds.ts`: `BuildName = "home-before" | "after" | "article-before" | "help-before"`, `BuildSpec = { name: BuildName; commit: string; port: number }`, `BUILDS: Record<BuildName, BuildSpec>`; work dirs are `CAPTURE_WORK_DIR/<name>`.
  - `capture/pages.ts`: `PinnedQuery = { id: string; selector: string; devices: readonly Device[] }`, `PAGE_SOURCES` (per page and version: `build`, `path`, `anchors`, `pinned`), `HOME_TOKEN_SELECTORS: Record<Version, TokenSelectors>`, `anchorList(page: PageId, version: Version): [SectionId, SectionAnchor][]`, `buildsFor(pages: readonly PageId[]): BuildName[]`.
  - `capture/sections.ts`: `SectionAnchor` (adds `{ kind: "element"; selector: string; text?: string }` and `{ kind: "absent" }`), `FoundSection = { id: string; top: number | null }`, `resolveSections(page: PageId, found: readonly FoundSection[], pageHeight: number): SectionTop[]`.
  - `capture/args.ts`: `CaptureArgs = { pages: PageId[]; skipLoops: boolean }`, `parseCaptureArgs(argv: readonly string[]): CaptureArgs`.
  - `capture/merge.ts`: `HomeExtras = Omit<CapturesFile, "captures">`, `mergeCaptures(existing: CapturesFile | null, fresh: readonly Capture[], extras: HomeExtras | null): CapturesFile`.
  - `capture/css.ts`: `HIDDEN_SELECTORS`, `CAPTURE_CSS`, `isolateCss(selector: string): string`.
  - `PageJob` gains `anchors: [SectionId, SectionAnchor][]` and `tokens: TokenSelectors | null`; `CaptureResult` becomes `{ capture: Capture; tokens: MeasuredTokens | null }`.

- [ ] **Step 1: Write the failing tests**

Replace `capture/sections.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { resolveSections } from "./sections";

const VALID = [
  { id: "hero", top: 0 },
  { id: "proof", top: 804 },
  { id: "how", top: 2100 },
  { id: "faq-about", top: 3300 },
  { id: "areas", top: 5200 },
  { id: "footer", top: 5800 },
];

describe("resolveSections", () => {
  it("passes a page's groups in order", () => {
    expect(resolveSections("home", VALID, 6400)).toEqual(VALID);
  });

  it("rejects groups out of order", () => {
    const swapped = [VALID[0], VALID[2], VALID[1], ...VALID.slice(3)];
    expect(() => resolveSections("home", swapped, 6400)).toThrow(
      "Sections came back as hero,how,proof",
    );
  });

  it("rejects a group that does not start below the one before", () => {
    const flat = VALID.map((section, index) => (index === 2 ? { ...section, top: 804 } : section));
    expect(() => resolveSections("home", flat, 6400)).toThrow(
      "how starts at 804px, not below proof at 804px",
    );
  });

  it("gives an absent group the next group's top", () => {
    const found = [
      { id: "title", top: 0 },
      { id: "guide", top: 310 },
      { id: "questions", top: null },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ];
    expect(resolveSections("article", found, 2100)).toEqual([
      { id: "title", top: 0 },
      { id: "guide", top: 310 },
      { id: "questions", top: 1450 },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ]);
  });

  it("still rejects a group that starts above an absent one", () => {
    const found = [
      { id: "title", top: 0 },
      { id: "guide", top: 1500 },
      { id: "questions", top: null },
      { id: "next", top: 1450 },
      { id: "footer", top: 1600 },
    ];
    expect(() => resolveSections("article", found, 2100)).toThrow(
      "questions starts at 1450px, not below guide at 1500px",
    );
  });
});
```

Create `capture/args.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseCaptureArgs } from "./args";

describe("parseCaptureArgs", () => {
  it("captures every page with loops by default", () => {
    expect(parseCaptureArgs([])).toEqual({ pages: ["home", "article", "help"], skipLoops: false });
  });

  it("captures only the pages asked for, in page order", () => {
    expect(parseCaptureArgs(["--page", "help", "--page=article"]).pages).toEqual([
      "article",
      "help",
    ]);
  });

  it("skips the loops when asked", () => {
    expect(parseCaptureArgs(["--skip-loops"]).skipLoops).toBe(true);
  });

  it("rejects a page it does not know, or none", () => {
    expect(() => parseCaptureArgs(["--page", "faq"])).toThrow(
      "--page takes home, article, help, not faq",
    );
    expect(() => parseCaptureArgs(["--page"])).toThrow(
      "--page takes home, article, help, not nothing",
    );
  });

  it("rejects an argument it does not know", () => {
    expect(() => parseCaptureArgs(["--loops"])).toThrow("Unknown argument --loops");
  });
});
```

Create `capture/merge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PAGE_IDS } from "../src/data/pages";
import type {
  Capture,
  CapturesFile,
  Device,
  MeasuredTokens,
  PageId,
  Version,
} from "../src/data/types";
import { type HomeExtras, mergeCaptures } from "./merge";

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

function fake(page: PageId, version: Version, device: Device, commit: string): Capture {
  return {
    page,
    version,
    device,
    commit,
    capturedAt: "2026-10-01T12:00:00.000Z",
    viewport: { width: 1440, height: 900 },
    scale: 2,
    pageHeight: 3000,
    tiles: [],
    sections: [],
    pinned: [],
    loops: [],
  };
}

function pageCaptures(page: PageId, commit: string): Capture[] {
  return VERSIONS.flatMap((version) => DEVICES.map((device) => fake(page, version, device, commit)));
}

const TOKENS: MeasuredTokens = {
  headline: {
    fontFamily: "Frutiger",
    fontSize: "48px",
    lineHeight: "56px",
    letterSpacing: "normal",
    fontWeight: "700",
  },
  heroGround: "rgb(0, 94, 184)",
  search: { borderRadius: "4px", boxShadow: "none" },
  card: { borderRadius: "4px", boxShadow: "none" },
};

function extras(radius: string): HomeExtras {
  return {
    tokens: { before: TOKENS, after: TOKENS },
    palettes: { before: [], after: [] },
    radiusScale: [radius],
    specimens: { frutiger: "captures/specimen-frutiger.png" },
  };
}

const EXISTING: CapturesFile = {
  captures: PAGE_IDS.flatMap((page) => pageCaptures(page, "old")),
  ...extras("4px"),
};

describe("mergeCaptures", () => {
  it("replaces one page's captures and leaves every other entry as it was", () => {
    const merged = mergeCaptures(EXISTING, pageCaptures("article", "new"), null);
    expect(merged.captures.map((capture) => `${capture.page}:${capture.commit}`)).toEqual([
      ...Array.from({ length: 4 }, () => "home:old"),
      ...Array.from({ length: 4 }, () => "article:new"),
      ...Array.from({ length: 4 }, () => "help:old"),
    ]);
    const untouched = (file: CapturesFile) =>
      JSON.stringify(file.captures.filter((capture) => capture.page !== "article"));
    expect(untouched(merged)).toBe(untouched(EXISTING));
  });

  it("orders captures by page, then version, then device", () => {
    const merged = mergeCaptures(EXISTING, pageCaptures("help", "new").reverse(), null);
    expect(merged.captures.slice(8).map((capture) => `${capture.version} ${capture.device}`)).toEqual(
      ["before desktop", "before mobile", "after desktop", "after mobile"],
    );
  });

  it("keeps the homepage extras unless the homepage was captured", () => {
    expect(mergeCaptures(EXISTING, pageCaptures("help", "new"), null).radiusScale).toEqual(["4px"]);
    expect(
      mergeCaptures(EXISTING, pageCaptures("home", "new"), extras("8px")).radiusScale,
    ).toEqual(["8px"]);
  });

  it("refuses to write a file that is missing a page", () => {
    expect(() => mergeCaptures(null, pageCaptures("article", "new"), null)).toThrow(
      "captures.json would have 0 home before desktop captures",
    );
  });

  it("refuses a first file without the homepage extras", () => {
    const everything = PAGE_IDS.flatMap((page) => pageCaptures(page, "new"));
    expect(() => mergeCaptures(null, everything, null)).toThrow(
      "The homepage's tokens and palettes come from a homepage capture",
    );
  });

  it("writes the file's fields in a fixed order", () => {
    expect(Object.keys(mergeCaptures(EXISTING, pageCaptures("help", "new"), null))).toEqual([
      "captures",
      "tokens",
      "palettes",
      "radiusScale",
      "specimens",
    ]);
  });
});
```

Create `capture/pages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PAGE_IDS, sectionIds } from "../src/data/pages";
import type { PageId, Version } from "../src/data/types";
import { anchorList, buildsFor, PAGE_SOURCES } from "./pages";

const VERSIONS: readonly Version[] = ["before", "after"];

function pinnedIds(page: PageId, version: Version): string[] {
  return PAGE_SOURCES[page][version].pinned.map((query) => query.id);
}

describe("PAGE_SOURCES", () => {
  it("anchors every group of every page on both versions", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        expect(anchorList(page, version).map(([id]) => id)).toEqual(sectionIds(page));
      }
    }
  });

  it("starts every page at its top and ends it on the footer after main", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        const kinds = anchorList(page, version).map(([, anchor]) => anchor.kind);
        expect(kinds.at(0)).toBe("page-top");
        expect(kinds.at(-1)).toBe("footer-after-main");
      }
    }
  });

  it("leaves only the old how-to page without common questions", () => {
    const absent = PAGE_IDS.flatMap((page) =>
      VERSIONS.flatMap((version) =>
        anchorList(page, version)
          .filter(([, anchor]) => anchor.kind === "absent")
          .map(([id]) => `${page} ${version} ${id}`),
      ),
    );
    expect(absent).toEqual(["article before questions"]);
  });

  it("pins the new pages' sticky parts and none of the old pages'", () => {
    expect(PAGE_IDS.map((page) => pinnedIds(page, "before"))).toEqual([[], [], []]);
    expect(pinnedIds("home", "after")).toEqual(["header"]);
    expect(pinnedIds("article", "after")).toEqual(["header", "breadcrumbs", "contents"]);
    expect(pinnedIds("help", "after")).toEqual(["header", "breadcrumbs"]);
  });
});

describe("buildsFor", () => {
  it("builds only what the chosen pages need", () => {
    expect(buildsFor(["home"])).toEqual(["home-before", "after"]);
    expect(buildsFor(["article", "help"])).toEqual(["article-before", "after", "help-before"]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run capture`
Expected: FAIL: `./args`, `./merge` and `./pages` cannot be resolved, and `resolveSections` is not exported.

- [ ] **Step 3: Move the capture CSS into its own module**

Create `capture/css.ts`:

```ts
export const HIDDEN_SELECTORS = [".phone-help-bubble", ".cookie-banner-ssr"];

export const CAPTURE_CSS = [
  `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
  "[data-capture-hidden] { visibility: hidden !important; }",
  "* { caret-color: transparent !important; }",
].join("\n");

export function isolateCss(selector: string): string {
  return [
    "html, body { background: transparent !important; }",
    "body * { visibility: hidden !important; }",
    `${selector}, ${selector} * { visibility: visible !important; }`,
  ].join("\n");
}
```

- [ ] **Step 4: Resolve sections for any page**

Replace `capture/sections.ts` with:

```ts
import { sectionIds } from "../src/data/pages";
import type { PageId, SectionTop } from "../src/data/types";

export type SectionAnchor =
  | { kind: "page-top" }
  | { kind: "main-child"; index: number }
  | { kind: "main-child-with-heading"; text: string }
  | { kind: "element"; selector: string; text?: string }
  | { kind: "absent" }
  | { kind: "footer-after-main" };

export type FoundSection = { id: string; top: number | null };

export function resolveSections(
  page: PageId,
  found: readonly FoundSection[],
  pageHeight: number,
): SectionTop[] {
  const ids = sectionIds(page);
  const foundIds = found.map((section) => section.id).join(",");
  if (foundIds !== ids.join(",")) throw new Error(`Sections came back as ${foundIds}`);
  const tops: number[] = [];
  for (let index = found.length - 1; index >= 0; index--) {
    tops[index] = found[index].top ?? tops[index + 1] ?? pageHeight;
  }
  for (let index = 1; index < found.length; index++) {
    const sharesAbsentTop = found[index - 1].top === null && tops[index] === tops[index - 1];
    if (tops[index] <= tops[index - 1] && !sharesAbsentTop) {
      throw new Error(
        `${ids[index]} starts at ${tops[index]}px, not below ${ids[index - 1]} at ${tops[index - 1]}px`,
      );
    }
  }
  return ids.map((id, index) => ({ id, top: tops[index] }));
}
```

- [ ] **Step 5: Parse the capture arguments**

Create `capture/args.ts`:

```ts
import { isPageId, PAGE_IDS } from "../src/data/pages";
import type { PageId } from "../src/data/types";

export type CaptureArgs = { pages: PageId[]; skipLoops: boolean };

export function parseCaptureArgs(argv: readonly string[]): CaptureArgs {
  const chosen = new Set<PageId>();
  let skipLoops = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--skip-loops") {
      skipLoops = true;
    } else if (arg === "--page" || arg.startsWith("--page=")) {
      const value: string | undefined =
        arg === "--page" ? argv[++index] : arg.slice("--page=".length);
      if (value === undefined || !isPageId(value)) {
        throw new Error(`--page takes ${PAGE_IDS.join(", ")}, not ${value ?? "nothing"}`);
      }
      chosen.add(value);
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return { pages: PAGE_IDS.filter((page) => chosen.size === 0 || chosen.has(page)), skipLoops };
}
```

- [ ] **Step 6: Merge captures into the data file**

Create `capture/merge.ts`:

```ts
import { PAGE_IDS } from "../src/data/pages";
import type { Capture, CapturesFile, Device, Version } from "../src/data/types";

export type HomeExtras = Omit<CapturesFile, "captures">;

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

export function mergeCaptures(
  existing: CapturesFile | null,
  fresh: readonly Capture[],
  extras: HomeExtras | null,
): CapturesFile {
  const replaced = new Set(fresh.map((capture) => capture.page));
  const pool = [
    ...(existing?.captures ?? []).filter((capture) => !replaced.has(capture.page)),
    ...fresh,
  ];
  const captures: Capture[] = [];
  for (const page of PAGE_IDS) {
    for (const version of VERSIONS) {
      for (const device of DEVICES) {
        const matches = pool.filter(
          (capture) =>
            capture.page === page && capture.version === version && capture.device === device,
        );
        if (matches.length !== 1) {
          throw new Error(
            `captures.json would have ${matches.length} ${page} ${version} ${device} captures; capture ${page} as well`,
          );
        }
        captures.push(matches[0]);
      }
    }
  }
  const kept: HomeExtras | null = existing
    ? {
        tokens: existing.tokens,
        palettes: existing.palettes,
        radiusScale: existing.radiusScale,
        specimens: existing.specimens,
      }
    : null;
  const rest = extras ?? kept;
  if (!rest) {
    throw new Error(
      "The homepage's tokens and palettes come from a homepage capture; capture home as well",
    );
  }
  return {
    captures,
    tokens: rest.tokens,
    palettes: rest.palettes,
    radiusScale: rest.radiusScale,
    specimens: rest.specimens,
  };
}
```

- [ ] **Step 7: Name the builds**

In `capture/builds.ts`:
- delete `import type { Version } from "../src/data/types";`;
- replace `BuildSpec` and `BUILDS` with:

```ts
export type BuildName = "home-before" | "after" | "article-before" | "help-before";
export type BuildSpec = { name: BuildName; commit: string; port: number };
```

```ts
// The two older commits are the last before their pages were replaced: 1e021d8370 swapped the
// how-to pages for the guide pages, and 38facb0a65 swapped /faq for /help.
export const BUILDS: Record<BuildName, BuildSpec> = {
  "home-before": { name: "home-before", commit: "0a143c6820", port: 3061 },
  after: { name: "after", commit: "c016453be7", port: 3062 },
  "article-before": { name: "article-before", commit: "1e021d8370^", port: 3063 },
  "help-before": { name: "help-before", commit: "38facb0a65^", port: 3064 },
};
```

- in `prepareBuild`, use `spec.name` for the directory and the log line: `const dir = join(WORK_DIR, spec.name);` and `` console.log(`Reusing the ${spec.name} build at ${dir}`); ``. (`git rev-parse 1e021d8370^^{commit}` resolves to `b750cbef25`, so `^` commits need no other change.)

- [ ] **Step 8: Write the page list**

Create `capture/pages.ts`:

```ts
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

export const PAGE_SOURCES: { [P in PageId]: PageSource<P> } = {
  home: {
    before: {
      build: "home-before",
      path: "/",
      anchors: {
        hero: { kind: "page-top" },
        proof: { kind: "main-child", index: 2 },
        how: { kind: "main-child-with-heading", text: "How Bookable works" },
        "faq-about": { kind: "main-child-with-heading", text: "About finding an NHS GP in England" },
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
        questions: { kind: "element", selector: "main h2", text: "Getting started and registration" },
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

export function buildsFor(pages: readonly PageId[]): BuildName[] {
  const names = pages.flatMap((page) => [
    PAGE_SOURCES[page].before.build,
    PAGE_SOURCES[page].after.build,
  ]);
  return [...new Set(names)];
}
```

- [ ] **Step 9: Run the tests to see them pass**

Run: `pnpm vitest run capture`
Expected: PASS: `sections` 5, `args` 5, `merge` 6, `pages` 5, plus the existing capture tests.

- [ ] **Step 10: Find element and absent anchors in the page**

In `capture/inPage.ts`, change `sectionTopsInPage` to return `{ id: string; top: number | null }[]`, and add these two cases to its `switch`, before `default`:

```ts
      case "absent":
        return { id, top: null };
      case "element": {
        const matches = Array.from(document.querySelectorAll(anchor.selector)).filter(
          (element) => anchor.text === undefined || textOf(element) === anchor.text,
        );
        if (matches.length !== 1) {
          const wanted =
            anchor.text === undefined ? anchor.selector : `${anchor.selector} reading "${anchor.text}"`;
          throw new Error(`${id}: ${matches.length} elements match ${wanted}`);
        }
        return { id, top: pageTop(matches[0]) };
      }
```

- [ ] **Step 11: Take sections and tokens from the job**

In `capture/shoot.ts`:
- delete the local `HIDDEN_SELECTORS`, `CAPTURE_CSS`, `TOKEN_SELECTORS` and `isolateCss`, and add `import { CAPTURE_CSS, isolateCss } from "./css";`;
- replace `import { anchorList, assertSections } from "./sections";` with `import { resolveSections, type SectionAnchor } from "./sections";`, and add `SectionId` to the type import from `../src/data/types`;
- add to `PageJob`, after `profile`: `anchors: [SectionId, SectionAnchor][];` and `tokens: TokenSelectors | null;`;
- change `CaptureResult` to `{ capture: Capture; tokens: MeasuredTokens | null }`;
- in `capturePage`, replace everything from `const sections = …` down to the end of the floating-element check with:

```ts
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = resolveSections(
      job.page,
      await page.evaluate(sectionTopsInPage, job.anchors),
      pageHeight,
    );
    const tokens =
      job.tokens === null ? null : await page.evaluate(measureTokensInPage, job.tokens);
    const sticky = await page.evaluate(markStickyHeaderInPage);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements: ${floating.join(", ")}. Pin them in capture/pages.ts or hide them in capture/css.ts.`,
      );
    }
```

- and replace `const { tiles, pageHeight, full } = await captureTiles(page, outDir);` with:

```ts
    const { tiles, full, pageHeight: tiledHeight } = await captureTiles(page, outDir);
    if (tiledHeight !== pageHeight) {
      throw new Error(`The page changed from ${pageHeight}px to ${tiledHeight}px while it was shot`);
    }
```

- [ ] **Step 12: Capture any set of pages**

Replace `capture/capture.ts` with:

```ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import type { CapturesFile, Device, MeasuredTokens, Version } from "../src/data/types";
import { parseCaptureArgs } from "./args";
import { BUILDS, type BuildName, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { extractObjectLiteral, paletteGroups } from "./literal";
import { type HomeExtras, mergeCaptures } from "./merge";
import { anchorList, buildsFor, HOME_TOKEN_SELECTORS, PAGE_SOURCES } from "./pages";
import { DATA_FILE } from "./paths";
import { DEVICE_PROFILES } from "./profiles";
import { type CaptureResult, capturePage } from "./shoot";

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

function servedFor(served: ReadonlyMap<BuildName, ServedBuild>, name: BuildName): ServedBuild {
  const build = served.get(name);
  if (!build) throw new Error(`The ${name} build is not being served`);
  return build;
}

function sourceIn(build: ServedBuild, path: string): string {
  return readFileSync(join(build.dir, path), "utf8");
}

function radiusScale(source: string): string[] {
  const radii = extractObjectLiteral(source, "UI_RADII");
  if (typeof radii !== "object" || radii === null) throw new Error("UI_RADII is not an object");
  return Object.values(radii).map(String);
}

function homeTokens(results: readonly CaptureResult[], version: Version): MeasuredTokens {
  const tokens = results.find(
    ({ capture }) =>
      capture.page === "home" && capture.version === version && capture.device === "desktop",
  )?.tokens;
  if (!tokens) throw new Error(`The homepage ${version} desktop capture measured no tokens`);
  return tokens;
}

function homeExtras(
  results: readonly CaptureResult[],
  served: ReadonlyMap<BuildName, ServedBuild>,
): HomeExtras {
  const before = servedFor(served, "home-before");
  const after = servedFor(served, "after");
  return {
    tokens: { before: homeTokens(results, "before"), after: homeTokens(results, "after") },
    palettes: {
      before: paletteGroups(
        extractObjectLiteral(sourceIn(before, "packages/bookable/tailwind.config.ts"), "NHS_COLORS"),
      ),
      after: paletteGroups(
        extractObjectLiteral(
          sourceIn(after, "packages/bookable/app/_ui/tokens.colors.ts"),
          "UI_COLORS",
        ),
      ),
    },
    radiusScale: radiusScale(sourceIn(after, "packages/bookable/app/_ui/tokens.ts")),
    specimens: { frutiger: "captures/specimen-frutiger.png" },
  };
}

async function main() {
  const { pages, skipLoops } = parseCaptureArgs(process.argv.slice(2));
  const served = new Map<BuildName, ServedBuild>();
  try {
    for (const name of buildsFor(pages)) {
      served.set(name, await serveBuild(prepareBuild(BUILDS[name])));
    }
    const browser = await chromium.launch();
    const results: CaptureResult[] = [];
    try {
      for (const page of pages) {
        for (const version of VERSIONS) {
          const side = PAGE_SOURCES[page][version];
          const build = servedFor(served, side.build);
          for (const device of DEVICES) {
            console.log(`Capturing the ${page} ${version} page on ${device}`);
            results.push(
              await capturePage(browser, {
                page,
                version,
                commit: build.fullCommit,
                url: `${build.url}${side.path}`,
                profile: DEVICE_PROFILES[device],
                anchors: anchorList(page, version),
                tokens: page === "home" ? HOME_TOKEN_SELECTORS[version] : null,
                withLoops: page === "home" && version === "after" && !skipLoops,
                withSpecimen: page === "home" && version === "before" && device === "desktop",
              }),
            );
          }
        }
      }
    } finally {
      await browser.close();
    }
    const existing = existsSync(DATA_FILE)
      ? (JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile)
      : null;
    const file = mergeCaptures(
      existing,
      results.map(({ capture }) => capture),
      pages.includes("home") ? homeExtras(results, served) : null,
    );
    writeFileSync(DATA_FILE, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${DATA_FILE}`);
  } finally {
    await Promise.all([...served.values()].map((build) => build.stop()));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 13: Serve the builds a page set needs**

Replace `capture/serve.ts` with:

```ts
import { parseCaptureArgs } from "./args";
import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { buildsFor } from "./pages";

async function main() {
  const { pages } = parseCaptureArgs(process.argv.slice(2));
  const served: ServedBuild[] = [];
  const stopAll = () => Promise.all(served.map((build) => build.stop()));
  process.once("SIGINT", () => {
    void stopAll().then(() => process.exit(130));
  });
  for (const name of buildsFor(pages)) served.push(await serveBuild(prepareBuild(BUILDS[name])));
  for (const build of served) {
    console.log(`${build.name} (${build.fullCommit.slice(0, 10)}): ${build.url}`);
  }
  console.log("Serving. Press Ctrl+C to stop.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 14: Verify the code**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass. (`pnpm e2e` is unaffected; the page did not change.)

- [ ] **Step 15: Build and serve the old commits**

Run in a second terminal (it keeps running): `pnpm capture:serve --page article --page help`
Expected, after the first-time builds (several minutes each): `article-before (b750cbef25): http://localhost:3063`, `after (c016453be7): http://localhost:3062`, `help-before (b4e56b67e8): http://localhost:3064`.

If a build fails, read its error and fix it in `capture/builds.ts`, never in sanny. A missing public build-time variable goes into the `.env.local` that `prepareBuild` writes, with the value the main checkout's `packages/bookable/.env.local` uses. A secret the page never calls gets a placeholder value.

Then run:

```bash
for url in http://localhost:3063/how-to/book-doctor-appointment-nhs http://localhost:3062/book-a-gp-appointment http://localhost:3064/faq http://localhost:3062/help; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$url")" "$url"; done
```

Expected: four lines, each starting `200`. Stop the server with Ctrl+C.

- [ ] **Step 16: Commit**

```bash
git add -A capture
git commit -q -m "Let the capture build any page from four pinned commits and merge it in" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Pinned layers in the capture, then shoot the article and the help centre

**Files:**
- Create: `capture/pinnedPlan.ts`, `capture/pinned.ts`
- Modify: `capture/inPage.ts`, `capture/shoot.ts`, `capture/capture.ts`, `capture/compareLive.ts`, `src/data/captures.test.ts`
- Generated: `src/data/captures.json`, `public/captures/article/**`, `public/captures/help/**`
- Test: `capture/pinnedPlan.test.ts`

**Interfaces:**
- Consumes: `pinnedTop`, `pinnedStateIndex` (Task 2); `PinnedQuery`, `PAGE_SOURCES`, `parseCaptureArgs`, `isolateCss`, `HIDDEN_SELECTORS`, `resolveSections` (Task 5).
- Produces:
  - `capture/pinnedPlan.ts`: `PinnedBox = { x; y; width; stickTop; releaseAt; zIndex }`; `shotScroll(box: PinnedBox, froms: readonly number[], index: number, maxScroll: number): number`, the scroll at which look `index` is shot, wholly in view; `checkScrolls(layer: PinnedLayer, maxScroll: number): number[]`, the scrolls at which the model is checked against the browser.
  - `capture/pinned.ts`: `PinnedPlan = { id: string; box: PinnedBox; froms: number[] }`; `planPinned(page, queries): Promise<PinnedPlan[]>` (marks, measures and scans, sorted by stacking order); `shootPinned(page, plans, outDir): Promise<PinnedLayer[]>`; `checkPinned(page, layers): Promise<void>`.
  - `PageJob` gains `pinned: readonly PinnedQuery[]`. Layer images are written as `pinned-<id>-<index>.png`.

- [ ] **Step 1: Write the failing test**

Create `capture/pinnedPlan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { PinnedLayer } from "../src/data/types";
import { checkScrolls, type PinnedBox, shotScroll } from "./pinnedPlan";

const HEADER: PinnedBox = { x: 0, y: 0, width: 1440, stickTop: 0, releaseAt: 3772, zIndex: 50 };
const CONTENTS: PinnedBox = { x: 1100, y: 500, width: 250, stickTop: 120, releaseAt: 2400, zIndex: 0 };

function layerOf(box: PinnedBox, height: number): PinnedLayer {
  const { x, y, width, stickTop, releaseAt } = box;
  return {
    id: "layer",
    x,
    y,
    width,
    stickTop,
    releaseAt,
    states: [{ from: 0, src: "layer.png", height, blur: null }],
  };
}

describe("shotScroll", () => {
  it("shoots each header look where it starts", () => {
    expect(shotScroll(HEADER, [0, 1], 0, 2872)).toBe(0);
    expect(shotScroll(HEADER, [0, 1], 1, 2872)).toBe(1);
  });

  it("waits until a layer has stuck, so the whole of it is in view", () => {
    expect(shotScroll(CONTENTS, [0, 900, 1500], 0, 4000)).toBe(380);
    expect(shotScroll(CONTENTS, [0, 900, 1500], 1, 4000)).toBe(900);
    expect(shotScroll(CONTENTS, [0, 900, 1500], 2, 4000)).toBe(1500);
  });

  it("stays inside a look that ends before the layer sticks", () => {
    expect(shotScroll(CONTENTS, [0, 200], 0, 4000)).toBe(199);
  });

  it("never scrolls past the end of the page", () => {
    expect(shotScroll(CONTENTS, [0, 4100], 1, 4000)).toBe(4000);
  });
});

describe("checkScrolls", () => {
  it("probes either side of sticking and of letting go", () => {
    const bar = layerOf({ ...CONTENTS, y: 400, stickTop: 67, releaseAt: 3000 }, 46);
    expect(checkScrolls(bar, 4000)).toEqual([0, 332, 373, 1610, 2927, 4000]);
  });

  it("keeps every probe on the page and drops repeats", () => {
    expect(checkScrolls(layerOf(HEADER, 67), 2872)).toEqual([0, 40, 1853, 2872]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run capture/pinnedPlan.test.ts`
Expected: FAIL, `Failed to resolve import "./pinnedPlan"`.

- [ ] **Step 3: Implement the pure helpers**

Create `capture/pinnedPlan.ts`:

```ts
import type { PinnedLayer } from "../src/data/types";

export type PinnedBox = {
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  zIndex: number;
};

export function shotScroll(
  box: PinnedBox,
  froms: readonly number[],
  index: number,
  maxScroll: number,
): number {
  const until = (froms[index + 1] ?? maxScroll + 1) - 1;
  const stuck = Math.ceil(box.y - box.stickTop);
  return Math.min(Math.max(froms[index], stuck), until, maxScroll);
}

export function checkScrolls(layer: PinnedLayer, maxScroll: number): number[] {
  const height = layer.states[0].height;
  const sticksAt = Math.max(0, layer.y - layer.stickTop);
  const releasesAt = layer.releaseAt - height - layer.stickTop;
  const probes = [0, sticksAt - 1, sticksAt + 40, (sticksAt + releasesAt) / 2, releasesAt + 40, maxScroll];
  const onPage = probes.map((value) => Math.round(Math.min(Math.max(value, 0), maxScroll)));
  return [...new Set(onPage)].sort((a, b) => a - b);
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `pnpm vitest run capture/pinnedPlan.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Add the in-page helpers**

In `capture/inPage.ts`:
- delete `markStickyHeaderInPage`, `headerPaintAtInPage` and `headerBlurInPage`;
- change the first import to `import type { MeasuredTokens, Rect } from "../src/data/types";` and add `import type { PinnedBox } from "./pinnedPlan";`;
- add these functions. Each one runs inside the page, so each carries its own settle code:

```ts
export function markPinnedInPage(queries: { id: string; selector: string }[]): void {
  for (const query of queries) {
    const matches = document.querySelectorAll(query.selector);
    if (matches.length !== 1) {
      throw new Error(`Pinned ${query.id}: ${matches.length} elements match ${query.selector}`);
    }
    const position = getComputedStyle(matches[0]).position;
    if (position !== "sticky") {
      throw new Error(`Pinned ${query.id} is position: ${position}, not sticky`);
    }
    matches[0].setAttribute("data-capture-pinned", query.id);
  }
}

export function hidePinnedInPage(): void {
  for (const element of document.querySelectorAll("[data-capture-pinned]")) {
    element.setAttribute("data-capture-hidden", "");
  }
}

export async function measurePinnedInPage(id: string): Promise<PinnedBox> {
  const element = document.querySelector<HTMLElement>(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  const frames = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const round = (value: number) => Math.round(value * 100) / 100;
  window.scrollTo({ top: 0, behavior: "instant" });
  await frames();
  const style = getComputedStyle(element);
  const stickTop = Number.parseFloat(style.top) || 0;
  const zIndex = Number.parseInt(style.zIndex, 10) || 0;
  const inline = element.getAttribute("style");
  element.style.setProperty("position", "static", "important");
  const natural = element.getBoundingClientRect();
  if (inline === null) element.removeAttribute("style");
  else element.setAttribute("style", inline);
  const pageHeight = document.documentElement.scrollHeight;
  const maxScroll = pageHeight - window.innerHeight;
  window.scrollTo({ top: maxScroll, behavior: "instant" });
  await frames();
  const end = element.getBoundingClientRect();
  const endTop = end.top + window.scrollY;
  window.scrollTo({ top: 0, behavior: "instant" });
  await frames();
  const stuckToTheEnd = endTop >= maxScroll + stickTop - 0.5;
  return {
    x: round(natural.left),
    y: round(natural.top),
    width: round(natural.width),
    stickTop,
    releaseAt: round(
      stuckToTheEnd ? Math.max(pageHeight, maxScroll + stickTop + end.height) : endTop + end.height,
    ),
    zIndex,
  };
}

export async function pinnedSignaturesInPage({
  ids,
  top,
}: {
  ids: string[];
  top: number;
}): Promise<string[]> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 60));
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  return ids.map((id) => {
    const element = document.querySelector(`[data-capture-pinned="${id}"]`);
    if (!element) throw new Error(`Pinned ${id} is not marked`);
    const style = getComputedStyle(element);
    return [
      element.outerHTML,
      style.backgroundColor,
      style.borderBottomColor,
      style.boxShadow,
      style.backdropFilter,
    ].join("|");
  });
}

export async function pinnedShotInPage({
  id,
  top,
}: {
  id: string;
  top: number;
}): Promise<{ rect: Rect; blur: number | null }> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 60));
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  const element = document.querySelector(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  const box = element.getBoundingClientRect();
  if (box.top < 0 || box.left < 0 || box.bottom > window.innerHeight || box.right > window.innerWidth) {
    throw new Error(`Pinned ${id} is not wholly in view at scroll ${top}`);
  }
  const blur = /blur\(([\d.]+)px\)/.exec(getComputedStyle(element).backdropFilter);
  return {
    rect: { x: box.left, y: box.top, width: box.width, height: box.height },
    blur: blur ? Number(blur[1]) : null,
  };
}

export async function pinnedTopAtInPage({ id, top }: { id: string; top: number }): Promise<number> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const element = document.querySelector(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  return element.getBoundingClientRect().top + window.scrollY;
}
```

- [ ] **Step 6: Scan, shoot and check the layers**

Create `capture/pinned.ts`:

```ts
import { join } from "node:path";
import type { Page } from "@playwright/test";
import type { PinnedLayer, PinnedState } from "../src/data/types";
import { pinnedTop } from "../src/lib/pinned";
import { isolateCss } from "./css";
import {
  markPinnedInPage,
  measurePinnedInPage,
  pinnedShotInPage,
  pinnedSignaturesInPage,
  pinnedTopAtInPage,
  scrollInPage,
} from "./inPage";
import type { PinnedQuery } from "./pages";
import { publicPath } from "./paths";
import { checkScrolls, type PinnedBox, shotScroll } from "./pinnedPlan";

const SCAN_STEP = 24;
const TOLERANCE = 1;

export type PinnedPlan = { id: string; box: PinnedBox; froms: number[] };

function maxScrollOf(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
}

export async function planPinned(page: Page, queries: readonly PinnedQuery[]): Promise<PinnedPlan[]> {
  if (queries.length === 0) return [];
  const ids = queries.map((query) => query.id);
  await page.evaluate(
    markPinnedInPage,
    queries.map(({ id, selector }) => ({ id, selector })),
  );
  const boxes: PinnedBox[] = [];
  for (const id of ids) boxes.push(await page.evaluate(measurePinnedInPage, id));
  const maxScroll = await maxScrollOf(page);
  const signaturesAt = (top: number) => page.evaluate(pinnedSignaturesInPage, { ids, top });
  const froms = ids.map(() => [0]);
  let previous = await signaturesAt(0);
  let low = 0;
  while (low < maxScroll) {
    const high = Math.min(low + SCAN_STEP, maxScroll);
    const current = await signaturesAt(high);
    for (const [index, signature] of current.entries()) {
      if (signature === previous[index]) continue;
      let same = low;
      let changed = high;
      while (changed - same > 1) {
        const middle = Math.floor((same + changed) / 2);
        if ((await signaturesAt(middle))[index] === previous[index]) same = middle;
        else changed = middle;
      }
      froms[index].push(changed);
    }
    previous = current;
    low = high;
  }
  await page.evaluate(scrollInPage, 0);
  return ids
    .map((id, index) => ({ id, box: boxes[index], froms: froms[index] }))
    .sort((a, b) => a.box.zIndex - b.box.zIndex);
}

export async function shootPinned(
  page: Page,
  plans: readonly PinnedPlan[],
  outDir: string,
): Promise<PinnedLayer[]> {
  const maxScroll = await maxScrollOf(page);
  const layers: PinnedLayer[] = [];
  for (const plan of plans) {
    const selector = `[data-capture-pinned="${plan.id}"]`;
    await page.evaluate(
      (target) => document.querySelector(target)?.removeAttribute("data-capture-hidden"),
      selector,
    );
    const isolation = await page.addStyleTag({ content: isolateCss(selector) });
    const states: PinnedState[] = [];
    for (const [index, from] of plan.froms.entries()) {
      const top = shotScroll(plan.box, plan.froms, index, maxScroll);
      const shot = await page.evaluate(pinnedShotInPage, { id: plan.id, top });
      const path = join(outDir, `pinned-${plan.id}-${index}.png`);
      await page.screenshot({ path, clip: shot.rect, omitBackground: true, caret: "hide" });
      states.push({
        from,
        src: publicPath(path),
        height: Math.round(shot.rect.height * 100) / 100,
        blur: shot.blur,
      });
    }
    await isolation.evaluate((node) => {
      node.parentNode?.removeChild(node);
    });
    await page.evaluate(
      (target) => document.querySelector(target)?.setAttribute("data-capture-hidden", ""),
      selector,
    );
    const { x, y, width, stickTop, releaseAt } = plan.box;
    layers.push({ id: plan.id, x, y, width, stickTop, releaseAt, states });
  }
  await page.evaluate(scrollInPage, 0);
  return layers;
}

export async function checkPinned(page: Page, layers: readonly PinnedLayer[]): Promise<void> {
  const maxScroll = await maxScrollOf(page);
  for (const layer of layers) {
    for (const scroll of checkScrolls(layer, maxScroll)) {
      const actual = await page.evaluate(pinnedTopAtInPage, { id: layer.id, top: scroll });
      const expected = pinnedTop(layer, scroll);
      if (Math.abs(actual - expected) > TOLERANCE) {
        throw new Error(
          `Pinned ${layer.id} sits at ${actual.toFixed(1)}px at scroll ${scroll}, but the model puts it at ${expected.toFixed(1)}px`,
        );
      }
    }
  }
  await page.evaluate(scrollInPage, 0);
}
```

- [ ] **Step 7: Use pinned layers in the page capture**

Replace `capture/shoot.ts` with:

```ts
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import sharp, { type OverlayOptions } from "sharp";
import type { Capture, MeasuredTokens, PageId, SectionId, Tile, Version } from "../src/data/types";
import { CAPTURE_CSS, isolateCss } from "./css";
import {
  addSpecimenInPage,
  floatingElementsInPage,
  hidePinnedInPage,
  measureTokensInPage,
  pauseInfiniteAnimationsInPage,
  scrollInPage,
  sectionTopsInPage,
  settleInPage,
  type TokenSelectors,
} from "./inPage";
import { captureLoops } from "./loops";
import type { PinnedQuery } from "./pages";
import { captureDir, PUBLIC_DIR, publicPath } from "./paths";
import { checkPinned, planPinned, shootPinned } from "./pinned";
import { type DeviceProfile, SCALE, SOCS_REJECTED, TILE_HEIGHT } from "./profiles";
import { resolveSections, type SectionAnchor } from "./sections";
import { tileBands, viewportStops } from "./stitch";

export type RawImage = {
  data: Buffer;
  info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
};

export type PageJob = {
  page: PageId;
  version: Version;
  commit: string;
  url: string;
  profile: DeviceProfile;
  anchors: [SectionId, SectionAnchor][];
  pinned: readonly PinnedQuery[];
  tokens: TokenSelectors | null;
  withLoops: boolean;
  withSpecimen: boolean;
};

export type CaptureResult = { capture: Capture; tokens: MeasuredTokens | null };

async function openPage(
  browser: Browser,
  url: string,
  profile: DeviceProfile,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: SCALE,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    userAgent: profile.userAgent,
    locale: "en-GB",
    timezoneId: "Europe/London",
    reducedMotion: "no-preference",
  });
  // tsx compiles with esbuild's keepNames, which wraps functions in __name(); functions sent to
  // page.evaluate carry those calls, so the page needs the helper defined.
  await context.addInitScript({ content: "globalThis.__name = (target) => target;" });
  await context.addInitScript({
    content: `localStorage.setItem("SOCS", ${JSON.stringify(SOCS_REJECTED)}); localStorage.removeItem("wglang");`,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CAPTURE_CSS });
  return { context, page };
}

async function captureTiles(
  page: Page,
  outDir: string,
): Promise<{ tiles: Tile[]; pageHeight: number; full: RawImage }> {
  const { pageHeight, viewportHeight, width } = await page.evaluate(() => ({
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    width: document.documentElement.clientWidth,
  }));
  const composites: OverlayOptions[] = [];
  for (const stop of viewportStops(pageHeight, viewportHeight)) {
    await page.evaluate(scrollInPage, stop.scrollY);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements at scroll ${stop.scrollY}px: ${floating.join(", ")}. Pin them in capture/pages.ts or hide them in capture/css.ts.`,
      );
    }
    const input = await page.screenshot({
      clip: { x: 0, y: stop.sliceTop, width, height: stop.sliceHeight },
      caret: "hide",
    });
    composites.push({ input, top: stop.pageTop * SCALE, left: 0 });
  }
  const { data, info } = await sharp({
    create: {
      width: width * SCALE,
      height: pageHeight * SCALE,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite(composites)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const full: RawImage = {
    data,
    info: { width: info.width, height: info.height, channels: info.channels },
  };

  const tiles: Tile[] = [];
  for (const [index, band] of tileBands(pageHeight, TILE_HEIGHT).entries()) {
    const name = `tile-${String(index).padStart(2, "0")}`;
    const region = sharp(full.data, { raw: full.info }).extract({
      left: 0,
      top: band.top * SCALE,
      width: width * SCALE,
      height: band.height * SCALE,
    });
    const avif = join(outDir, `${name}.avif`);
    const webp = join(outDir, `${name}.webp`);
    await region.clone().avif({ quality: 62, effort: 6 }).toFile(avif);
    await region.clone().webp({ quality: 86, effort: 6 }).toFile(webp);
    tiles.push({
      avif: publicPath(avif),
      webp: publicPath(webp),
      top: band.top,
      height: band.height,
    });
  }
  return { tiles, pageHeight, full };
}

async function captureSpecimen(page: Page): Promise<void> {
  await page.evaluate(addSpecimenInPage);
  const isolation = await page.addStyleTag({ content: isolateCss("#capture-specimen") });
  await page.locator("#capture-specimen").screenshot({
    path: join(PUBLIC_DIR, "captures/specimen-frutiger.png"),
    omitBackground: true,
  });
  await isolation.evaluate((node) => {
    node.parentNode?.removeChild(node);
  });
}

export async function capturePage(browser: Browser, job: PageJob): Promise<CaptureResult> {
  const { context, page } = await openPage(browser, job.url, job.profile);
  try {
    await page.evaluate(settleInPage);
    await page.evaluate(pauseInfiniteAnimationsInPage);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = resolveSections(
      job.page,
      await page.evaluate(sectionTopsInPage, job.anchors),
      pageHeight,
    );
    const tokens =
      job.tokens === null ? null : await page.evaluate(measureTokensInPage, job.tokens);
    const plans = await planPinned(page, job.pinned);
    await page.evaluate(hidePinnedInPage);
    const outDir = captureDir(job.page, job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const { tiles, full, pageHeight: tiledHeight } = await captureTiles(page, outDir);
    if (tiledHeight !== pageHeight) {
      throw new Error(`The page changed from ${pageHeight}px to ${tiledHeight}px while it was shot`);
    }
    const loops = job.withLoops ? await captureLoops(page, job.profile.device, outDir, full) : [];
    const pinned = await shootPinned(page, plans, outDir);
    await checkPinned(page, pinned);
    if (job.withSpecimen) await captureSpecimen(page);
    return {
      capture: {
        page: job.page,
        version: job.version,
        device: job.profile.device,
        commit: job.commit,
        capturedAt: new Date().toISOString(),
        viewport: job.profile.viewport,
        scale: SCALE,
        pageHeight,
        tiles,
        sections,
        pinned,
        loops,
      },
      tokens,
    };
  } finally {
    await context.close();
  }
}
```

In `capture/capture.ts`, add to the job passed to `capturePage`, after `anchors`:

```ts
                pinned: side.pinned.filter((query) => query.devices.includes(device)),
```

- [ ] **Step 8: Compare any page with the live site**

Replace `capture/compareLive.ts` with:

```ts
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { PAGES } from "../src/data/pages";
import type { CapturesFile, PageId } from "../src/data/types";
import { pinnedStateIndex, pinnedTop } from "../src/lib/pinned";
import { parseCaptureArgs } from "./args";
import { HIDDEN_SELECTORS } from "./css";
import { DATA_FILE, PUBLIC_DIR, ROOT } from "./paths";
import { SCALE, SOCS_REJECTED } from "./profiles";

const LIVE_URL = "https://bookable.health";
const GAP = 40;

async function capturedTop(
  file: CapturesFile,
  page: PageId,
): Promise<{ image: Buffer; width: number; height: number }> {
  const after = file.captures.find(
    (capture) =>
      capture.page === page && capture.version === "after" && capture.device === "desktop",
  );
  if (!after) throw new Error(`There is no ${page} after capture for desktop`);
  const { width, height } = after.viewport;
  const layers = after.pinned.map((layer) => ({
    input: join(PUBLIC_DIR, layer.states[pinnedStateIndex(layer, 0)].src),
    left: Math.round(layer.x * SCALE),
    top: Math.round(pinnedTop(layer, 0) * SCALE),
  }));
  const tile = await sharp(join(PUBLIC_DIR, after.tiles[0].webp)).composite(layers).png().toBuffer();
  const image = await sharp(tile)
    .extract({ left: 0, top: 0, width: width * SCALE, height: height * SCALE })
    .png()
    .toBuffer();
  return { image, width, height };
}

async function liveTop(page: PageId, width: number, height: number): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: SCALE,
      locale: "en-GB",
    });
    await context.addInitScript({
      content: `localStorage.setItem("SOCS", ${JSON.stringify(SOCS_REJECTED)});`,
    });
    const tab = await context.newPage();
    await tab.goto(`${LIVE_URL}${PAGES[page].route.after}`, { waitUntil: "networkidle" });
    await tab.addStyleTag({ content: `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }` });
    await tab.waitForTimeout(1500);
    return await tab.screenshot();
  } finally {
    await browser.close();
  }
}

async function main() {
  const { pages } = parseCaptureArgs(process.argv.slice(2));
  const file = JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile;
  const out = join(ROOT, ".capture");
  mkdirSync(out, { recursive: true });
  for (const page of pages) {
    const captured = await capturedTop(file, page);
    const live = await liveTop(page, captured.width, captured.height);
    const target = join(out, `live-vs-capture-${page}.png`);
    await sharp({
      create: {
        width: captured.width * SCALE * 2 + GAP,
        height: captured.height * SCALE,
        channels: 4,
        background: "#061528",
      },
    })
      .composite([
        { input: live, left: 0, top: 0 },
        { input: captured.image, left: captured.width * SCALE + GAP, top: 0 },
      ])
      .png()
      .toFile(target);
    console.log(`Wrote ${target}: the live ${page} page on the left, the capture on the right`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 9: Verify the code**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass.

- [ ] **Step 10: Shoot the article and the help centre**

Run: `pnpm capture --page article --page help`
Expected: eight `Capturing the … page on …` lines, then `Wrote …/src/data/captures.json`. `git status --short` shows new files under `public/captures/article/` and `public/captures/help/`, and a modified `captures.json`. No file under `public/captures/home/` appears.

If the capture stops, it says why. Fix the cause in the capture scripts, never in sanny, then run it again.
- **Unexpected fixed or sticky element:** pin it in `capture/pages.ts` if the page uses it as chrome. If it is an overlay such as a cookie banner, modal or help bubble, add its selector to `HIDDEN_SELECTORS` in `capture/css.ts`.
- **An anchor matches 0 or 2 or more elements:** serve the build (`pnpm capture:serve --page <id>`) and read the page's markup. Then make the selector or text in `capture/pages.ts` match exactly one element.
- **A pinned layer sits away from the model:** the measured box is wrong. Print the `PinnedBox` from `measurePinnedInPage` for that layer, and compare it with the element's real offsets in the served page.

- [ ] **Step 11: Pin the data's shape in tests**

In `src/data/captures.test.ts`, change the pages import to `import { PAGE_IDS, sectionIds } from "./pages";` and add:

```ts
  it("holds before and after, desktop and mobile, for every page", () => {
    for (const page of PAGE_IDS) {
      for (const version of ["before", "after"] as const) {
        for (const device of ["desktop", "mobile"] as const) {
          const matches = CAPTURES.captures.filter(
            (capture) =>
              capture.page === page && capture.version === version && capture.device === device,
          );
          expect(matches.length, `${page} ${version} ${device}`).toBe(1);
        }
      }
    }
  });

  it("starts every pinned layer's first look at the top and the rest in order", () => {
    for (const capture of CAPTURES.captures) {
      for (const layer of capture.pinned) {
        const froms = layer.states.map((state) => state.from);
        expect(froms[0]).toBe(0);
        expect(froms).toEqual([...froms].sort((a, b) => a - b));
      }
    }
  });
```

Run: `pnpm vitest run src/data`
Expected: PASS, including "points only at files that exist" for the new assets.

- [ ] **Step 12: Look at what was shot**

Write a contact sheet of every new capture, with a red line at each group's top:

```bash
node --input-type=module -e '
import { mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
const file = JSON.parse(readFileSync("src/data/captures.json", "utf8"));
mkdirSync(".capture/sheets", { recursive: true });
for (const capture of file.captures.filter((entry) => entry.page !== "home")) {
  const width = capture.viewport.width * capture.scale;
  const height = capture.pageHeight * capture.scale;
  const tiles = capture.tiles.map((tile) => ({ input: `public/${tile.webp}`, top: tile.top * capture.scale, left: 0 }));
  const line = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="6"><rect width="${width}" height="6" fill="#ff2d55"/></svg>`);
  const lines = capture.sections.map((section) => ({ input: line, top: Math.min(height - 6, section.top * capture.scale), left: 0 }));
  const full = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } }).composite([...tiles, ...lines]).png().toBuffer();
  const out = `.capture/sheets/${capture.page}-${capture.version}-${capture.device}.png`;
  await sharp(full).resize({ width: Math.round(width / 4) }).toFile(out);
  console.log(out, capture.sections.map((section) => `${section.id}@${section.top}`).join(" "), capture.pinned.map((layer) => `${layer.id}:${layer.states.length}`).join(" "));
}'
```

Expected output: eight sheets. The article after captures list `header:1 breadcrumbs:1 contents:N` on desktop, with N above 1, and `header:1 breadcrumbs:1` on mobile. The help after captures list `header:1 breadcrumbs:1`. The before captures list no layers.

Open every sheet in `.capture/sheets/` and every `pinned-*.png` under `public/captures/article/after/` and `public/captures/help/after/`, and check:
- no cookie banner, modal or help bubble anywhere;
- blank bands only where the pinned header and breadcrumb bar (and on desktop the article sidebar) belong;
- the red lines sit where the spec's group tables put them. On the article before page, the line at the intro paragraph opens the guide, and two lines meet at the "Find a new GP surgery near you" button. On the article after page, the lines are at the lede, "Common questions" and "Ready when you are". On the help pages, they are at "Getting started and registration" and "Need more help?" (before), and at "Popular questions" and "Still need help?" (after);
- each `pinned-contents-<n>.png` highlights the next section down the list.

Fix anything wrong in `capture/pages.ts` or `capture/css.ts` and shoot again.

- [ ] **Step 13: Compare with the live site**

Run: `pnpm capture:compare --page article --page help`
Expected: `.capture/live-vs-capture-article.png` and `.capture/live-vs-capture-help.png`. Open both. The capture (right) matches the live page (left), header and breadcrumb bar included. Small differences in live data are fine.

- [ ] **Step 14: Commit**

```bash
git add -A capture src/data public/captures
git commit -q -m "Capture sticky parts as pinned layers, and shoot the guide article and help centre" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 15: Check the homepage still captures the same header, then restore it**

The homepage header now goes through the generic pinned capture. Check that path reproduces the committed header without keeping the re-shoot:

```bash
pnpm capture --page home --skip-loops
node -e 'const f = require("./src/data/captures.json"); for (const c of f.captures.filter((c) => c.page === "home")) console.log(c.version, c.device, JSON.stringify(c.pinned.map((l) => ({ id: l.id, y: l.y, stickTop: l.stickTop, states: l.states.map((s) => [s.from, s.height, s.blur]) }))))'
```

Expected:
- **before:** both lines show `[]`.
- **after desktop:** `[{"id":"header","y":0,"stickTop":0,"states":[[0,67,null],[1,67,10]]}]`.
- **after mobile:** the same with height `69`.

A further state means the scan found a change the old capture missed. Open its PNG before deciding whether that is right.

Then restore the committed homepage, keeping the work from Step 14:

```bash
git checkout -- src/data/captures.json public/captures
git clean -fdq public/captures/home
git status --short
```

Expected: no output.

---
### Task 7: Three comparisons on the page

**Files:**
- Create: `src/components/StageIntro.tsx`
- Modify: `src/App.tsx`, `src/components/ComparisonStage.tsx`, `src/components/StageViewport.tsx`, `src/components/PageLayer.tsx`, `src/components/PinnedLayers.tsx`, `src/components/PinnedLayerView.tsx`, `src/components/WipeDivider.tsx`, `src/components/DeviceFrame.tsx`, `src/components/BrowserChrome.tsx`
- Test: `e2e/captureData.ts`, `e2e/stageHelpers.ts`, `e2e/stage.spec.ts`, `e2e/navigation.spec.ts`, `e2e/playback.spec.ts`, `e2e/layers.spec.ts`, `e2e/smoke.spec.ts`, `e2e/og.spec.ts`

**Interfaces:**
- Consumes: `PAGES`, `PAGE_IDS`, `addressOf`, `changesFor`, `TOURS`, `UrlOptions.page` (Task 4); article and help captures (Task 6); `pinnedTop`, `pinnedStateIndex` (Task 2).
- Produces: `ComparisonStage` props `{ page: PageId; options: UrlOptions; eager: boolean }`; the stage `section` is named by its intro's `h2` (or by `aria-label` in recording mode) and carries `data-group`; its grid has `data-testid="stage-grid"`. `StageIntro` props `{ page: PageId; headingId: string }`. `StageViewport` gains `page: PageId` and `eager: boolean`. `PageLayer`, `PinnedLayers` and `PinnedLayerView` gain `eager: boolean`. `WipeDivider` gains `label: string`. `DeviceFrame` gains `address: string`, and `BrowserChrome` takes `{ address: string }`. Helpers in `e2e/stageHelpers.ts` take the page id last, defaulting to `"home"`: `stageRegion(page, id)`, `dividerSlider(page, id)`, `stageScale(page, id)`, `openStage(page, id)`, `scrollAfterTo(page, px, id)`, `afterScroll(page, id)`, `beforeAnchor(page, before, id)`, `pinnedOffset(page, layerId, id)`. `e2e/captureData.ts` gains `scrollForAnchor(capture, anchor)`.

- [ ] **Step 1: Give the helpers a page**

In `e2e/captureData.ts`, add:

```ts
export function scrollForAnchor(capture: Capture, anchor: number): number {
  return (anchor / capture.pageHeight) * maxScrollOf(capture);
}
```

and make `scrollToMiddleOf` use it:

```ts
export function scrollToMiddleOf(capture: Capture, id: SectionId): number {
  const span = spanOf(capture, id);
  return scrollForAnchor(capture, (span.start + span.end) / 2);
}
```

Replace `e2e/stageHelpers.ts` with:

```ts
import { expect, type Locator, type Page } from "@playwright/test";
import { PAGES } from "../src/data/pages";
import type { Capture, PageId } from "../src/data/types";
import { anchorOf } from "./captureData";

export function stageRegion(page: Page, id: PageId = "home"): Locator {
  return page.getByRole("region", { name: PAGES[id].name, exact: true });
}

export function dividerSlider(page: Page, id: PageId = "home"): Locator {
  return page.getByRole("slider", { name: `${PAGES[id].name}: divider between before and after` });
}

export async function stageScale(page: Page, id: PageId = "home"): Promise<number> {
  const viewport = stageRegion(page, id).getByTestId("stage-viewport");
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-scale")))
    .toBeGreaterThan(0);
  return Number(await viewport.getAttribute("data-scale"));
}

export async function openStage(page: Page, id: PageId = "home"): Promise<Locator> {
  const stage = stageRegion(page, id);
  await stage.getByTestId("stage-grid").scrollIntoViewIfNeeded();
  await stageScale(page, id);
  return stage;
}

export async function scrollAfterTo(page: Page, pagePx: number, id: PageId = "home") {
  const scale = await stageScale(page, id);
  await stageRegion(page, id)
    .getByTestId("after-scroller")
    .evaluate((element, top) => {
      element.scrollTop = top;
    }, pagePx * scale);
}

export async function afterScroll(page: Page, id: PageId = "home"): Promise<number> {
  const scale = await stageScale(page, id);
  return stageRegion(page, id)
    .getByTestId("after-scroller")
    .evaluate((element, by) => element.scrollTop / by, scale);
}

export async function beforeAnchor(page: Page, before: Capture, id: PageId = "home") {
  const scale = await stageScale(page, id);
  const translateY = await stageRegion(page, id)
    .getByTestId("before-page")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  return anchorOf(before, -translateY / scale);
}

export async function pinnedOffset(page: Page, layerId: string, id: PageId = "home") {
  return stageRegion(page, id)
    .getByTestId(`pinned-${layerId}`)
    .first()
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
}
```

- [ ] **Step 2: Write the failing specs**

Replace `e2e/stage.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";
import { PAGE_IDS, PAGES } from "../src/data/pages";
import type { PageId, SectionId } from "../src/data/types";
import { captureOf, scrollForAnchor, scrollToMiddleOf, spanOf } from "./captureData";
import { beforeAnchor, dividerSlider, openStage, scrollAfterTo, stageRegion } from "./stageHelpers";

const MIDDLE: Record<PageId, SectionId> = { home: "how", article: "guide", help: "questions" };

for (const id of PAGE_IDS) {
  const after = captureOf(id, "after", "desktop");
  const before = captureOf(id, "before", "desktop");
  const middle = MIDDLE[id];

  test.describe(PAGES[id].name, () => {
    test("the divider follows the arrow keys and a drag", async ({ page }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      const slider = dividerSlider(page, id);
      await expect(slider).toHaveValue("50");
      await slider.focus();
      await page.keyboard.press("ArrowRight");
      await expect(slider).toHaveValue("55");
      await page.keyboard.press("Shift+ArrowLeft");
      await expect(slider).toHaveValue("35");

      const viewport = stage.getByTestId("stage-viewport");
      await viewport.scrollIntoViewIfNeeded();
      const frame = await viewport.boundingBox();
      const handle = await stage.getByTestId("divider-handle").boundingBox();
      if (!frame || !handle) throw new Error("The stage has not laid out");
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect(slider).toHaveValue("25");
    });

    test("scrolling the after page carries the before page to the same section", async ({
      page,
    }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, middle), id);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
      const span = spanOf(before, middle);
      await expect.poll(() => beforeAnchor(page, before, id)).toBeGreaterThanOrEqual(span.start);
      expect(await beforeAnchor(page, before, id)).toBeLessThan(span.end);
    });

    test("resizing the window keeps the frame on the same section", async ({ page }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, middle), id);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
      await page.setViewportSize({ width: 1180, height: 820 });
      await page.waitForTimeout(400);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
    });
  });
}

test("the old how-to page holds still while the article scrolls through its questions", async ({
  page,
}) => {
  const after = captureOf("article", "after", "desktop");
  const before = captureOf("article", "before", "desktop");
  const questions = spanOf(after, "questions");
  const held = spanOf(before, "questions").start;
  await page.goto("/");
  await openStage(page, "article");
  await scrollAfterTo(page, scrollForAnchor(after, questions.start + 20), "article");
  await expect(stageRegion(page, "article")).toHaveAttribute("data-group", "questions");
  await expect.poll(() => beforeAnchor(page, before, "article")).toBeCloseTo(held, 0);
  await scrollAfterTo(page, scrollForAnchor(after, questions.end - 20), "article");
  await expect.poll(() => beforeAnchor(page, before, "article")).toBeCloseTo(held, 0);
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const id of ["home", "article"] as const) {
    test(`${PAGES[id].name} opens on the mobile captures without scrolling sideways`, async ({
      page,
    }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
        "src",
        new RegExp(`captures/${id}/after/mobile/`),
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("@review the stage", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await openStage(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/02-stage.png" });
  await scrollAfterTo(page, scrollToMiddleOf(captureOf("home", "after", "desktop"), "how"));
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/03-stage-how.png" });
});

test("@review a phone visitor", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/07-phone-top.png" });
  await openStage(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/07-phone-stage.png" });
  await page.close();
});

test.describe("before the animation code has loaded", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/motionFeatures-.*\.js$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
  });

  for (const id of ["home", "article"] as const) {
    const after = captureOf(id, "after", "desktop");
    const before = captureOf(id, "before", "desktop");

    test(`a scroll still carries the before page along (${PAGES[id].name})`, async ({ page }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, MIDDLE[id]), id);
      const span = spanOf(before, MIDDLE[id]);
      await expect
        .poll(() => beforeAnchor(page, before, id), { timeout: 1500 })
        .toBeGreaterThanOrEqual(span.start);
    });

    test(`the arrow keys still move the divider (${PAGES[id].name})`, async ({ page }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      await dividerSlider(page, id).focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => stage.getByTestId("divider-handle").evaluate((element) => element.style.left), {
          timeout: 1500,
        })
        .toBe("55%");
    });
  }
});

test.describe("on a touch phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("scrolling past the end of the frame carries on down the page", async ({ page }) => {
    await page.goto("/");
    const stage = await openStage(page);
    const scroller = stage.getByTestId("after-scroller");
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const box = await scroller.boundingBox();
    if (!box) throw new Error("The frame has not laid out");
    const pageScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.3);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(pageScroll);
  });
});
```

Replace `e2e/navigation.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";
import { changesFor } from "../src/data/changes";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { openStage, scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");

test("the rail follows the scroll", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "areas"));
  await expect(stageRegion(page).getByRole("button", { name: "Areas" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("the rail glides the frame to a section and shows what changed there", async ({ page }) => {
  await page.goto("/");
  const stage = stageRegion(page);
  await stage.getByRole("button", { name: "How it works" }).click();
  await expect(stage).toHaveAttribute("data-group", "how");
  await expect(stage.getByText(changesFor("home", "how")[0])).toBeVisible();
});

test("the article rail glides to its next steps and shows what changed there", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await stage.getByRole("button", { name: "Next steps" }).click();
  await expect(stage).toHaveAttribute("data-group", "next");
  await expect(stage.getByText(changesFor("article", "next")[0])).toBeVisible();
});

test("switching device keeps the section", async ({ page }) => {
  await page.goto("/");
  const stage = stageRegion(page);
  await stage.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stage).toHaveAttribute("data-group", "faq-about");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/home\/after\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "faq-about");
});

test("switching device on the article keeps it on the questions the old page lacks", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await stage.getByRole("button", { name: "Common questions" }).click();
  await expect(stage).toHaveAttribute("data-group", "questions");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/article\/after\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "questions");
});

test("each comparison keeps its own device", async ({ page }) => {
  await page.goto("/");
  const article = await openStage(page, "article");
  await article.getByRole("button", { name: "Mobile" }).click();
  await expect(article.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/article\/after\/mobile\//,
  );
  await expect(
    stageRegion(page).getByTestId("after-scroller").locator("img").first(),
  ).toHaveAttribute("src", /captures\/home\/after\/desktop\//);
});

test("@review the mobile frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Mobile" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/04-stage-mobile.png" });
});
```

Replace `e2e/playback.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

test("Play runs the tour on its own", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  const slider = dividerSlider(page);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("any input during Play stops it", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(600);
  const viewport = await stage.getByTestId("stage-viewport").boundingBox();
  if (!viewport) throw new Error("The stage has not laid out");
  await page.mouse.move(viewport.x + viewport.width * 0.7, viewport.y + viewport.height * 0.5);
  await page.mouse.wheel(0, 120);
  await expect(stage.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  const slider = dividerSlider(page);
  const held = await slider.inputValue();
  await page.waitForTimeout(500);
  await expect(slider).toHaveValue(held);
});

test("Play on the help centre tours the help centre", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page, "help");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage).toHaveAttribute("data-group", "questions", { timeout: 5000 });
});

test("recording mode hides the controls and plays on its own", async ({ page }) => {
  await page.goto("/?record=16x9");
  await expect(page.getByRole("button", { name: /^(Play|Stop)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(stageRegion(page)).toBeVisible();
  const slider = dividerSlider(page);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("recording mode shows the page it is asked for", async ({ page }) => {
  await page.goto("/?record=16x9&page=help");
  await expect(stageRegion(page, "help")).toBeVisible();
  await expect(stageRegion(page, "home")).toHaveCount(0);
  const slider = dividerSlider(page, "help");
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("recording mode falls back to the homepage for a page it does not know", async ({ page }) => {
  await page.goto("/?record=16x9&page=nope");
  await expect(stageRegion(page, "home")).toBeVisible();
});

test("with reduced motion the loops stay off and Play cuts instead of sweeping", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(0);
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(dividerSlider(page)).toHaveValue("0", { timeout: 400 });
});

test("@review the recording frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: ".capture/review/08-record-16x9.png" });
});
```

Replace `e2e/layers.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";
import { pinnedStateIndex, pinnedTop } from "../src/lib/pinned";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { afterScroll, openStage, pinnedOffset, scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");
const ARTICLE = captureOf("article", "after", "desktop");

function articleLayer(id: string) {
  const layer = ARTICLE.pinned.find((entry) => entry.id === id);
  if (!layer) throw new Error(`The article capture has no ${id} layer`);
  return layer;
}

test("the v2 header lies clear over the hero and turns solid once the page moves", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page);
  const solid = stage.getByTestId("pinned-header-1");
  await expect(solid).toHaveCSS("opacity", "0");
  await scrollAfterTo(page, 120);
  await expect(solid).toHaveCSS("opacity", "1");
  await scrollAfterTo(page, 0);
  await expect(solid).toHaveCSS("opacity", "0");
});

test("plays the captured loops on the after page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(AFTER.loops.length);
  await openStage(page);
  await expect
    .poll(
      () =>
        page
          .getByTestId("live-loop")
          .first()
          .evaluate((video: HTMLVideoElement) => !video.paused && video.readyState >= 2),
      { timeout: 10_000 },
    )
    .toBe(true);
});

test("failed loop videos leave the stills showing", async ({ page }) => {
  await page.route(/\.(mp4|webm)$/, (route) => route.abort());
  await page.goto("/");
  const stage = await openStage(page);
  await page.waitForTimeout(4000);
  const opacities = await page
    .getByTestId("live-loop")
    .evaluateAll((videos) => videos.map((video) => getComputedStyle(video).opacity));
  expect(opacities).toEqual(AFTER.loops.map(() => "0"));
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toBeVisible();
});

test("mid-guide the article's breadcrumb bar sits under its header and the sidebar marks the section", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await scrollAfterTo(page, scrollToMiddleOf(ARTICLE, "guide"), "article");
  const scroll = await afterScroll(page, "article");
  const breadcrumbs = articleLayer("breadcrumbs");
  expect(pinnedTop(breadcrumbs, scroll) - scroll).toBeCloseTo(breadcrumbs.stickTop, 1);
  for (const layer of ARTICLE.pinned) {
    await expect
      .poll(() => pinnedOffset(page, layer.id, "article"))
      .toBeCloseTo(pinnedTop(layer, scroll) - scroll, 0);
    await expect(stage.getByTestId(`pinned-${layer.id}`).first()).toHaveAttribute(
      "data-state",
      String(pinnedStateIndex(layer, scroll)),
    );
  }
});

test("the article's sidebar lets go once the article ends", async ({ page }) => {
  await page.goto("/");
  await openStage(page, "article");
  const contents = articleLayer("contents");
  expect(contents.states.length).toBeGreaterThan(1);
  await scrollAfterTo(page, scrollToMiddleOf(ARTICLE, "footer"), "article");
  const scroll = await afterScroll(page, "article");
  expect(pinnedTop(contents, scroll)).toBeLessThan(scroll + contents.stickTop);
  await expect
    .poll(() => pinnedOffset(page, "contents", "article"))
    .toBeCloseTo(pinnedTop(contents, scroll) - scroll, 0);
});

test("@review the solid header", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await openStage(page);
  await scrollAfterTo(page, 400);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/03b-header-solid.png" });
});
```

Add to `e2e/smoke.spec.ts` the imports `import { PAGE_IDS, PAGES } from "../src/data/pages";` and `import { dividerSlider, openStage } from "./stageHelpers";`, and this test:

```ts
test("shows the three comparisons, each under its own names", async ({ page }) => {
  await page.goto("/?page=help");
  for (const id of PAGE_IDS) {
    const { name } = PAGES[id];
    await expect(page.getByRole("region", { name, exact: true })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: `${name} sections`, exact: true })).toHaveCount(
      1,
    );
    await openStage(page, id);
    await expect(dividerSlider(page, id)).toHaveCount(1);
  }
});
```

(`?page=` only matters when recording, so all three comparisons still show.)

In `e2e/og.spec.ts`, add `import { stageRegion } from "./stageHelpers";` and scroll the homepage grid instead of the old region:

```ts
  await stageRegion(page)
    .getByTestId("stage-grid")
    .evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm e2e`
Expected: FAIL. There is no region named "Homepage", "Guide article" or "Help centre" yet, and no slider named "Homepage: divider between before and after".

- [ ] **Step 4: Write the comparison intro**

Create `src/components/StageIntro.tsx`:

```tsx
import { PAGES } from "../data/pages";
import type { PageId } from "../data/types";
import { MetaItem } from "./MetaItem";

type StageIntroProps = { page: PageId; headingId: string };

export function StageIntro({ page, headingId }: StageIntroProps) {
  const { number, name, summary, route, shipped } = PAGES[page];
  return (
    <div className="mx-auto max-w-[1240px] pt-20 pb-10 sm:pt-28">
      <p className="caption text-mint">{number}</p>
      <h2
        id={headingId}
        className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl"
      >
        {name}
      </h2>
      <p className="mt-4 max-w-[620px] text-lg text-mist/70">{summary}</p>
      <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4 text-sm">
        <MetaItem term="Route">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
            {route.before !== route.after && (
              <>
                <code>{route.before}</code>
                <span aria-hidden="true">→</span>
                <span className="sr-only">became</span>
              </>
            )}
            <code>{route.after}</code>
          </span>
        </MetaItem>
        <MetaItem term="Shipped">{shipped}</MetaItem>
      </dl>
    </div>
  );
}
```

- [ ] **Step 5: Drive the stage by page**

Replace `src/components/ComparisonStage.tsx` with:

```tsx
import { LayoutGroup, useMotionValue } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import { addressOf, PAGES } from "../data/pages";
import type { Device, PageId, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { type PlaybackTargets, usePlayback } from "../hooks/usePlayback";
import { TOURS } from "../lib/playScript";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import type { RecordAspect, UrlOptions } from "../lib/urlOptions";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { type RailLayout, SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageIntro } from "./StageIntro";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

type ComparisonStageProps = { page: PageId; options: UrlOptions; eager: boolean };

type StageLayout = {
  root: string;
  box: string;
  grid: string;
  frame: string;
  side: string;
  rail: RailLayout;
};

type DeviceMaps = Record<Device, SectionMap>;

function mapsFor(page: PageId): DeviceMaps {
  const mapFor = (device: Device) => {
    const after = captureFor(page, "after", device);
    return createSectionMap(after, captureFor(page, "before", device), after.viewport.height);
  };
  return { desktop: mapFor("desktop"), mobile: mapFor("mobile") };
}

const MAPS: Record<PageId, DeviceMaps> = {
  home: mapsFor("home"),
  article: mapsFor("article"),
  help: mapsFor("help"),
};

const INPUTS = ["pointerdown", "wheel", "keydown", "touchstart"] as const;

const PAGE_LAYOUT: StageLayout = {
  root: "@container/stage relative mx-auto w-full max-w-[1480px] px-4 sm:px-6",
  box: "",
  grid: "grid gap-5 @min-[1100px]/stage:h-[min(86svh,940px)] @min-[1100px]/stage:min-h-[600px] @min-[1100px]/stage:grid-cols-[160px_minmax(0,1fr)_300px] @min-[1100px]/stage:gap-8",
  frame:
    "grid h-[min(78svh,760px)] min-h-[420px] place-items-center [container-type:size] @min-[1100px]/stage:h-auto @min-[1100px]/stage:min-h-0",
  side: "min-w-0 @min-[1100px]/stage:self-center",
  rail: "responsive",
};

const RECORD_LAYOUTS: Record<RecordAspect, StageLayout> = {
  "16x9": {
    root: "fixed inset-0 grid cursor-none place-items-center bg-ink",
    box: "aspect-video w-[min(100vw,calc(100vh*16/9))]",
    grid: "grid h-full grid-cols-[180px_minmax(0,1fr)_320px] gap-10 p-10",
    frame: "grid min-h-0 place-items-center [container-type:size]",
    side: "min-w-0 self-center",
    rail: "vertical",
  },
  "4x3": {
    root: "fixed inset-0 grid cursor-none place-items-center bg-ink",
    box: "aspect-[4/3] w-[min(100vw,calc(100vh*4/3))]",
    grid: "grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 p-8",
    frame: "grid min-h-0 place-items-center [container-type:size]",
    side: "min-w-0 justify-self-center",
    rail: "horizontal",
  },
};

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage({ page, options, eager }: ComparisonStageProps) {
  const { reduced } = useMotionPreference();
  const info = PAGES[page];
  const maps = MAPS[page];
  const recording = options.record !== null;
  const headingId = useId();
  const layout = options.record === null ? PAGE_LAYOUT : RECORD_LAYOUTS[options.record];
  const [device, setDevice] = useState<Device>(() => (recording ? "desktop" : initialDevice()));
  const [group, setGroup] = useState<SectionId>(info.sections[0].id);
  const divider = useMotionValue(recording ? 1 : 0.5);
  const stage = useRef<HTMLElement>(null);
  const viewport = useRef<StageViewportHandle>(null);
  const deviceRef = useRef(device);
  const pendingScroll = useRef(0);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const changeDevice = useCallback(
    (next: Device) => {
      const current = deviceRef.current;
      if (next === current) return;
      const scroll = viewport.current?.getScroll() ?? 0;
      pendingScroll.current = maps[next].scrollForGroup(maps[current].groupAt(scroll));
      setDevice(next);
    },
    [maps],
  );

  const targets = useMemo<PlaybackTargets>(
    () => ({
      divider,
      resolve: (forDevice, target) =>
        target === "top" ? 0 : maps[forDevice].scrollForGroup(target),
      setDevice: (next, scrollTop) => {
        pendingScroll.current = scrollTop;
        setDevice(next);
      },
      scrollTo: (pagePx, onDevice) => {
        if (onDevice === deviceRef.current) viewport.current?.scrollTo(pagePx);
      },
    }),
    [divider, maps],
  );

  const { playing, play, stop } = usePlayback(TOURS[page][options.tour], targets, {
    loop: recording,
    cut: reduced,
  });

  useEffect(() => {
    if (recording) play();
  }, [recording, play]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const interrupt = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-play-button]")) return;
      stop();
    };
    for (const name of INPUTS) element.addEventListener(name, interrupt, { passive: true });
    return () => {
      for (const name of INPUTS) element.removeEventListener(name, interrupt);
    };
  }, [stop]);

  const glideTo = useCallback(
    (id: SectionId) => {
      viewport.current?.glideTo(maps[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [maps, reduced],
  );

  const after = captureFor(page, "after", device);
  return (
    <section
      ref={stage}
      aria-labelledby={recording ? undefined : headingId}
      aria-label={recording ? info.name : undefined}
      data-group={group}
      className={layout.root}
    >
      <LayoutGroup id={page}>
        {!recording && <StageIntro page={page} headingId={headingId} />}
        <div className={layout.box}>
          <div data-testid="stage-grid" className={layout.grid}>
            <div className={layout.side}>
              <SectionRail page={page} active={group} onSelect={glideTo} layout={layout.rail} />
            </div>
            <div className={layout.frame}>
              <DeviceFrame device={device} viewport={after.viewport} address={addressOf(page)}>
                <StageViewport
                  key={device}
                  ref={viewport}
                  page={page}
                  device={device}
                  divider={divider}
                  map={maps[device]}
                  live={!reduced}
                  eager={eager}
                  initialScroll={pendingScroll.current}
                  onGroupChange={setGroup}
                />
              </DeviceFrame>
            </div>
            <div className={layout.side}>
              <ChangeCallouts page={page} group={group} />
            </div>
          </div>
          {!recording && (
            <StageControls
              device={device}
              onDeviceChange={changeDevice}
              playing={playing}
              onTogglePlay={playing ? stop : play}
            />
          )}
        </div>
      </LayoutGroup>
    </section>
  );
}
```

- [ ] **Step 6: Draw each page's captures in the viewport**

In `src/components/StageViewport.tsx`:
- add `import { PAGES } from "../data/pages";` and change the type import to `import type { Device, PageId, SectionId } from "../data/types";`;
- add `page: PageId;` and `eager: boolean;` to `StageViewportProps`, and destructure both;
- at the top of the component, add `const { name, noun } = PAGES[page];` and look up `captureFor(page, "before", device)` and `captureFor(page, "after", device)`;
- give the scroller `aria-label={`After: the v2 ${noun}. Scroll to move both versions together.`}`;
- pass `eager={eager}` to both `PageLayer`s and both `PinnedLayers`, and use these alt texts: `` alt={`After: the Bookable ${noun} on its own design system, ${device}`} `` and `` alt={`Before: the Bookable ${noun} on the NHS design system, ${device}`} ``;
- pass the label to the divider: `` <WipeDivider divider={divider} label={`${name}: divider between before and after`} /> ``.

In `src/components/PageLayer.tsx`, add `eager: boolean` to `PageLayerProps`, destructure it, and pass `eager={eager && index === 0}` to each `PageTile`.

In `src/components/PinnedLayers.tsx`, add `eager: boolean` to `PinnedLayersProps`, destructure it, and pass `eager={eager}` to each `PinnedLayerView`. In `src/components/PinnedLayerView.tsx`, add `eager: boolean` to `PinnedLayerViewProps`, destructure it, and add to the `img`:

```tsx
            loading={eager ? "eager" : "lazy"}
            decoding="async"
```

In `src/components/WipeDivider.tsx`, change the props to `type WipeDividerProps = { divider: MotionValue<number>; label: string };`, destructure `label`, and set the input's `aria-label={label}`.

In `src/components/DeviceFrame.tsx`, add `address: string;` to `DeviceFrameProps`, destructure it, and render `<BrowserChrome address={address} />`.

Replace `src/components/BrowserChrome.tsx` with:

```tsx
import { LockIcon } from "./LockIcon";

type BrowserChromeProps = { address: string };

export function BrowserChrome({ address }: BrowserChromeProps) {
  return (
    <div aria-hidden="true" className="flex h-11 items-center gap-3 border-white/10 border-b px-4">
      <span className="flex w-14 gap-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <span className="mx-auto flex h-7 w-[min(360px,60%)] min-w-0 items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-3 text-mist/70 text-xs">
        <LockIcon />
        <span className="truncate">{address}</span>
      </span>
      <span className="w-14" />
    </div>
  );
}
```

- [ ] **Step 7: Render the three comparisons**

In `src/App.tsx`, add `import { PAGE_IDS } from "./data/pages";` and render:

```tsx
          {options.record === null ? (
            <>
              <GlowBackground />
              <CaseHeader />
              <main className="pb-24">
                {PAGE_IDS.map((page, index) => (
                  <ComparisonStage key={page} page={page} options={options} eager={index === 0} />
                ))}
                <DesignDiff />
              </main>
              <SiteCredits />
            </>
          ) : (
            <ComparisonStage page={options.page} options={options} eager />
          )}
```

- [ ] **Step 8: Run the specs to see them pass**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all pass.

Run: `pnpm build && pnpm budget`
Note the two figures. Task 8 brings the images under budget if needed, and the JS too.

- [ ] **Step 9: Commit**

```bash
git add -A src e2e
git commit -q -m "Show the guide article and help centre as comparisons beside the homepage" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Load the lower comparisons on approach

**Files:**
- Modify: `src/components/ComparisonStage.tsx`
- Test: `e2e/loading.spec.ts`
- Only if the JS budget fails: create `src/components/DeferredDesignDiff.tsx`; modify `src/App.tsx`, `e2e/design-diff.spec.ts`

**Interfaces:**
- Consumes: `ComparisonStage` (Task 7).
- Produces: a stage that is not `eager` mounts its `StageViewport` only once the stage comes within 25% of a viewport of the screen. Before that, its rail, notes, controls and empty frame render.

- [ ] **Step 1: Write the failing tests**

Create `e2e/loading.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

test("the lower comparisons load nothing until the visitor nears them", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(requested.filter((url) => /\/captures\/(article|help)\//.test(url))).toEqual([]);
  await openStage(page, "article");
  await expect.poll(() => requested.some((url) => url.includes("/captures/article/"))).toBe(true);
});

test("a keyboard visitor tabbing into a comparison reaches its divider", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page, "article").getByRole("button", { name: "Title", exact: true }).focus();
  const slider = dividerSlider(page, "article");
  await expect(slider).toHaveCount(1);
  for (let presses = 0; presses < 8; presses++) {
    if (await slider.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(slider).toBeFocused();
});
```

- [ ] **Step 2: Run them to see the first fail**

Run: `pnpm e2e --grep "load nothing|keyboard visitor"`
Expected: "load nothing" FAILS, listing article and help tile and layer URLs fetched at load. The keyboard test may already pass, and it guards the next step.

- [ ] **Step 3: Mount a lower stage only when it comes near**

In `src/components/ComparisonStage.tsx`:
- import `useInView` with the other Motion imports: `import { LayoutGroup, useInView, useMotionValue } from "motion/react";`;
- after `const stage = useRef<HTMLElement>(null);`, add:

```tsx
  const near = useInView(stage, { once: true, margin: "25% 0px" });
```

- wrap the viewport so it mounts only when needed:

```tsx
                {(eager || near) && (
                  <StageViewport
                    key={device}
                    ref={viewport}
                    page={page}
                    device={device}
                    divider={divider}
                    map={maps[device]}
                    live={!reduced}
                    eager={eager}
                    initialScroll={pendingScroll.current}
                    onGroupChange={setGroup}
                  />
                )}
```

- [ ] **Step 4: Run them to see them pass**

Run: `pnpm e2e --grep "load nothing|keyboard visitor"`
Expected: PASS, 2 tests.

- [ ] **Step 5: Check the budgets**

Run: `pnpm build && pnpm budget`
Expected: `First-paint images` well under 1.5 MB. If `Initial JS` is at or under 100 KB, skip to Step 7.

- [ ] **Step 6: Only if the JS is over budget, load the design-system diff on approach**

Create `src/components/DeferredDesignDiff.tsx`:

```tsx
import { useInView } from "motion/react";
import { lazy, Suspense, useRef } from "react";

const DesignDiff = lazy(() =>
  import("./DesignDiff").then((module) => ({ default: module.DesignDiff })),
);

export function DeferredDesignDiff() {
  const placeholder = useRef<HTMLDivElement>(null);
  const near = useInView(placeholder, { once: true, margin: "100% 0px" });
  return (
    <div ref={placeholder} data-testid="design-diff" className="min-h-[50vh]">
      {near && (
        <Suspense fallback={null}>
          <DesignDiff />
        </Suspense>
      )}
    </div>
  );
}
```

In `src/App.tsx`, replace the `DesignDiff` import and element with `DeferredDesignDiff`. In `e2e/design-diff.spec.ts`, add `await page.getByTestId("design-diff").scrollIntoViewIfNeeded();` right after each `page.goto("/")`.

Run: `pnpm build && pnpm budget && pnpm e2e`
Expected: `Initial JS` under 100 KB, and every test passes.

- [ ] **Step 7: Verify and commit**

Run: `pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all pass.

```bash
git add -A src e2e
git commit -q -m "Load the lower comparisons only as the visitor nears them" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Verified notes and page copy

**Files:**
- Create: `src/lib/capturedOn.ts`
- Modify: `src/data/changes.ts`, `src/data/pages.ts` (summaries only), `src/data/caseStudy.ts`, `index.html`, `src/components/SiteCredits.tsx`, `e2e/smoke.spec.ts`
- Test: `src/lib/capturedOn.test.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the captures (Task 6), `CAPTURES` (Task 3), `CHANGES` and `PAGES` (Task 4).
- Produces: `capturedOn(timestamps: readonly string[]): string`, returning `"on 1 October 2026"`, or `"between 1 October 2026 and 2 October 2026"` when the captures span days (in London time).

- [ ] **Step 1: Write the failing test for the capture dates**

Create `src/lib/capturedOn.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { capturedOn } from "./capturedOn";

describe("capturedOn", () => {
  it("names one day when every capture was taken on it", () => {
    expect(capturedOn(["2026-10-01T09:00:00.000Z", "2026-10-01T18:30:00.000Z"])).toBe(
      "on 1 October 2026",
    );
  });

  it("names the first and last days when the captures span several", () => {
    expect(capturedOn(["2026-10-02T10:00:00.000Z", "2026-10-01T09:00:00.000Z"])).toBe(
      "between 1 October 2026 and 2 October 2026",
    );
  });

  it("counts days in London time", () => {
    expect(capturedOn(["2026-10-01T23:30:00.000Z"])).toBe("on 2 October 2026");
  });

  it("refuses an empty list", () => {
    expect(() => capturedOn([])).toThrow("There are no captures to date");
  });
});
```

Run: `pnpm vitest run src/lib/capturedOn.test.ts`
Expected: FAIL, `Failed to resolve import "./capturedOn"`.

- [ ] **Step 2: Implement it and use it in the credits**

Create `src/lib/capturedOn.ts`:

```ts
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

export function capturedOn(timestamps: readonly string[]): string {
  if (timestamps.length === 0) throw new Error("There are no captures to date");
  const times = timestamps.map((stamp) => Date.parse(stamp));
  const first = DAY.format(Math.min(...times));
  const last = DAY.format(Math.max(...times));
  return first === last ? `on ${first}` : `between ${first} and ${last}`;
}
```

Replace `src/components/SiteCredits.tsx` with:

```tsx
import { CAPTURES } from "../data/captures";
import { capturedOn } from "../lib/capturedOn";

const CAPTURED = capturedOn(CAPTURES.captures.map((capture) => capture.capturedAt));

export function SiteCredits() {
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured {CAPTURED} from production builds of each version. Frutiger is licensed to
        the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
```

Run: `pnpm vitest run src/lib/capturedOn.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 3: Write the failing smoke expectations for the new copy**

In `e2e/smoke.spec.ts`:
- in "loads with its title and no console errors", expect `"Bookable, before & after"` for both the title and the `h1`;
- in "introduces the case study", replace the date check with `await expect(page.getByRole("banner").getByText("Sept 2026", { exact: true })).toBeVisible();`;
- in "credits the captures", add `await expect(page.getByRole("contentinfo")).toContainText(/Screens captured (on|between) \d/);`.

Run: `pnpm e2e --grep "title and no console errors|introduces the case study"`
Expected: FAIL, because the page still says "Bookable homepage, before & after" and "29 Sept 2026".

- [ ] **Step 4: Change the copy**

In `src/data/caseStudy.ts`, set:

```ts
  title: "Bookable, before & after",
  eyebrow: "Case study · Bookable",
  lede: "In September 2026 Bookable's homepage, guide articles and help centre moved off the NHS design system and onto Bookable's own. Drag a divider, scroll inside a frame, or press Play.",
  role: "Front-end engineering",
  shipped: "Sept 2026",
```

In `index.html`, set:

```html
    <title>Bookable, before &amp; after</title>
    <meta
      name="description"
      content="How Bookable's homepage, guide articles and help centre changed when they moved from the NHS design system to Bookable's own: an interactive before and after."
    />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Bookable, before &amp; after" />
    <meta
      property="og:description"
      content="Drag, scroll and play through Bookable's homepage, a guide article and the help centre, before and after the move to its own design system."
    />
```

Run: `pnpm e2e --grep "title and no console errors|introduces the case study|credits the captures"`
Expected: PASS, 3 tests.

- [ ] **Step 5: Check every article and help note, and the three summaries**

The drafts in `src/data/changes.ts` (Task 4) and the summaries in `src/data/pages.ts` were written from source before anything was shot. Check each claim against the contact sheets from Task 6 (`.capture/sheets/`, rebuild them with Task 6 Step 12 if they are gone) and against the source at the pinned commit. Read the source with `git -C ~/Desktop/repos/sanny show <commit>:<path>`. Keep a note only if both agree; otherwise rewrite it to say what the capture shows. Every group keeps two or three notes.

| Note | On the capture | In the source |
|---|---|---|
| article `title` 1 | Sheet `article-before-*`: a plain `h1`. Sheet `article-after-*`: the hero shows "Booking care", "4 min read" and "Reviewed July 2026". | `c016453be7`: `packages/bookable/app/(marketing)/(guide)/_content/bookAGpAppointment.tsx` (`category`, `readMins`, `updated`) |
| article `title` 2 | The article after desktop capture has a `breadcrumbs` layer whose `stickTop` equals the header's height | `packages/bookable/app/_ui/Breadcrumbs.tsx` (`sticky top-[var(--ui-sticky-top,0px)]`) |
| article `guide` 1 | Before: two `h2` sections. After: "In short" with three points, then six `h2` sections | before `1e021d8370^`: `packages/bookable/app/(marketing)/how-to/book-doctor-appointment-nhs/page.tsx`; after: `bookAGpAppointment.tsx` (`keyPoints`, `sections`) |
| article `guide` 2 | The desktop `contents` layer has more than one look, and `pinned-contents-*.png` steps down the list. The mobile capture has no `contents` layer | `packages/bookable/app/_ui/DocSidebar.tsx` |
| article `questions` 1 | Four questions, each in its own card | `bookAGpAppointment.tsx` (`faqs`), `packages/bookable/app/_ui/DocFaq.tsx` |
| article `questions` 2 | The before page's `questions` group is empty in `captures.json` | `capture/pages.ts` (`absent`) |
| article `next` 1 | Before: a single "Find a new GP surgery near you" button. After: the "Ready when you are" card with a postcode field | before `page.tsx` (`ButtonLink`); after `packages/bookable/app/(marketing)/_article/ArticleLayout.tsx` (`ArticleCta` with `ArticleCtaSearch`) |
| article `next` 2 | A "Related articles" row of cards under the call to action | `ArticleLayout.tsx` (`relatedCards`) |
| article and help `footer` 1–2 | Before: the NHS footer. After: the site footer; on mobile, full-width nav rows and two-column legal links | `packages/bookable/app/_shared/Footer.tsx` at `1e021d8370^` and `38facb0a65^`; `packages/bookable/app/_components/SiteFooter.tsx` at `c016453be7` |
| help `title` 1 | Before: "Frequently asked questions" over a list of links. After: "How can we help?" with a search field | before `38facb0a65^`: `packages/bookable/app/faq/page.tsx` (`ContentsList`); after: `packages/bookable/app/help/_components/HelpPageShell.tsx` |
| help `title` 2 | none: this describes behaviour | `HelpPageShell.tsx` (`matchHelpQuestions` on every change of `query`) |
| help `questions` 1 | Count the sections and the closed questions on sheet `help-before-desktop`. After: "Popular questions" and "Browse by topic" | before: `packages/bookable/app/faq/_constants/questions.tsx` (10 sections, 49 `summary` entries); after: `PopularQuestions.tsx`, `TopicGrid.tsx` |
| help `questions` 2 | none | `packages/bookable/app/help/[topic]/page.tsx` exists at `c016453be7` |
| help `more-help` 1–2 | Before: "Need more help?" with three bullets. After: "Still need help?" with Call 111, Visit nhs.uk and Call 999 cards | before `faq/page.tsx`; after `packages/bookable/app/help/_components/StillNeedHelp.tsx` (`CONTACT_ROUTES`) |
| summaries (`PAGES[*].summary`) | Each clause is shown on that page's sheets | as for the notes above |

Run: `pnpm test && pnpm e2e --grep "rail glides"`
Expected: PASS ("gives every group two or three notes" still holds, and the rail tests find the first note of each group they open).

- [ ] **Step 6: Commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A src e2e index.html
git commit -q -m "Check the new notes against the captures and retitle the page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Review shots, link preview, README and the final check

**Files:**
- Modify: `e2e/stage.spec.ts` (review tests), `e2e/playback.spec.ts` (review test), `public/og.png`, `README.md`; `src/components/CaseHeader.tsx` only if the title wraps badly
- Outside the repo: `/Users/liem/.claude/projects/-Users-liem-Desktop-repos-sanny/memory/project_bookable_before_after_showcase.md`

**Interfaces:**
- Consumes: everything above.
- Produces: review screenshots `09`–`13` in `.capture/review/`, a regenerated `public/og.png`, and the README's three-page instructions.

- [ ] **Step 1: Add review shots of the new comparisons**

Append to `e2e/stage.spec.ts`:

```ts
test("@review the article and help stages", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  for (const [id, file] of [
    ["article", "09-article"],
    ["help", "11-help"],
  ] as const) {
    await openStage(page, id);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `.capture/review/${file}.png` });
    await scrollAfterTo(page, scrollToMiddleOf(captureOf(id, "after", "desktop"), MIDDLE[id]), id);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.capture/review/${file}-middle.png` });
  }
});

test("@review the article and help stages on a phone", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto("/");
  for (const [id, file] of [
    ["article", "10-article-phone"],
    ["help", "12-help-phone"],
  ] as const) {
    await openStage(page, id);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.capture/review/${file}.png` });
  }
  await page.close();
});
```

Append to `e2e/playback.spec.ts`:

```ts
test("@review the article recording frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9&page=article");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: ".capture/review/13-record-article.png" });
});
```

- [ ] **Step 2: Take the shots and look at every one**

Run: `pnpm review`
Expected: the review tests pass and `.capture/review/` holds `01` to `13`.

Open each shot and check:
- `01-top`: the title reads "Bookable, before & after". If "before & after" breaks across two lines, widen the `h1`'s `max-w-[12ch]` to `max-w-[15ch]` in `src/components/CaseHeader.tsx` and shoot again.
- `02`, `09`, `11`: each comparison has its intro (number, name, summary, route, shipped date) above a frame whose address bar shows the after page's address.
- `09-article-middle`: the breadcrumb bar sits under the header and the "On this page" sidebar is pinned beside the guide, with a section highlighted.
- `10`, `12`: phone frames show the mobile captures, the route line wraps inside the screen, and nothing scrolls sideways.
- `13-record-article`: a controls-free article stage with its rail and notes.

- [ ] **Step 3: Regenerate the link preview**

Run: `pnpm og`
Expected: `public/og.png` rewritten at 1200×630. Open it: the homepage stage grid, as before, with no intro text crowding the top.

- [ ] **Step 4: Rewrite the README**

Replace `README.md` with:

````markdown
# Bookable, before & after

An interactive, animated before and after of three Bookable pages (bookable.health) as they moved
from the NHS design system to Bookable's own (v2) in September 2026: the homepage, a guide article
and the help centre. Drag a divider, scroll inside a frame (both versions stay on the same section),
switch Desktop and Mobile, or press Play.

## Run it

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

## Check it

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm e2e
pnpm review
```

`pnpm review` writes screenshots of every part of the page to `.capture/review/`.

## Record a shot

Open `/?record=16x9` or `/?record=4x3`. Add `&page=article` or `&page=help` for the other
comparisons, and `&tour=short` for a cut of about 15 seconds. The comparison fills the window with
no controls or cursor and loops its tour; screen-record the window. Recording mode ignores the
reduced-motion setting.

## Deploy

`pnpm build` writes a static site to `dist/`. Set `VITE_BASE=/work/bookable/` to serve it from a
sub-path, and `VITE_SITE_URL=https://your.site` so the link preview uses an absolute image URL.
Regenerate the preview image with `pnpm og`, then build again. `pnpm budget` checks the initial
JS (100 KB gzipped) and first-paint image (1.5 MB) budgets.

## Recapture

The captures in `public/captures/` and `src/data/captures.json` come from pinned commits of the
sanny repo:

| Page | Before | After (all at `c016453be7`) |
|---|---|---|
| Homepage | `/` at `0a143c6820` | `/` |
| Guide article | `/how-to/book-doctor-appointment-nhs` at `1e021d8370^` | `/book-a-gp-appointment` |
| Help centre | `/faq` at `38facb0a65^` | `/help` |

```bash
pnpm capture
pnpm capture --page article --page help
```

This needs a sanny checkout (`SANNY_REPO`, default `~/Desktop/repos/sanny`), pnpm, and ffmpeg
with libx264 and libvpx-vp9. Each commit is exported with `git archive` into `CAPTURE_WORK_DIR`
(default `<os tmp>/bookable-before-after`), built, and served against the public production API:
the homepage before on port 3061, every after page on 3062, the article before on 3063 and the help
centre before on 3064. Nothing is written to sanny.

`--page` captures only those pages and leaves every other page's files and data as they were.
`--skip-loops` skips the homepage's video loops. `pnpm capture:clean` deletes the builds;
`pnpm capture:serve [--page …]` serves builds for inspection; `pnpm capture:compare [--page …]`
puts the live site next to the capture in `.capture/live-vs-capture-<page>.png`. The capture hides
each page's sticky parts (the header, the breadcrumb bar, the article's contents sidebar) on
purpose, because the page draws them as live layers.

## Licensing

Frutiger is licensed to the NHS, so no Frutiger file is in this project; the specimen is a
rendered image. Hanken Grotesk is OFL and loads from Google Fonts. The screenshots show public
Bookable pages.
````

- [ ] **Step 5: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm build && pnpm budget`
Expected: every check passes, both budgets are under their limits, and `git status --short` lists only this task's files.

- [ ] **Step 6: Commit**

```bash
git add -A e2e public/og.png README.md src
git commit -q -m "Review shots, link preview and README for the three comparisons" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Update the project memory**

In `/Users/liem/.claude/projects/-Users-liem-Desktop-repos-sanny/memory/project_bookable_before_after_showcase.md`, record:
- the three comparisons, homepage, guide article (`/how-to/book-doctor-appointment-nhs` → `/book-a-gp-appointment`) and help centre (`/faq` → `/help`), with their four pinned commits;
- `pnpm capture --page <id>` merges one page without touching the others;
- sticky parts are captured as pinned layers, checked against the CSS sticky rule.

Keep the existing LazyMotion note.
