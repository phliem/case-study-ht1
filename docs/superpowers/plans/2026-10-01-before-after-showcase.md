# Bookable Before & After Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone, animated one-page portfolio piece that compares the Bookable homepage before (NHS design system) and after (v2) with a draggable divider, section-locked scrolling, desktop/mobile frames, a scripted Play mode and a recording mode.

**Architecture:** A Vite + React page renders committed captures: full-page screenshot tiles, section boundaries, sticky-header states and seamless video loops, all described by `src/data/captures.json`. A Node capture pipeline (`capture/`) exports both pinned sanny commits with `git archive`, builds and serves them, and shoots them with Playwright, so the page itself never needs sanny. Pure logic (scroll mapping, play script, formatting) is unit tested; the page is covered by Playwright end-to-end tests and screenshot review.

**Tech Stack:** Vite 8, React 19, TypeScript 7, Motion 13 (`motion/react`), Tailwind CSS 4, Biome 2.5, Vitest 5, Playwright 1.63, sharp, ffmpeg, pnpm 10, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-01-before-after-showcase-design.md`

## Global Constraints

- The project lives in `~/Desktop/repos/bookable-before-after` with its own git repo. Never write into sanny: it is only read (`git archive`, `git rev-parse`, reading `packages/bookable/.env.local`).
- Pinned commits: before `0a143c6820`, after `c016453be7`.
- Exact versions: react 19.3.0, react-dom 19.3.0, motion 13.5.0, vite 8.3.2, @vitejs/plugin-react 6.1.1, tailwindcss 4.3.3, @tailwindcss/vite 4.3.3, typescript 7.0.2, vitest 5.0.3, @playwright/test 1.63.0, @biomejs/biome 2.5.15, tsx 4.23.15, sharp 0.35.5, @types/react 19.3.0, @types/react-dom 19.3.0, @types/node 26.6.3. pnpm 10.34.4, Node ≥ 24.
- Capture viewports: desktop 1440×900, mobile 390×844, `deviceScaleFactor` 2. Tiles are 2000 CSS px tall. Loops run at 30fps; no animation is time-scaled by more than 5%.
- Both builds read `https://api.ht1.uk/v2`.
- No Frutiger font file is ever copied; the specimen is a rendered PNG. Hanken Grotesk 500/700/800 loads from Google Fonts.
- Showcase palette: ground `#061528`, glow stops `#1387CC` `#0A63AC` `#083F80` `#052F60`, slate `#8895A0`, mint `#6FE0AC`.
- Page title: "Bookable homepage, before & after".
- Under `prefers-reduced-motion: reduce`: no glow drift, no title stagger, no loops; sweeps, morphs, glides and reveals are instant; Play cuts between states. Recording mode (`?record=16x9|4x3`) ignores the setting.
- Budgets: initial JS under 100 KB gzipped; first-paint images under 1.5 MB.
- Conventions: one React component per file; a named `XProps` type per component; `type`, never `interface`; comments only for a non-obvious why; Biome with 100-character lines and 2-space indent; never add a lint suppression (fix the code, or ask).
- Every claim on the page must be true: no invented metrics; callout copy exactly as in `src/data/changes.ts` (Task 11).
- Commit after each task; never push.

## Review Focus

1. A visitor resizes the window (or rotates a tablet) while the frame shows a section: the frame should stay on that section. Pinned in Task 9 (`resizing the window keeps the frame on the same section`).
2. A visitor switches Desktop/Mobile while scrolled to a section: they should land on the same section on the other device. Pinned in Task 11 (`switching device keeps the section`).
3. A visitor touches, scrolls or presses a key while Play runs: Play should stop at once and leave everything where it is. Pinned in Task 12 (`any input during Play stops it`).
4. A visitor on a phone-width screen: the page should open on the mobile frame with no sideways scroll. Pinned in Task 9 (`opens on the mobile captures without scrolling sideways`).
5. A visitor whose network blocks or fails the loop videos: the stills underneath should stay visible, with no black boxes. Pinned in Task 10 (`failed loop videos leave the stills showing`).

---

## File map

```
bookable-before-after/
  package.json, .gitignore, .nvmrc, biome.json, tsconfig.json
  vite.config.ts, vitest.config.ts, playwright.config.ts, index.html, README.md
  capture/
    paths.ts          output and work-dir paths
    profiles.ts       device profiles, scale, tile height, fps, consent value
    builds.ts         export, install, build and serve a pinned commit
    serve.ts          `pnpm capture:serve`: serve both builds for inspection
    clean.ts          `pnpm capture:clean`: remove the work dir
    capture.ts        `pnpm capture`: the whole capture, writes captures.json
    sections.ts       section anchors per version + validation
    inPage.ts         functions that run inside the captured page
    shoot.ts          one page: settle, measure, tiles, header states, specimen
    loops.ts          frame-stepped loops + ffmpeg encode
    stitch.ts         viewport stops and tile bands (pure)
    loopPlan.ts       seamless loop length and rates (pure)
    literal.ts        object-literal extraction + palette groups (pure)
    pixels.ts         mean absolute pixel difference (pure)
    compareLive.ts    `pnpm capture:compare`: live site vs capture image
  public/captures/    committed capture outputs
  scripts/budget.ts   `pnpm budget`
  src/
    main.tsx, App.tsx, index.css, motionFeatures.ts
    data/    types.ts, sections.ts, captures.json (generated), captures.ts,
             caseStudy.ts, changes.ts, timeline.ts
    lib/     math.ts, sectionMap.ts, playScript.ts, urlOptions.ts, dividerKeys.ts,
             tokenFormat.ts (+ *.test.ts)
    hooks/   useMotionPreference.ts, useElementSize.ts, useFrameScroll.ts, usePlayback.ts
    components/  one file per component (see each task)
  e2e/       smoke, stage, layers, navigation, playback, design-diff, timeline, og specs;
             captureData.ts and stageHelpers.ts helpers
```

---

### Task 1: Scaffold the project and toolchain

**Files:**
- Create: `package.json`, `.gitignore`, `.nvmrc`, `biome.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: scripts `dev`, `build`, `preview`, `typecheck`, `test`, `e2e`, `lint`, `lint:fix`; Tailwind theme tokens `ink`, `ink-2`, `mist`, `slate`, `mint`, `line`, the `caption` utility and the `.glow` class used by later tasks.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "bookable-before-after",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "packageManager": "pnpm@10.34.4",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test --grep-invert \"@review|@og\"",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  },
  "dependencies": {
    "motion": "13.5.0",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.15",
    "@playwright/test": "1.63.0",
    "@tailwindcss/vite": "4.3.3",
    "@types/node": "26.6.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.1",
    "sharp": "0.35.5",
    "tailwindcss": "4.3.3",
    "tsx": "4.23.15",
    "typescript": "7.0.2",
    "vite": "8.3.2",
    "vitest": "5.0.3"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "sharp"]
  }
}
```

- [ ] **Step 2: Write `.gitignore` and `.nvmrc`**

`.gitignore`:
```
node_modules
dist
.capture
test-results
playwright-report
*.local
```

`.nvmrc`:
```
24
```

- [ ] **Step 3: Install dependencies and the Playwright browser**

Run: `pnpm install && pnpm exec playwright install chromium`
Expected: install completes; Chromium downloads. Warnings about ignored build scripts for packages other than esbuild and sharp are fine.

- [ ] **Step 4: Write the tool configs**

`biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.15/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["**", "!src/data/captures.json", "!public/captures"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "css": { "parser": { "tailwindDirectives": true } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["node", "vite/client"]
  },
  "include": [
    "src",
    "capture",
    "e2e",
    "scripts",
    "vite.config.ts",
    "vitest.config.ts",
    "playwright.config.ts"
  ]
}
```

`vite.config.ts`:
```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss()],
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/*.test.ts", "capture/**/*.test.ts"] },
});
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:4173",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
```

- [ ] **Step 5: Write the page entry, theme and placeholder app**

`index.html`:
```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bookable homepage, before &amp; after</title>
    <meta
      name="description"
      content="How the Bookable homepage changed when it moved from the NHS design system to Bookable's own: an interactive before and after."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;700;800&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:
```css
@import "tailwindcss";

@theme {
  --font-sans: "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif;
  --color-ink: #061528;
  --color-ink-2: #0b2140;
  --color-mist: #f0f4f5;
  --color-slate: #8895a0;
  --color-mint: #6fe0ac;
  --color-line: rgb(255 255 255 / 0.1);
}

@utility caption {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  line-height: 1.3;
  text-transform: uppercase;
}

@layer base {
  html {
    background-color: var(--color-ink);
    color: var(--color-mist);
    color-scheme: dark;
  }

  body {
    margin: 0;
    font-family: var(--font-sans);
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background: var(--color-mint);
    color: var(--color-ink);
  }
}

.glow {
  background:
    radial-gradient(40vmax 40vmax at 18% 8%, rgb(19 135 204 / 0.32), transparent 62%),
    radial-gradient(48vmax 42vmax at 86% 26%, rgb(10 99 172 / 0.26), transparent 62%),
    radial-gradient(60vmax 50vmax at 50% 100%, rgb(8 63 128 / 0.34), transparent 66%);
  animation: glow-drift 38s ease-in-out infinite alternate;
}

@keyframes glow-drift {
  from {
    transform: translate3d(-2%, -1%, 0) scale(1);
  }
  to {
    transform: translate3d(3%, 2%, 0) scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glow {
    animation: none;
  }
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("The page has no #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:
```tsx
export function App() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <h1 className="text-center font-extrabold text-5xl tracking-[-0.035em]">
        Bookable homepage, before & after
      </h1>
    </main>
  );
}
```

- [ ] **Step 6: Write the smoke test**

`e2e/smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("loads with its title and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Bookable homepage, before & after");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bookable homepage, before & after",
  );
  expect(errors).toEqual([]);
});
```

- [ ] **Step 7: Run the checks**

Run: `pnpm lint:fix && pnpm lint && pnpm build && pnpm e2e`
Expected: Biome reports no errors, the build writes `dist/`, and 1 Playwright test passes. If Biome rejects a config key (for example `css.parser.tailwindDirectives`), run `pnpm exec biome migrate --write` and re-run; if it still rejects it, remove that one key and add `"!src/index.css"` to `files.includes`. That scopes the file out rather than suppressing a rule.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Scaffold the showcase: Vite, React, Tailwind, Biome, Vitest, Playwright" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Shared types and the section map

**Files:**
- Create: `src/data/types.ts`, `src/data/sections.ts`, `src/lib/math.ts`, `src/lib/math.test.ts`, `src/lib/sectionMap.ts`, `src/lib/sectionMap.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Types `Version`, `Device`, `SectionId`, `Rect`, `Tile`, `SectionTop`, `HeaderState`, `StickyHeader`, `Loop`, `MeasuredTokens`, `Capture`, `PaletteGroup`, `CapturesFile` (`src/data/types.ts`).
  - `SECTION_IDS: readonly SectionId[]`, `SECTION_LABELS: Record<SectionId, string>` (`src/data/sections.ts`).
  - `clamp(value, min, max)`, `lerp(from, to, t)`, `easeInOutCubic(t)` (`src/lib/math.ts`).
  - `type PageLayout = { sections: readonly SectionTop[]; pageHeight: number }`, `type SectionMap = { mapScroll(scrollA: number): number; groupAt(scrollA: number): SectionId; scrollForGroup(id: SectionId): number; maxScrollA: number; maxScrollB: number }`, `createSectionMap(after: PageLayout, before: PageLayout, viewportHeight: number): SectionMap` (`src/lib/sectionMap.ts`).

The mapping uses a proportional anchor, so the tops of both pages and the bottoms of both pages always line up: `anchor = scroll / maxScroll × pageHeight`. The anchor sweeps from the frame's top edge at the top of the page to its bottom edge at the end. An anchor inside group `i` of the after page maps linearly onto group `i` of the before page, and back to a scroll position the same way.

- [ ] **Step 1: Write the shared types and section labels**

`src/data/types.ts`:
```ts
export type Version = "before" | "after";
export type Device = "desktop" | "mobile";
export type SectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";

export type Rect = { x: number; y: number; width: number; height: number };

export type Tile = { avif: string; webp: string; top: number; height: number };

export type SectionTop = { id: SectionId; top: number };

export type HeaderState = {
  id: "top" | "scrolled";
  src: string;
  height: number;
  blur: number | null;
};

export type StickyHeader = { flipAt: number; states: HeaderState[] };

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
  version: Version;
  device: Device;
  commit: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  scale: number;
  pageHeight: number;
  tiles: Tile[];
  sections: SectionTop[];
  header: StickyHeader | null;
  loops: Loop[];
  tokens: MeasuredTokens;
};

export type PaletteGroup = { name: string; swatches: { name: string; hex: string }[] };

export type CapturesFile = {
  captures: Capture[];
  palettes: { before: PaletteGroup[]; after: PaletteGroup[] };
  radiusScale: string[];
  specimens: { frutiger: string };
};
```

`src/data/sections.ts`:
```ts
import type { SectionId } from "./types";

export const SECTION_IDS: readonly SectionId[] = [
  "hero",
  "proof",
  "how",
  "faq-about",
  "areas",
  "footer",
];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  proof: "Social proof",
  how: "How it works",
  "faq-about": "FAQ & About",
  areas: "Areas",
  footer: "Footer",
};
```

- [ ] **Step 2: Write the failing math tests**

`src/lib/math.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { clamp, easeInOutCubic, lerp } from "./math";

describe("clamp", () => {
  it("holds a value inside its bounds", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});

describe("lerp", () => {
  it("runs from the start to the end as t runs from 0 to 1", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerp(10, 20, 1)).toBe(20);
  });
});

describe("easeInOutCubic", () => {
  it("starts at 0, passes the middle at 0.5 and ends at 1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("never goes backwards", () => {
    let previous = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      const value = easeInOutCubic(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `pnpm test src/lib/math.test.ts`
Expected: FAIL, `Failed to resolve import "./math"`.

- [ ] **Step 4: Implement the math helpers**

`src/lib/math.ts`:
```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}
```

- [ ] **Step 5: Run it to see it pass**

Run: `pnpm test src/lib/math.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Write the failing section-map tests**

`src/lib/sectionMap.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { SectionId, SectionTop } from "../data/types";
import { createSectionMap, type PageLayout } from "./sectionMap";

const IDS: readonly SectionId[] = ["hero", "proof", "how", "faq-about", "areas", "footer"];

function layout(heights: readonly number[]): PageLayout {
  let top = 0;
  const sections: SectionTop[] = heights.map((height, index) => {
    const section = { id: IDS[index], top };
    top += height;
    return section;
  });
  return { sections, pageHeight: top };
}

function scrollAnchoredAt(anchor: number, page: PageLayout, maxScroll: number): number {
  return (anchor / page.pageHeight) * maxScroll;
}

const AFTER = layout([800, 1500, 1100, 1300, 400, 450]);
const BEFORE = layout([700, 2600, 900, 2100, 300, 600]);
const VIEWPORT = 900;

describe("createSectionMap", () => {
  it("maps a page onto an identical page one to one", () => {
    const page = layout([900, 1200, 1000, 1600, 500, 400]);
    const map = createSectionMap(page, page, VIEWPORT);
    for (const scroll of [0, 250, 1234, 3000, map.maxScrollA]) {
      expect(map.mapScroll(scroll)).toBeCloseTo(scroll, 6);
    }
  });

  it("puts the top on the top and the bottom on the bottom", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.mapScroll(0)).toBe(0);
    expect(map.mapScroll(map.maxScrollA)).toBe(map.maxScrollB);
  });

  it("lands a group boundary on the same group boundary", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    const scrollA = scrollAnchoredAt(AFTER.sections[2].top, AFTER, map.maxScrollA);
    const expected = scrollAnchoredAt(BEFORE.sections[2].top, BEFORE, map.maxScrollB);
    expect(map.mapScroll(scrollA)).toBeCloseTo(expected, 6);
  });

  it("lands the middle of the swapped FAQ and About group on the middle of its pair", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    const middleA = AFTER.sections[3].top + 1300 / 2;
    const middleB = BEFORE.sections[3].top + 2100 / 2;
    const scrollA = scrollAnchoredAt(middleA, AFTER, map.maxScrollA);
    expect(map.mapScroll(scrollA)).toBeCloseTo(
      scrollAnchoredAt(middleB, BEFORE, map.maxScrollB),
      6,
    );
  });

  it("clamps scroll positions outside the page", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.mapScroll(-100)).toBe(0);
    expect(map.mapScroll(map.maxScrollA + 500)).toBe(map.maxScrollB);
  });

  it("never moves the before page backwards while the after page scrolls down", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    let previous = -1;
    for (let scroll = 0; scroll <= map.maxScrollA; scroll += 7) {
      const value = map.mapScroll(scroll);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("works for tall phone pages with a shorter viewport", () => {
    const after = layout([1400, 3100, 2600, 2900, 700, 900]);
    const before = layout([1500, 5200, 2100, 4300, 600, 1300]);
    const map = createSectionMap(after, before, 844);
    const scrollA = scrollAnchoredAt(after.sections[4].top, after, map.maxScrollA);
    expect(map.mapScroll(scrollA)).toBeCloseTo(
      scrollAnchoredAt(before.sections[4].top, before, map.maxScrollB),
      6,
    );
  });

  it("names the hero at the top and the footer at the bottom", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    expect(map.groupAt(0)).toBe("hero");
    expect(map.groupAt(map.maxScrollA)).toBe("footer");
  });

  it("scrolls to a group so that the group is the one named", () => {
    const map = createSectionMap(AFTER, BEFORE, VIEWPORT);
    for (const id of IDS) {
      expect(map.groupAt(map.scrollForGroup(id))).toBe(id);
    }
    expect(map.scrollForGroup("hero")).toBe(0);
    expect(map.scrollForGroup("footer")).toBe(map.maxScrollA);
  });

  it("rejects pages whose groups differ", () => {
    const missing: PageLayout = {
      sections: AFTER.sections.filter((section) => section.id !== "areas"),
      pageHeight: AFTER.pageHeight,
    };
    expect(() => createSectionMap(AFTER, missing, VIEWPORT)).toThrow("Section groups differ");
  });

  it("handles a page no taller than the frame", () => {
    const short = layout([300, 100, 100, 100, 100, 50]);
    const map = createSectionMap(short, short, VIEWPORT);
    expect(map.maxScrollA).toBe(0);
    expect(map.mapScroll(0)).toBe(0);
    expect(map.groupAt(0)).toBe("hero");
  });
});
```

- [ ] **Step 7: Run it to see it fail**

Run: `pnpm test src/lib/sectionMap.test.ts`
Expected: FAIL, `Failed to resolve import "./sectionMap"`.

- [ ] **Step 8: Implement the section map**

`src/lib/sectionMap.ts`:
```ts
import type { SectionId, SectionTop } from "../data/types";
import { clamp } from "./math";

export type PageLayout = { sections: readonly SectionTop[]; pageHeight: number };

export type SectionMap = {
  mapScroll: (scrollA: number) => number;
  groupAt: (scrollA: number) => SectionId;
  scrollForGroup: (id: SectionId) => number;
  maxScrollA: number;
  maxScrollB: number;
};

type Span = { id: SectionId; start: number; end: number };

function spansOf(page: PageLayout): Span[] {
  return page.sections.map((section, index) => ({
    id: section.id,
    start: section.top,
    end: page.sections[index + 1]?.top ?? page.pageHeight,
  }));
}

function spanIndexAt(anchor: number, spans: readonly Span[]): number {
  const index = spans.findIndex((span) => anchor < span.end);
  return index === -1 ? spans.length - 1 : index;
}

export function createSectionMap(
  after: PageLayout,
  before: PageLayout,
  viewportHeight: number,
): SectionMap {
  const spansA = spansOf(after);
  const spansB = spansOf(before);
  const idsA = spansA.map((span) => span.id).join(",");
  const idsB = spansB.map((span) => span.id).join(",");
  if (idsA !== idsB) throw new Error(`Section groups differ: ${idsA} vs ${idsB}`);

  const maxScrollA = Math.max(0, after.pageHeight - viewportHeight);
  const maxScrollB = Math.max(0, before.pageHeight - viewportHeight);

  const anchorA = (scrollA: number) =>
    maxScrollA === 0 ? 0 : (clamp(scrollA, 0, maxScrollA) / maxScrollA) * after.pageHeight;

  return {
    maxScrollA,
    maxScrollB,
    mapScroll(scrollA) {
      if (maxScrollB === 0) return 0;
      const anchor = anchorA(scrollA);
      const index = spanIndexAt(anchor, spansA);
      const spanA = spansA[index];
      const spanB = spansB[index];
      const t = spanA.end === spanA.start ? 0 : (anchor - spanA.start) / (spanA.end - spanA.start);
      const anchorB = spanB.start + t * (spanB.end - spanB.start);
      return clamp((anchorB / before.pageHeight) * maxScrollB, 0, maxScrollB);
    },
    groupAt(scrollA) {
      return spansA[spanIndexAt(anchorA(scrollA), spansA)].id;
    },
    scrollForGroup(id) {
      const index = spansA.findIndex((span) => span.id === id);
      if (index <= 0) return 0;
      if (index === spansA.length - 1) return maxScrollA;
      const span = spansA[index];
      return clamp((((span.start + span.end) / 2) / after.pageHeight) * maxScrollA, 0, maxScrollA);
    },
  };
}
```

- [ ] **Step 9: Run it to see it pass**

Run: `pnpm test`
Expected: PASS, 15 tests across 2 files.

- [ ] **Step 10: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Map the after page's scroll onto the before page section by section" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Play script, URL options and divider keys

**Files:**
- Create: `src/lib/playScript.ts`, `src/lib/playScript.test.ts`, `src/lib/urlOptions.ts`, `src/lib/urlOptions.test.ts`, `src/lib/dividerKeys.ts`, `src/lib/dividerKeys.test.ts`

**Interfaces:**
- Consumes: `Device`, `SectionId` (Task 2); `easeInOutCubic`, `lerp`, `clamp` (Task 2).
- Produces:
  - `type ScrollTarget = SectionId | "top"`; `type PlayStep`; `type PlayScript = { start: { device: Device; divider: number }; steps: readonly PlayStep[] }`; `type PlayState = { device: Device; divider: number; scrollTop: number; target: ScrollTarget; stepIndex: number }`; `type ScrollResolver = (device: Device, target: ScrollTarget) => number`; `FULL_TOUR`, `SHORT_TOUR`; `durationOf(script): number`; `stateAt(script, elapsedMs, resolve, cut = false): PlayState` (`src/lib/playScript.ts`).
  - `type RecordAspect = "16x9" | "4x3"`; `type UrlOptions = { record: RecordAspect | null; tour: "full" | "short" }`; `parseUrlOptions(search: string): UrlOptions` (`src/lib/urlOptions.ts`).
  - `nextDividerValue(current: number, key: string, shift: boolean): number | null` (`src/lib/dividerKeys.ts`).

The divider value is the share of the frame, from the left, that shows the before page: 1 is all before and 0 is all after.

- [ ] **Step 1: Write the failing play-script tests**

`src/lib/playScript.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { SectionId } from "../data/types";
import {
  durationOf,
  FULL_TOUR,
  type PlayScript,
  type ScrollResolver,
  SHORT_TOUR,
  stateAt,
} from "./playScript";

const TOPS: Record<"desktop" | "mobile", Record<SectionId, number>> = {
  desktop: { hero: 0, proof: 1000, how: 2000, "faq-about": 3000, areas: 4000, footer: 4500 },
  mobile: { hero: 0, proof: 3000, how: 6000, "faq-about": 9000, areas: 12000, footer: 13000 },
};

const resolve: ScrollResolver = (device, target) => (target === "top" ? 0 : TOPS[device][target]);

function startOf(script: PlayScript, index: number): number {
  return script.steps.slice(0, index).reduce((total, step) => total + step.ms, 0);
}

describe("stateAt", () => {
  it("starts on desktop at the top with the frame all before", () => {
    expect(stateAt(FULL_TOUR, 0, resolve)).toEqual({
      device: "desktop",
      divider: 1,
      scrollTop: 0,
      target: "top",
      stepIndex: 0,
    });
  });

  it("is halfway through the opening sweep at 800ms", () => {
    expect(stateAt(FULL_TOUR, 800, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("settles the divider in the middle once the opening sweep ends", () => {
    expect(stateAt(FULL_TOUR, 2400, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("glides to the social proof group on the current device", () => {
    expect(stateAt(FULL_TOUR, 3000, resolve).scrollTop).toBeCloseTo(500, 6);
    expect(stateAt(FULL_TOUR, 3600, resolve)).toMatchObject({ scrollTop: 1000, target: "proof" });
  });

  it("swings the divider to its via point halfway through a hold", () => {
    expect(stateAt(FULL_TOUR, 4800, resolve).divider).toBeCloseTo(0.25, 6);
  });

  it("brings the divider back to where the hold began", () => {
    expect(stateAt(FULL_TOUR, 6000, resolve).divider).toBeCloseTo(0.5, 6);
  });

  it("switches device as soon as the device step begins and keeps the scroll target", () => {
    const deviceStep = FULL_TOUR.steps.findIndex((step) => step.kind === "device");
    expect(stateAt(FULL_TOUR, startOf(FULL_TOUR, deviceStep) + 1, resolve)).toMatchObject({
      device: "mobile",
      target: "top",
      scrollTop: 0,
    });
  });

  it("ends on desktop at the top with the divider in the middle", () => {
    const end = stateAt(FULL_TOUR, durationOf(FULL_TOUR), resolve);
    expect(end).toMatchObject({
      device: "desktop",
      scrollTop: 0,
      target: "top",
      stepIndex: FULL_TOUR.steps.length,
    });
    expect(end.divider).toBeCloseTo(0.5, 6);
  });

  it("holds the end state once the script has finished", () => {
    const end = stateAt(FULL_TOUR, durationOf(FULL_TOUR), resolve);
    expect(stateAt(FULL_TOUR, durationOf(FULL_TOUR) + 5000, resolve)).toEqual(end);
  });

  it("cuts straight to the end of the current step", () => {
    expect(stateAt(FULL_TOUR, 100, resolve, true).divider).toBe(0);
  });

  it("offers a short cut under 20 seconds that ends where the full tour ends", () => {
    expect(durationOf(SHORT_TOUR)).toBeLessThan(20_000);
    expect(durationOf(SHORT_TOUR)).toBeLessThan(durationOf(FULL_TOUR));
    const end = stateAt(SHORT_TOUR, durationOf(SHORT_TOUR), resolve);
    expect(end).toMatchObject({ device: "desktop", scrollTop: 0 });
    expect(end.divider).toBeCloseTo(0.5, 6);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm test src/lib/playScript.test.ts`
Expected: FAIL, `Failed to resolve import "./playScript"`.

- [ ] **Step 3: Implement the play script**

`src/lib/playScript.ts`:
```ts
import type { Device, SectionId } from "../data/types";
import { easeInOutCubic, lerp } from "./math";

export type ScrollTarget = SectionId | "top";

export type PlayStep =
  | { kind: "divider"; to: number; ms: number }
  | { kind: "glide"; to: ScrollTarget; ms: number }
  | { kind: "hold"; via: number; ms: number }
  | { kind: "device"; to: Device; ms: number };

export type PlayScript = {
  start: { device: Device; divider: number };
  steps: readonly PlayStep[];
};

export type PlayState = {
  device: Device;
  divider: number;
  scrollTop: number;
  target: ScrollTarget;
  stepIndex: number;
};

export type ScrollResolver = (device: Device, target: ScrollTarget) => number;

function tour(stops: readonly SectionId[]): PlayStep[] {
  return stops.flatMap((stop): PlayStep[] => [
    { kind: "glide", to: stop, ms: 1200 },
    { kind: "hold", via: 0.25, ms: 2400 },
  ]);
}

const OPENING_SWEEP: PlayStep[] = [
  { kind: "divider", to: 0, ms: 1600 },
  { kind: "divider", to: 0.5, ms: 800 },
];

const MOBILE_SWEEP: PlayStep[] = [
  { kind: "glide", to: "top", ms: 1200 },
  { kind: "device", to: "mobile", ms: 800 },
  { kind: "divider", to: 1, ms: 600 },
  { kind: "divider", to: 0, ms: 1200 },
  { kind: "divider", to: 0.5, ms: 600 },
];

export const FULL_TOUR: PlayScript = {
  start: { device: "desktop", divider: 1 },
  steps: [
    ...OPENING_SWEEP,
    ...tour(["proof", "how", "faq-about", "areas", "footer"]),
    ...MOBILE_SWEEP,
    ...tour(["proof", "how"]),
    { kind: "glide", to: "top", ms: 1200 },
    { kind: "device", to: "desktop", ms: 800 },
  ],
};

export const SHORT_TOUR: PlayScript = {
  start: { device: "desktop", divider: 1 },
  steps: [
    ...OPENING_SWEEP,
    ...tour(["proof", "how"]),
    ...MOBILE_SWEEP,
    { kind: "device", to: "desktop", ms: 800 },
  ],
};

export function durationOf(script: PlayScript): number {
  return script.steps.reduce((total, step) => total + step.ms, 0);
}

function applyStep(
  state: PlayState,
  step: PlayStep,
  progress: number,
  resolve: ScrollResolver,
  stepIndex: number,
): PlayState {
  switch (step.kind) {
    case "divider":
      return { ...state, stepIndex, divider: lerp(state.divider, step.to, easeInOutCubic(progress)) };
    case "glide":
      return {
        ...state,
        stepIndex,
        target: step.to,
        scrollTop: lerp(state.scrollTop, resolve(state.device, step.to), easeInOutCubic(progress)),
      };
    case "hold":
      return {
        ...state,
        stepIndex,
        divider: lerp(state.divider, step.via, (1 - Math.cos(2 * Math.PI * progress)) / 2),
      };
    case "device":
      return { ...state, stepIndex, device: step.to, scrollTop: resolve(step.to, state.target) };
  }
}

export function stateAt(
  script: PlayScript,
  elapsedMs: number,
  resolve: ScrollResolver,
  cut = false,
): PlayState {
  let state: PlayState = {
    device: script.start.device,
    divider: script.start.divider,
    scrollTop: resolve(script.start.device, "top"),
    target: "top",
    stepIndex: 0,
  };
  let remaining = Math.max(0, elapsedMs);
  for (const [index, step] of script.steps.entries()) {
    const finished = remaining >= step.ms;
    state = applyStep(state, step, finished || cut ? 1 : remaining / step.ms, resolve, index);
    if (!finished) return state;
    remaining -= step.ms;
  }
  return { ...state, stepIndex: script.steps.length };
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `pnpm test src/lib/playScript.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Write the failing URL-option and divider-key tests**

`src/lib/urlOptions.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseUrlOptions } from "./urlOptions";

describe("parseUrlOptions", () => {
  it("defaults to the full tour with no recording", () => {
    expect(parseUrlOptions("")).toEqual({ record: null, tour: "full" });
  });

  it("reads the 16:9 recording mode", () => {
    expect(parseUrlOptions("?record=16x9")).toEqual({ record: "16x9", tour: "full" });
  });

  it("reads the 4:3 recording mode with the short tour", () => {
    expect(parseUrlOptions("?record=4x3&tour=short")).toEqual({ record: "4x3", tour: "short" });
  });

  it("ignores an aspect it does not know", () => {
    expect(parseUrlOptions("?record=21x9")).toEqual({ record: null, tour: "full" });
    expect(parseUrlOptions("?record")).toEqual({ record: null, tour: "full" });
  });
});
```

`src/lib/dividerKeys.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { nextDividerValue } from "./dividerKeys";

describe("nextDividerValue", () => {
  it("steps 5% with the arrow keys", () => {
    expect(nextDividerValue(0.5, "ArrowRight", false)).toBeCloseTo(0.55, 6);
    expect(nextDividerValue(0.5, "ArrowLeft", false)).toBeCloseTo(0.45, 6);
    expect(nextDividerValue(0.5, "ArrowUp", false)).toBeCloseTo(0.55, 6);
    expect(nextDividerValue(0.5, "ArrowDown", false)).toBeCloseTo(0.45, 6);
  });

  it("steps 20% with Shift held", () => {
    expect(nextDividerValue(0.5, "ArrowRight", true)).toBeCloseTo(0.7, 6);
    expect(nextDividerValue(0.5, "ArrowLeft", true)).toBeCloseTo(0.3, 6);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextDividerValue(0.5, "Home", false)).toBe(0);
    expect(nextDividerValue(0.5, "End", false)).toBe(1);
  });

  it("stays between 0 and 1", () => {
    expect(nextDividerValue(0.98, "ArrowRight", false)).toBe(1);
    expect(nextDividerValue(0.1, "ArrowLeft", true)).toBe(0);
  });

  it("ignores other keys", () => {
    expect(nextDividerValue(0.5, "a", false)).toBeNull();
    expect(nextDividerValue(0.5, "Enter", false)).toBeNull();
  });
});
```

- [ ] **Step 6: Run them to see them fail**

Run: `pnpm test src/lib/urlOptions.test.ts src/lib/dividerKeys.test.ts`
Expected: FAIL, both imports unresolved.

- [ ] **Step 7: Implement both**

`src/lib/urlOptions.ts`:
```ts
export type RecordAspect = "16x9" | "4x3";

export type UrlOptions = { record: RecordAspect | null; tour: "full" | "short" };

export function parseUrlOptions(search: string): UrlOptions {
  const params = new URLSearchParams(search);
  const record = params.get("record");
  return {
    record: record === "16x9" || record === "4x3" ? record : null,
    tour: params.get("tour") === "short" ? "short" : "full",
  };
}
```

`src/lib/dividerKeys.ts`:
```ts
import { clamp } from "./math";

export function nextDividerValue(current: number, key: string, shift: boolean): number | null {
  const step = shift ? 0.2 : 0.05;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(current + step, 0, 1);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(current - step, 0, 1);
    case "Home":
      return 0;
    case "End":
      return 1;
    default:
      return null;
  }
}
```

- [ ] **Step 8: Run the whole suite**

Run: `pnpm test`
Expected: PASS, 35 tests across 5 files.

- [ ] **Step 9: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Script the Play tour and read the recording options from the URL" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Capture helpers

**Files:**
- Create: `capture/stitch.ts`, `capture/stitch.test.ts`, `capture/loopPlan.ts`, `capture/loopPlan.test.ts`, `capture/literal.ts`, `capture/literal.test.ts`, `capture/pixels.ts`, `capture/pixels.test.ts`

**Interfaces:**
- Consumes: `PaletteGroup` (Task 2).
- Produces:
  - `type Band = { top: number; height: number }`; `tileBands(pageHeight, tileHeight): Band[]`; `type ViewportStop = { scrollY: number; sliceTop: number; sliceHeight: number; pageTop: number }`; `viewportStops(pageHeight, viewportHeight): ViewportStop[]` (`capture/stitch.ts`).
  - `type LoopPlan = { length: number; rates: number[] }`; `cyclesWithin(period, length, maxStretch): number | null`; `planLoop(periods, basePeriod, maxStretch = 0.05, maxMultiple = 6): LoopPlan` (`capture/loopPlan.ts`). All times are in seconds.
  - `extractObjectLiteral(source: string, name: string): unknown`; `paletteGroups(colors: unknown): PaletteGroup[]` (`capture/literal.ts`).
  - `meanAbsoluteDifference(a: Uint8Array, b: Uint8Array): number` (`capture/pixels.ts`).

Tiles are stitched from viewport-sized screenshots rather than one tall screenshot. That keeps the page laid out at its real 900px viewport, which matters because the v2 hero is sized `100vh − 96px`.

- [ ] **Step 1: Write the failing tests**

`capture/stitch.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { tileBands, viewportStops } from "./stitch";

describe("tileBands", () => {
  it("cuts a page into bands, the last one shorter", () => {
    expect(tileBands(4500, 2000)).toEqual([
      { top: 0, height: 2000 },
      { top: 2000, height: 2000 },
      { top: 4000, height: 500 },
    ]);
  });
});

describe("viewportStops", () => {
  it("covers the page exactly once without scrolling past the end", () => {
    const stops = viewportStops(2000, 900);
    expect(stops).toEqual([
      { scrollY: 0, sliceTop: 0, sliceHeight: 900, pageTop: 0 },
      { scrollY: 900, sliceTop: 0, sliceHeight: 900, pageTop: 900 },
      { scrollY: 1100, sliceTop: 700, sliceHeight: 200, pageTop: 1800 },
    ]);
    const covered = stops.reduce((total, stop) => total + stop.sliceHeight, 0);
    expect(covered).toBe(2000);
  });

  it("takes a single stop for a page shorter than the viewport", () => {
    expect(viewportStops(600, 900)).toEqual([
      { scrollY: 0, sliceTop: 0, sliceHeight: 600, pageTop: 0 },
    ]);
  });
});
```

`capture/loopPlan.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cyclesWithin, planLoop } from "./loopPlan";

describe("cyclesWithin", () => {
  it("counts whole cycles that fit within the allowed stretch", () => {
    expect(cyclesWithin(2, 10.2, 0.05)).toBe(5);
    expect(cyclesWithin(10.2, 10.2, 0.05)).toBe(1);
  });

  it("refuses a period that would need stretching too far", () => {
    expect(cyclesWithin(2.6, 7, 0.05)).toBeNull();
  });
});

describe("planLoop", () => {
  it("keeps the hero reel's 10.2s and slows its 2s pulse a little", () => {
    const plan = planLoop([10.2, 2], 10.2);
    expect(plan.length).toBeCloseTo(10.2, 9);
    expect(plan.rates[0]).toBeCloseTo(1, 9);
    expect(plan.rates[1]).toBeCloseTo(10 / 10.2, 9);
  });

  it("grows the loop until every animation completes whole cycles", () => {
    const plan = planLoop([7, 2.6, 0.95], 7);
    expect(plan.length).toBeCloseTo(21, 9);
    expect(plan.rates[0]).toBeCloseTo(1, 9);
    expect(plan.rates[1]).toBeCloseTo((8 * 2.6) / 21, 9);
    expect(plan.rates[2]).toBeCloseTo((22 * 0.95) / 21, 9);
  });

  it("gives up loudly when no loop fits", () => {
    expect(() => planLoop([7, 3.3], 7, 0.05, 4)).toThrow("No seamless loop");
  });
});
```

`capture/literal.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { extractObjectLiteral, paletteGroups } from "./literal";

const SOURCE = `
import { x } from "./y";
/** The brand blues. {not a brace that counts} */
export const COLORS = {
  blue: { DEFAULT: "#005eb8", dark: "#002f5c" }, // a trailing } in a comment
  green: "#007f3b",
  grey: { 1: "#4c6272", 2: "#768692" },
} as const;
export const OTHER = { a: "b" };
`;

describe("extractObjectLiteral", () => {
  it("reads an exported object literal, skipping comments", () => {
    expect(extractObjectLiteral(SOURCE, "COLORS")).toEqual({
      blue: { DEFAULT: "#005eb8", dark: "#002f5c" },
      green: "#007f3b",
      grey: { 1: "#4c6272", 2: "#768692" },
    });
  });

  it("throws for a name that is not declared", () => {
    expect(() => extractObjectLiteral(SOURCE, "MISSING")).toThrow("MISSING is not declared");
  });
});

describe("paletteGroups", () => {
  it("flattens a palette into named groups of swatches", () => {
    expect(paletteGroups(extractObjectLiteral(SOURCE, "COLORS"))).toEqual([
      {
        name: "blue",
        swatches: [
          { name: "blue", hex: "#005EB8" },
          { name: "blue-dark", hex: "#002F5C" },
        ],
      },
      { name: "green", swatches: [{ name: "green", hex: "#007F3B" }] },
      {
        name: "grey",
        swatches: [
          { name: "grey-1", hex: "#4C6272" },
          { name: "grey-2", hex: "#768692" },
        ],
      },
    ]);
  });

  it("rejects values that are not colours", () => {
    expect(() => paletteGroups({ blue: 3 })).toThrow("blue is neither a colour nor a set of colours");
  });
});
```

`capture/pixels.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { meanAbsoluteDifference } from "./pixels";

describe("meanAbsoluteDifference", () => {
  it("is 0 for identical images", () => {
    const image = Uint8Array.from([10, 20, 30, 40]);
    expect(meanAbsoluteDifference(image, image.slice())).toBe(0);
  });

  it("averages the per-byte difference", () => {
    expect(meanAbsoluteDifference(Uint8Array.from([0, 10]), Uint8Array.from([4, 4]))).toBe(5);
  });

  it("refuses images of different sizes", () => {
    expect(() => meanAbsoluteDifference(new Uint8Array(4), new Uint8Array(8))).toThrow(
      "Images differ in size",
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm test capture`
Expected: FAIL, four unresolved imports.

- [ ] **Step 3: Implement the helpers**

`capture/stitch.ts`:
```ts
export type Band = { top: number; height: number };

export type ViewportStop = { scrollY: number; sliceTop: number; sliceHeight: number; pageTop: number };

export function tileBands(pageHeight: number, tileHeight: number): Band[] {
  const bands: Band[] = [];
  for (let top = 0; top < pageHeight; top += tileHeight) {
    bands.push({ top, height: Math.min(tileHeight, pageHeight - top) });
  }
  return bands;
}

export function viewportStops(pageHeight: number, viewportHeight: number): ViewportStop[] {
  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  const stops: ViewportStop[] = [];
  for (let pageTop = 0; pageTop < pageHeight; pageTop += viewportHeight) {
    const scrollY = Math.min(pageTop, maxScroll);
    const sliceTop = pageTop - scrollY;
    stops.push({
      scrollY,
      sliceTop,
      sliceHeight: Math.min(viewportHeight - sliceTop, pageHeight - pageTop),
      pageTop,
    });
  }
  return stops;
}
```

`capture/loopPlan.ts`:
```ts
export type LoopPlan = { length: number; rates: number[] };

export function cyclesWithin(period: number, length: number, maxStretch: number): number | null {
  const cycles = Math.max(1, Math.round(length / period));
  const stretch = Math.abs(length / cycles - period) / period;
  return stretch <= maxStretch ? cycles : null;
}

export function planLoop(
  periods: readonly number[],
  basePeriod: number,
  maxStretch = 0.05,
  maxMultiple = 6,
): LoopPlan {
  for (let multiple = 1; multiple <= maxMultiple; multiple++) {
    const length = basePeriod * multiple;
    const cycles = periods.map((period) => cyclesWithin(period, length, maxStretch));
    if (cycles.every((count) => count !== null)) {
      return {
        length,
        rates: periods.map((period, index) => ((cycles[index] ?? 1) * period) / length),
      };
    }
  }
  throw new Error(
    `No seamless loop within ${maxMultiple} × ${basePeriod}s for periods ${periods.join(", ")}s`,
  );
}
```

`capture/literal.ts`:
```ts
import type { PaletteGroup } from "../src/data/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractObjectLiteral(source: string, name: string): unknown {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const declaration = code.indexOf(`export const ${name} =`);
  if (declaration === -1) throw new Error(`${name} is not declared`);
  const open = code.indexOf("{", declaration);
  let depth = 0;
  for (let index = open; index < code.length; index++) {
    if (code[index] === "{") depth++;
    if (code[index] === "}") {
      depth--;
      if (depth === 0) return new Function(`return (${code.slice(open, index + 1)});`)();
    }
  }
  throw new Error(`${name} is never closed`);
}

export function paletteGroups(colors: unknown): PaletteGroup[] {
  if (!isRecord(colors)) throw new Error("A palette must be an object");
  return Object.entries(colors).map(([name, value]) => {
    if (typeof value === "string") return { name, swatches: [{ name, hex: value.toUpperCase() }] };
    if (!isRecord(value)) throw new Error(`${name} is neither a colour nor a set of colours`);
    return {
      name,
      swatches: Object.entries(value).map(([step, hex]) => {
        if (typeof hex !== "string") throw new Error(`${name}.${step} is not a colour`);
        return { name: step === "DEFAULT" ? name : `${name}-${step}`, hex: hex.toUpperCase() };
      }),
    };
  });
}
```

`capture/pixels.ts`:
```ts
export function meanAbsoluteDifference(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) throw new Error(`Images differ in size: ${a.length} vs ${b.length} bytes`);
  if (a.length === 0) return 0;
  let total = 0;
  for (let index = 0; index < a.length; index++) total += Math.abs(a[index] - b[index]);
  return total / a.length;
}
```

- [ ] **Step 4: Run the whole suite**

Run: `pnpm test`
Expected: PASS, 50 tests across 9 files.

- [ ] **Step 5: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Add the capture helpers: stitching, seamless loop planning, palette reading" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Build and serve both pinned commits

**Files:**
- Create: `capture/paths.ts`, `capture/builds.ts`, `capture/serve.ts`, `capture/clean.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `Version` (Task 2).
- Produces:
  - `ROOT`, `PUBLIC_DIR`, `DATA_FILE`, `WORK_DIR`, `captureDir(version, device): string`, `publicPath(file): string` (`capture/paths.ts`).
  - `type BuildSpec = { version: Version; commit: string; port: number }`, `type PreparedBuild = BuildSpec & { dir: string; fullCommit: string }`, `type ServedBuild = PreparedBuild & { url: string; stop: () => Promise<void> }`, `BUILDS`, `SANNY_REPO`, `prepareBuild(spec): PreparedBuild`, `serveBuild(build): Promise<ServedBuild>` (`capture/builds.ts`).

Each commit is exported with `git archive` into `WORK_DIR/<version>` (default `<os tmp>/bookable-before-after`, override with `CAPTURE_WORK_DIR`), so sanny's working tree and git metadata are never written. A build is reused while its commit is unchanged; `pnpm capture:clean` deletes them.

- [ ] **Step 1: Write the paths module**

`capture/paths.ts`:
```ts
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Device, Version } from "../src/data/types";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const PUBLIC_DIR = join(ROOT, "public");
export const DATA_FILE = join(ROOT, "src/data/captures.json");
export const WORK_DIR = process.env.CAPTURE_WORK_DIR ?? join(tmpdir(), "bookable-before-after");

export function captureDir(version: Version, device: Device): string {
  return join(PUBLIC_DIR, "captures", version, device);
}

export function publicPath(file: string): string {
  return relative(PUBLIC_DIR, file).split(sep).join("/");
}
```

- [ ] **Step 2: Write the builds module**

`capture/builds.ts`:
```ts
import { type ChildProcess, execFileSync, execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Version } from "../src/data/types";
import { WORK_DIR } from "./paths";

export type BuildSpec = { version: Version; commit: string; port: number };
export type PreparedBuild = BuildSpec & { dir: string; fullCommit: string };
export type ServedBuild = PreparedBuild & { url: string; stop: () => Promise<void> };

export const BUILDS: readonly BuildSpec[] = [
  { version: "before", commit: "0a143c6820", port: 3061 },
  { version: "after", commit: "c016453be7", port: 3062 },
];

export const SANNY_REPO = process.env.SANNY_REPO ?? join(homedir(), "Desktop/repos/sanny");

const PRODUCTION_API = "https://api.ht1.uk/v2";
const WEGLOT_KEY = "NEXT_PUBLIC_WEGLOT_API_KEY_BOOKABLE";

function run(command: string, args: readonly string[], cwd: string) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" },
  });
}

function weglotLine(): string | null {
  const envFile = join(SANNY_REPO, "packages/bookable/.env.local");
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, "utf8")
    .split("\n")
    .find((entry) => entry.startsWith(`${WEGLOT_KEY}=`));
  return line ?? null;
}

export function prepareBuild(spec: BuildSpec): PreparedBuild {
  const fullCommit = execFileSync("git", ["-C", SANNY_REPO, "rev-parse", `${spec.commit}^{commit}`], {
    encoding: "utf8",
  }).trim();
  const dir = join(WORK_DIR, spec.version);
  const marker = join(dir, ".capture-commit");
  const built = existsSync(join(dir, "packages/bookable/.next/BUILD_ID"));
  if (built && existsSync(marker) && readFileSync(marker, "utf8").trim() === fullCommit) {
    console.log(`Reusing the ${spec.version} build at ${dir}`);
    return { ...spec, dir, fullCommit };
  }

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execSync(`git -C ${JSON.stringify(SANNY_REPO)} archive ${fullCommit} | tar -x -C ${JSON.stringify(dir)}`, {
    stdio: "inherit",
  });
  run("pnpm", ["install", "--frozen-lockfile", "--filter", "bookable..."], dir);
  run("pnpm", ["--filter", "bookable^...", "run", "build"], dir);
  const env = [`NEXT_PUBLIC_WEBAPI_BASE_URL=${PRODUCTION_API}`, weglotLine()].filter(
    (line): line is string => line !== null,
  );
  writeFileSync(join(dir, "packages/bookable/.env.local"), `${env.join("\n")}\n`);
  run("pnpm", ["--filter", "bookable", "run", "build"], dir);
  writeFileSync(marker, `${fullCommit}\n`);
  return { ...spec, dir, fullCommit };
}

async function answers(url: string): Promise<boolean> {
  return fetch(url).then(
    (response) => response.ok,
    () => false,
  );
}

async function waitForHttp(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await answers(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${url} did not answer within ${timeoutMs / 1000}s`);
}

function stopProcess(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.pid === undefined) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    process.kill(-child.pid, "SIGTERM");
  });
}

export async function serveBuild(build: PreparedBuild): Promise<ServedBuild> {
  const url = `http://localhost:${build.port}`;
  if (await answers(url)) {
    throw new Error(`Something already answers on ${url}; stop it before capturing`);
  }
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(build.port)], {
    cwd: join(build.dir, "packages/bookable"),
    stdio: ["ignore", "inherit", "inherit"],
    detached: true,
  });
  try {
    await waitForHttp(url, 90_000);
  } catch (error) {
    await stopProcess(child);
    throw error;
  }
  return { ...build, url, stop: () => stopProcess(child) };
}
```

- [ ] **Step 3: Write the serve and clean entry points**

`capture/serve.ts`:
```ts
import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";

async function main() {
  const served: ServedBuild[] = [];
  const stopAll = () => Promise.all(served.map((build) => build.stop()));
  process.once("SIGINT", () => {
    void stopAll().then(() => process.exit(130));
  });
  for (const build of BUILDS.map(prepareBuild)) served.push(await serveBuild(build));
  for (const build of served) {
    console.log(`${build.version} (${build.fullCommit.slice(0, 10)}): ${build.url}`);
  }
  console.log("Serving both builds. Press Ctrl+C to stop.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

`capture/clean.ts`:
```ts
import { rmSync } from "node:fs";
import { WORK_DIR } from "./paths";

rmSync(WORK_DIR, { recursive: true, force: true });
console.log(`Removed ${WORK_DIR}`);
```

Add to `package.json` `scripts`:
```json
"capture:serve": "tsx capture/serve.ts",
"capture:clean": "tsx capture/clean.ts"
```

- [ ] **Step 4: Run the builds and check both servers**

Run in a second terminal: `pnpm capture:serve`
Expected, after several minutes on the first run: `before (0a143c6820): http://localhost:3061`, `after (c016453be7): http://localhost:3062`, then `Serving both builds.`

Then run:
```bash
curl -s http://localhost:3061 | grep -o "Common questions about finding an NHS GP in England" | head -1
curl -s http://localhost:3062 | grep -o "Questions before you start" | head -1
curl -s http://localhost:3061 | grep -c "Questions before you start"
```
Expected: the first two print their phrase; the third prints `0`. Stop the servers with Ctrl+C.

If something fails:
- **`pnpm install` fails on a private package:** check that `~/.npmrc` carries the same registry auth that sanny's own install uses.
- **`next build` fails for one commit:**
  - If the error names a missing environment variable, add it to the `.env.local` that `prepareBuild` writes.
  - Otherwise, fall back to dev mode for that build, as the spec's risk table allows. Make `serveBuild` spawn `next dev -p <port>` for that version, and add `nextjs-portal` to `HIDDEN_SELECTORS` in Task 6. Record the fallback in the README.

- [ ] **Step 5: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Build and serve the two pinned Bookable commits for capture" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Capture tiles, sections, header states, tokens and the specimen

**Files:**
- Create: `capture/profiles.ts`, `capture/sections.ts`, `capture/sections.test.ts`, `capture/inPage.ts`, `capture/shoot.ts`, `capture/capture.ts`
- Modify: `package.json` (scripts)
- Generated: `public/captures/**`, `src/data/captures.json`

**Interfaces:**
- Consumes: Tasks 2, 4 and 5.
- Produces:
  - `type DeviceProfile`, `DEVICE_PROFILES`, `SCALE = 2`, `TILE_HEIGHT = 2000`, `FPS = 30`, `SOCS_REJECTED` (`capture/profiles.ts`).
  - `type SectionAnchor`, `SECTION_ANCHORS`, `anchorList(version)`, `assertSections(found): SectionTop[]` (`capture/sections.ts`).
  - In-page functions: `settleInPage`, `pauseInfiniteAnimationsInPage`, `scrollInPage(top)`, `sectionTopsInPage(anchors)`, `markStickyHeaderInPage()`, `floatingElementsInPage()`, `measureTokensInPage(selectors)`, `headerPaintAtInPage(top)`, `headerBlurInPage()`, `addSpecimenInPage()`, `type TokenSelectors` (`capture/inPage.ts`).
  - `type RawImage = { data: Buffer; info: { width: number; height: number; channels: 1 | 2 | 3 | 4 } }`, `type PageJob`, `capturePage(browser, job): Promise<Capture>` (`capture/shoot.ts`).
  - `src/data/captures.json` matching `CapturesFile`, with `loops: []` until Task 7.

In-page functions run inside the captured page through `page.evaluate`, so each must be self-contained: no imported values, only imported types.

- [ ] **Step 1: Write the failing section-validation test**

`capture/sections.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { assertSections } from "./sections";

const VALID = [
  { id: "hero", top: 0 },
  { id: "proof", top: 804 },
  { id: "how", top: 2100 },
  { id: "faq-about", top: 3300 },
  { id: "areas", top: 5200 },
  { id: "footer", top: 5800 },
];

describe("assertSections", () => {
  it("passes six ascending groups in order", () => {
    expect(assertSections(VALID)).toEqual(VALID);
  });

  it("rejects groups out of order", () => {
    const swapped = [VALID[0], VALID[2], VALID[1], ...VALID.slice(3)];
    expect(() => assertSections(swapped)).toThrow("Sections came back as hero,how,proof");
  });

  it("rejects a group that does not start below the one before", () => {
    const flat = VALID.map((section, index) => (index === 2 ? { ...section, top: 804 } : section));
    expect(() => assertSections(flat)).toThrow("how starts at 804px, not below proof at 804px");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm test capture/sections.test.ts`
Expected: FAIL, `Failed to resolve import "./sections"`.

- [ ] **Step 3: Write the profiles and section anchors**

`capture/profiles.ts`:
```ts
import type { Device } from "../src/data/types";

export type DeviceProfile = {
  device: Device;
  viewport: { width: number; height: number };
  isMobile: boolean;
  hasTouch: boolean;
  userAgent: string | undefined;
};

export const SCALE = 2;
export const TILE_HEIGHT = 2000;
export const FPS = 30;

export const SOCS_REJECTED = JSON.stringify(JSON.stringify({ status: "rejected" }));

export const DEVICE_PROFILES: Record<Device, DeviceProfile> = {
  desktop: {
    device: "desktop",
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
    userAgent: undefined,
  },
  mobile: {
    device: "mobile",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  },
};
```

Bookable stores the cookie choice under `SOCS`, encoded twice (its hook stringifies, then usehooks-ts stringifies again), so `SOCS_REJECTED` is stringified twice.

`capture/sections.ts`:
```ts
import { SECTION_IDS } from "../src/data/sections";
import type { SectionId, SectionTop, Version } from "../src/data/types";

export type SectionAnchor =
  | { kind: "page-top" }
  | { kind: "main-child"; index: number }
  | { kind: "main-child-with-heading"; text: string }
  | { kind: "footer-after-main" };

export const SECTION_ANCHORS: Record<Version, Record<SectionId, SectionAnchor>> = {
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
  return SECTION_IDS.map((id) => [id, SECTION_ANCHORS[version][id]]);
}

export function assertSections(found: readonly { id: string; top: number }[]): SectionTop[] {
  const ids = found.map((section) => section.id).join(",");
  if (ids !== SECTION_IDS.join(",")) throw new Error(`Sections came back as ${ids}`);
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
```

The before page's stats block has no heading, so it is found as `<main>`'s second child; every other group is found by its heading.

- [ ] **Step 4: Run it to see it pass**

Run: `pnpm test capture/sections.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the in-page functions**

`capture/inPage.ts`:
```ts
import type { MeasuredTokens } from "../src/data/types";
import type { SectionAnchor } from "./sections";

export type TokenSelectors = { headline: string; heroGround: string; search: string; card: string };

export async function settleInPage(): Promise<void> {
  await document.fonts.ready;
  const step = Math.max(200, Math.round(window.innerHeight * 0.6));
  for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
    window.scrollTo({ top, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  await Promise.all(
    Array.from(document.images, (image) =>
      image.complete
        ? undefined
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
    ),
  );
  for (const animation of document.getAnimations()) {
    if (animation.effect?.getComputedTiming().iterations !== Infinity) animation.finish();
  }
}

export async function pauseInfiniteAnimationsInPage(): Promise<void> {
  const infinite = () =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations === Infinity);
  const waiting = () =>
    infinite().some(
      (animation) =>
        Number(animation.currentTime ?? 0) < Number(animation.effect?.getComputedTiming().delay ?? 0),
    );
  const deadline = performance.now() + 20_000;
  while (waiting()) {
    if (performance.now() > deadline) throw new Error("Animations were still in their delays after 20s");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  for (const animation of infinite()) animation.pause();
}

export async function scrollInPage(top: number): Promise<void> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export function sectionTopsInPage(anchors: [string, SectionAnchor][]): { id: string; top: number }[] {
  const main = document.querySelector("main");
  if (!main) throw new Error("The page has no <main>");
  const children = Array.from(main.children);
  const pageTop = (element: Element) =>
    Math.round(element.getBoundingClientRect().top + window.scrollY);
  const textOf = (element: Element) => (element.textContent ?? "").replace(/\s+/g, " ").trim();
  return anchors.map(([id, anchor]) => {
    switch (anchor.kind) {
      case "page-top":
        return { id, top: 0 };
      case "main-child": {
        const child = children[anchor.index - 1];
        if (!child) throw new Error(`${id}: <main> has no child ${anchor.index}`);
        return { id, top: pageTop(child) };
      }
      case "main-child-with-heading": {
        const matches = children.filter((child) =>
          Array.from(child.querySelectorAll("h1, h2, h3")).some(
            (heading) => textOf(heading) === anchor.text,
          ),
        );
        if (matches.length !== 1) {
          throw new Error(`${id}: ${matches.length} children of <main> have the heading "${anchor.text}"`);
        }
        return { id, top: pageTop(matches[0]) };
      }
      case "footer-after-main": {
        const footer = Array.from(document.querySelectorAll("footer")).find(
          (candidate) =>
            !main.contains(candidate) &&
            Boolean(main.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
        );
        if (!footer) throw new Error(`${id}: no <footer> follows <main>`);
        return { id, top: pageTop(footer) };
      }
    }
  });
}

export function markStickyHeaderInPage(): boolean {
  const header = document.querySelector("header");
  if (!header) throw new Error("The page has no <header>");
  const position = getComputedStyle(header).position;
  if (position !== "sticky" && position !== "fixed") return false;
  header.setAttribute("data-capture-hidden", "");
  return true;
}

export function floatingElementsInPage(): string[] {
  const describe = (element: Element) => {
    const classes =
      typeof element.className === "string" && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
        : "";
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes}`;
  };
  return Array.from(document.querySelectorAll("body *"))
    .filter((element) => {
      if (element.closest("[data-capture-hidden]")) return false;
      const style = getComputedStyle(element);
      if (style.position !== "fixed" && style.position !== "sticky") return false;
      const box = element.getBoundingClientRect();
      const onScreen =
        box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth;
      return (
        onScreen &&
        box.width > 0 &&
        box.height > 0 &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0
      );
    })
    .map(describe);
}

export function measureTokensInPage(selectors: TokenSelectors): MeasuredTokens {
  const styleOf = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Nothing on the page matches ${selector}`);
    return getComputedStyle(element);
  };
  const headline = styleOf(selectors.headline);
  const hero = styleOf(selectors.heroGround);
  const search = styleOf(selectors.search);
  const card = styleOf(selectors.card);
  return {
    headline: {
      fontFamily: headline.fontFamily,
      fontSize: headline.fontSize,
      lineHeight: headline.lineHeight,
      letterSpacing: headline.letterSpacing,
      fontWeight: headline.fontWeight,
    },
    heroGround: hero.backgroundImage !== "none" ? hero.backgroundImage : hero.backgroundColor,
    search: { borderRadius: search.borderRadius, boxShadow: search.boxShadow },
    card: { borderRadius: card.borderRadius, boxShadow: card.boxShadow },
  };
}

export async function headerPaintAtInPage(top: number): Promise<string> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => setTimeout(resolve, 400));
  const header = document.querySelector("header");
  if (!header) throw new Error("The page has no <header>");
  const style = getComputedStyle(header);
  return `${style.backgroundColor}|${style.borderBottomColor}|${style.backdropFilter}`;
}

export function headerBlurInPage(): number | null {
  const header = document.querySelector("header");
  if (!header) return null;
  const match = /blur\(([\d.]+)px\)/.exec(getComputedStyle(header).backdropFilter);
  return match ? Number(match[1]) : null;
}

export async function addSpecimenInPage(): Promise<void> {
  const specimen = document.createElement("div");
  specimen.id = "capture-specimen";
  specimen.style.cssText =
    "position:absolute;left:0;top:0;padding:12px 20px;font-family:var(--font-frutiger);color:#F0F4F5;white-space:nowrap";
  specimen.innerHTML = [
    '<div style="font-size:96px;line-height:1;font-weight:400">Aa</div>',
    '<div style="margin-top:16px;font-size:28px;line-height:1.25;font-weight:400">Register and book with an NHS GP</div>',
    '<div style="font-size:28px;line-height:1.25;font-weight:600">Register and book with an NHS GP</div>',
  ].join("");
  document.body.append(specimen);
  window.scrollTo({ top: 0, behavior: "instant" });
  await document.fonts.ready;
}
```

- [ ] **Step 6: Write the page shooter**

`capture/shoot.ts`:
```ts
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import sharp, { type OverlayOptions } from "sharp";
import type { Capture, Loop, StickyHeader, Tile, Version } from "../src/data/types";
import {
  addSpecimenInPage,
  floatingElementsInPage,
  headerBlurInPage,
  headerPaintAtInPage,
  markStickyHeaderInPage,
  measureTokensInPage,
  pauseInfiniteAnimationsInPage,
  scrollInPage,
  sectionTopsInPage,
  settleInPage,
  type TokenSelectors,
} from "./inPage";
import { captureDir, PUBLIC_DIR, publicPath } from "./paths";
import { type DeviceProfile, SCALE, SOCS_REJECTED, TILE_HEIGHT } from "./profiles";
import { anchorList, assertSections } from "./sections";
import { tileBands, viewportStops } from "./stitch";

export type RawImage = {
  data: Buffer;
  info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
};

export type PageJob = {
  version: Version;
  commit: string;
  url: string;
  profile: DeviceProfile;
  withLoops: boolean;
  withSpecimen: boolean;
};

const HIDDEN_SELECTORS = [".phone-help-bubble", ".cookie-banner-ssr"];

const CAPTURE_CSS = [
  `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
  "[data-capture-hidden] { visibility: hidden !important; }",
  "* { caret-color: transparent !important; }",
].join("\n");

const TOKEN_SELECTORS: Record<Version, TokenSelectors> = {
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

function isolateCss(selector: string): string {
  return [
    "html, body { background: transparent !important; }",
    "body * { visibility: hidden !important; }",
    `${selector}, ${selector} * { visibility: visible !important; }`,
  ].join("\n");
}

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
    const input = await page.screenshot({
      clip: { x: 0, y: stop.sliceTop, width, height: stop.sliceHeight },
      caret: "hide",
    });
    composites.push({ input, top: stop.pageTop * SCALE, left: 0 });
  }
  const { data, info } = await sharp({
    create: { width: width * SCALE, height: pageHeight * SCALE, channels: 4, background: "#ffffff" },
  })
    .composite(composites)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const full: RawImage = { data, info: { width: info.width, height: info.height, channels: info.channels } };

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
    tiles.push({ avif: publicPath(avif), webp: publicPath(webp), top: band.top, height: band.height });
  }
  return { tiles, pageHeight, full };
}

async function shootHeader(page: Page, path: string): Promise<{ height: number; blur: number | null }> {
  const header = page.locator("header").first();
  await header.screenshot({ path, omitBackground: true, caret: "hide" });
  const box = await header.boundingBox();
  if (!box) throw new Error("The header has no box to measure");
  return { height: Math.round(box.height), blur: await page.evaluate(headerBlurInPage) };
}

async function captureHeaderStates(page: Page, outDir: string): Promise<StickyHeader> {
  await page.evaluate(() => document.querySelector("header")?.removeAttribute("data-capture-hidden"));
  const isolation = await page.addStyleTag({ content: isolateCss("header") });
  const atTop = await page.evaluate(headerPaintAtInPage, 0);
  const top = join(outDir, "header-top.png");
  const topShot = await shootHeader(page, top);
  let flipAt: number | null = null;
  for (const y of [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
    if ((await page.evaluate(headerPaintAtInPage, y)) !== atTop) {
      flipAt = y;
      break;
    }
  }
  if (flipAt === null) throw new Error("The sticky header kept its paint for 256px of scrolling");
  const scrolled = join(outDir, "header-scrolled.png");
  const scrolledShot = await shootHeader(page, scrolled);
  await isolation.evaluate((node) => node.remove());
  return {
    flipAt,
    states: [
      { id: "top", src: publicPath(top), height: topShot.height, blur: null },
      { id: "scrolled", src: publicPath(scrolled), height: scrolledShot.height, blur: scrolledShot.blur },
    ],
  };
}

async function captureSpecimen(page: Page): Promise<void> {
  await page.evaluate(addSpecimenInPage);
  const isolation = await page.addStyleTag({ content: isolateCss("#capture-specimen") });
  await page.locator("#capture-specimen").screenshot({
    path: join(PUBLIC_DIR, "captures/specimen-frutiger.png"),
    omitBackground: true,
  });
  await isolation.evaluate((node) => node.remove());
}

export async function capturePage(browser: Browser, job: PageJob): Promise<Capture> {
  const { context, page } = await openPage(browser, job.url, job.profile);
  try {
    await page.evaluate(settleInPage);
    await page.evaluate(pauseInfiniteAnimationsInPage);
    const sections = assertSections(await page.evaluate(sectionTopsInPage, anchorList(job.version)));
    const tokens = await page.evaluate(measureTokensInPage, TOKEN_SELECTORS[job.version]);
    const sticky = await page.evaluate(markStickyHeaderInPage);
    const floating = await page.evaluate(floatingElementsInPage);
    if (floating.length > 0) {
      throw new Error(
        `Unexpected fixed or sticky elements: ${floating.join(", ")}. Add them to HIDDEN_SELECTORS in capture/shoot.ts.`,
      );
    }
    const outDir = captureDir(job.version, job.profile.device);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const { tiles, pageHeight } = await captureTiles(page, outDir);
    const loops: Loop[] = [];
    const header = sticky ? await captureHeaderStates(page, outDir) : null;
    if (job.withSpecimen) await captureSpecimen(page);
    return {
      version: job.version,
      device: job.profile.device,
      commit: job.commit,
      capturedAt: new Date().toISOString(),
      viewport: job.profile.viewport,
      scale: SCALE,
      pageHeight,
      tiles,
      sections,
      header,
      loops,
      tokens,
    };
  } finally {
    await context.close();
  }
}
```

- [ ] **Step 7: Write the capture entry point**

`capture/capture.ts`:
```ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import type { Capture, CapturesFile, Device, Version } from "../src/data/types";
import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { extractObjectLiteral, paletteGroups } from "./literal";
import { DATA_FILE } from "./paths";
import { DEVICE_PROFILES } from "./profiles";
import { capturePage } from "./shoot";

const DEVICES: readonly Device[] = ["desktop", "mobile"];
const skipLoops = process.argv.includes("--skip-loops");

function servedFor(served: readonly ServedBuild[], version: Version): ServedBuild {
  const build = served.find((entry) => entry.version === version);
  if (!build) throw new Error(`The ${version} build is not being served`);
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

async function main() {
  const served: ServedBuild[] = [];
  try {
    for (const build of BUILDS.map(prepareBuild)) served.push(await serveBuild(build));
    const before = servedFor(served, "before");
    const after = servedFor(served, "after");
    const browser = await chromium.launch();
    const captures: Capture[] = [];
    try {
      for (const build of [before, after]) {
        for (const device of DEVICES) {
          console.log(`Capturing ${build.version} on ${device}`);
          captures.push(
            await capturePage(browser, {
              version: build.version,
              commit: build.fullCommit,
              url: build.url,
              profile: DEVICE_PROFILES[device],
              withLoops: build.version === "after" && !skipLoops,
              withSpecimen: build.version === "before" && device === "desktop",
            }),
          );
        }
      }
    } finally {
      await browser.close();
    }
    const file: CapturesFile = {
      captures,
      palettes: {
        before: paletteGroups(
          extractObjectLiteral(sourceIn(before, "packages/bookable/tailwind.config.ts"), "NHS_COLORS"),
        ),
        after: paletteGroups(
          extractObjectLiteral(sourceIn(after, "packages/bookable/app/_ui/tokens.colors.ts"), "UI_COLORS"),
        ),
      },
      radiusScale: radiusScale(sourceIn(after, "packages/bookable/app/_ui/tokens.ts")),
      specimens: { frutiger: "captures/specimen-frutiger.png" },
    };
    writeFileSync(DATA_FILE, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${DATA_FILE}`);
  } finally {
    await Promise.all(served.map((build) => build.stop()));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

Add to `package.json` `scripts`:
```json
"capture": "tsx capture/capture.ts"
```

- [ ] **Step 8: Run the capture without loops**

Run: `pnpm capture --skip-loops`
Expected: the builds from Task 5 are reused, four `Capturing …` lines print, then `Wrote …/src/data/captures.json`. If it stops with `Unexpected fixed or sticky elements: …`, add those selectors to `HIDDEN_SELECTORS` in `capture/shoot.ts`, re-run, and note them in the commit message. If a heading anchor fails, read the heading in that build's source under `$CAPTURE_WORK_DIR` (default `<os tmp>/bookable-before-after/<version>/packages/bookable/app/_components/landing/`), fix `capture/sections.ts`, and re-run.

- [ ] **Step 9: Check the data and the images**

Run:
```bash
node -e "const d=require('./src/data/captures.json'); for (const c of d.captures) console.log(c.version, c.device, c.pageHeight, c.tiles.length, c.sections.map(s=>s.id+':'+s.top).join(' '), c.header ? 'header@'+c.header.flipAt : 'no header'); console.log(d.palettes.before.length, d.palettes.after.length, d.radiusScale.join(' '))"
```
Expected: four lines. The before lines end `no header`, the after lines end `header@1`, and each shows six ascending section tops. The last line prints the palette group counts (9 and 8) and `1px 2px … 999px`.

Then convert and look at the first tiles and the specimen:
```bash
mkdir -p .capture/check && for v in before after; do for d in desktop mobile; do sips -s format png public/captures/$v/$d/tile-00.webp --out .capture/check/$v-$d.png >/dev/null; done; done; ls .capture/check public/captures/specimen-frutiger.png
```
Open the four PNGs and `public/captures/specimen-frutiger.png`. Expected:
- Before: the NHS-blue hero reading "Register and book with an NHS GP".
- After: the radial-gradient hero with no header bar, which is hidden for the overlay.
- Neither has a cookie banner or the phone-help bubble.
- The specimen is light text on transparency: "Aa" and two lines in Frutiger.

- [ ] **Step 10: Lint, test and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Capture both homepages: stitched tiles, section edges, header states, tokens" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Capture the live loops

**Files:**
- Create: `capture/loops.ts`
- Modify: `capture/inPage.ts` (append three functions and two types), `capture/shoot.ts` (call the loops)
- Generated: `public/captures/after/*/loop-*.{mp4,webm}`, `loops` entries in `src/data/captures.json`

**Interfaces:**
- Consumes: `planLoop` (Task 4), `meanAbsoluteDifference` (Task 4), `RawImage` and `capturePage` (Task 6), `FPS`, `SCALE` (Task 6).
- Produces: `type LoopRegionQuery`, `markLoopRegionInPage(region)`, `scrollRegionIntoViewInPage(rect)`, `seekLoopInPage({ seconds, rates })` (`capture/inPage.ts`); `LOOP_REGIONS`, `captureLoops(page, device, outDir, full): Promise<Loop[]>` (`capture/loops.ts`).

Frames are stepped, not recorded. Frame `n` sets every animation in the region to its frame-0 time plus `n / 30` seconds, scaled by its rate from `planLoop`. Frame 0 is checked against the still under it, so a loop can never start on a visible jump.

- [ ] **Step 1: Append the loop functions to `capture/inPage.ts`**

```ts
export type LoopRegionQuery = {
  id: string;
  scopeHeading: string | null;
  selector: string;
  index: number;
  radius: "self" | "parent-top";
};

type LoopWindow = Window & { __loop?: { animation: Animation; start: number }[] };

export function markLoopRegionInPage(region: LoopRegionQuery): {
  rect: { x: number; y: number; width: number; height: number };
  radius: [number, number, number, number];
  periods: number[];
} {
  const textOf = (element: Element) => (element.textContent ?? "").replace(/\s+/g, " ").trim();
  const scope: ParentNode | undefined =
    region.scopeHeading === null
      ? document
      : Array.from(document.querySelectorAll("main > *")).find((child) =>
          Array.from(child.querySelectorAll("h1, h2, h3")).some(
            (heading) => textOf(heading) === region.scopeHeading,
          ),
        );
  const element = scope?.querySelectorAll(region.selector)[region.index];
  if (!element) throw new Error(`Loop region ${region.id} is not on the page`);

  const box = element.getBoundingClientRect();
  const x = Math.floor(box.left + window.scrollX);
  const y = Math.floor(box.top + window.scrollY);
  const rect = {
    x,
    y,
    width: Math.ceil(box.right + window.scrollX) - x,
    height: Math.ceil(box.bottom + window.scrollY) - y,
  };

  const corners = (source: Element) => {
    const style = getComputedStyle(source);
    return [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].map((value) => Number.parseFloat(value) || 0);
  };
  const own = corners(element);
  const parent = element.parentElement ? corners(element.parentElement) : [0, 0, 0, 0];
  const radius: [number, number, number, number] =
    region.radius === "self" ? [own[0], own[1], own[2], own[3]] : [parent[0], parent[1], 0, 0];

  const animations = document.getAnimations().filter((animation) => {
    const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
    return (
      target !== null &&
      element.contains(target) &&
      animation.effect?.getComputedTiming().iterations === Infinity
    );
  });
  if (animations.length === 0) throw new Error(`Loop region ${region.id} has no running animations`);
  (window as LoopWindow).__loop = animations.map((animation) => ({
    animation,
    start: Number(animation.currentTime ?? 0),
  }));
  return {
    rect,
    radius,
    periods: animations.map(
      (animation) => Number(animation.effect?.getComputedTiming().duration ?? 0) / 1000,
    ),
  };
}

export async function scrollRegionIntoViewInPage(rect: { y: number; height: number }): Promise<number> {
  if (rect.height > window.innerHeight) {
    throw new Error(`A ${rect.height}px loop region is taller than the ${window.innerHeight}px viewport`);
  }
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const top = Math.min(maxScroll, Math.max(0, Math.round(rect.y - (window.innerHeight - rect.height) / 2)));
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return rect.y - window.scrollY;
}

export async function seekLoopInPage({ seconds, rates }: { seconds: number; rates: number[] }): Promise<void> {
  const loop = (window as LoopWindow).__loop;
  if (!loop) throw new Error("No loop region is marked");
  for (const [index, entry] of loop.entries()) {
    entry.animation.currentTime = entry.start + seconds * 1000 * (rates[index] ?? 1);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
```

- [ ] **Step 2: Write the loop capture**

`capture/loops.ts`:
```ts
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import sharp from "sharp";
import type { Device, Loop, Rect } from "../src/data/types";
import {
  type LoopRegionQuery,
  markLoopRegionInPage,
  scrollRegionIntoViewInPage,
  seekLoopInPage,
} from "./inPage";
import { planLoop } from "./loopPlan";
import { publicPath, WORK_DIR } from "./paths";
import { meanAbsoluteDifference } from "./pixels";
import { FPS, SCALE } from "./profiles";
import type { RawImage } from "./shoot";

const HOW_PANELS: LoopRegionQuery[] = [0, 1, 2].map((index) => ({
  id: `how-${index + 1}`,
  scopeHeading: "How Bookable works",
  selector: 'li > div[aria-hidden="true"]',
  index,
  radius: "parent-top",
}));

export const LOOP_REGIONS: Record<Device, readonly LoopRegionQuery[]> = {
  desktop: [
    { id: "hero", scopeHeading: null, selector: "main > section:first-of-type", index: 0, radius: "self" },
    ...HOW_PANELS,
  ],
  mobile: HOW_PANELS,
};

const MAX_FRAME_DIFFERENCE = 1.5;

function encodeLoop(framesDir: string, mp4: string, webm: string) {
  const input = ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(framesDir, "frame-%04d.png")];
  const color = [
    "-vf",
    "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "iec61966-2-1",
    "-color_range",
    "tv",
  ];
  execFileSync(
    "ffmpeg",
    [...input, ...color, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", "-an", mp4],
    { stdio: "inherit" },
  );
  execFileSync(
    "ffmpeg",
    [...input, ...color, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-an", webm],
    { stdio: "inherit" },
  );
}

async function assertFrameMatchesStill(framePath: string, full: RawImage, rect: Rect) {
  const frame = await sharp(framePath).removeAlpha().raw().toBuffer();
  const still = await sharp(full.data, { raw: full.info })
    .extract({ left: rect.x * SCALE, top: rect.y * SCALE, width: rect.width * SCALE, height: rect.height * SCALE })
    .removeAlpha()
    .raw()
    .toBuffer();
  const difference = meanAbsoluteDifference(frame, still);
  if (difference > MAX_FRAME_DIFFERENCE) {
    throw new Error(
      `${framePath} differs from the still under it by ${difference.toFixed(2)} (allowed ${MAX_FRAME_DIFFERENCE})`,
    );
  }
}

async function captureLoop(
  page: Page,
  region: LoopRegionQuery,
  device: Device,
  outDir: string,
  full: RawImage,
): Promise<Loop> {
  const found = await page.evaluate(markLoopRegionInPage, region);
  const plan = planLoop(found.periods, Math.max(...found.periods));
  const frames = Math.round(plan.length * FPS);
  const framesDir = join(WORK_DIR, "frames", `${device}-${region.id}`);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const viewportY = await page.evaluate(scrollRegionIntoViewInPage, found.rect);
  console.log(`  ${region.id}: ${frames} frames, a ${plan.length.toFixed(2)}s loop`);
  for (let frame = 0; frame < frames; frame++) {
    await page.evaluate(seekLoopInPage, { seconds: frame / FPS, rates: plan.rates });
    await page.screenshot({
      path: join(framesDir, `frame-${String(frame).padStart(4, "0")}.png`),
      clip: { x: found.rect.x, y: viewportY, width: found.rect.width, height: found.rect.height },
      caret: "hide",
    });
  }
  await assertFrameMatchesStill(join(framesDir, "frame-0000.png"), full, found.rect);
  const mp4 = join(outDir, `loop-${region.id}.mp4`);
  const webm = join(outDir, `loop-${region.id}.webm`);
  encodeLoop(framesDir, mp4, webm);
  rmSync(framesDir, { recursive: true, force: true });
  await page.evaluate(seekLoopInPage, { seconds: 0, rates: plan.rates });
  return {
    id: region.id,
    rect: found.rect,
    radius: found.radius,
    mp4: publicPath(mp4),
    webm: publicPath(webm),
    duration: plan.length,
  };
}

export async function captureLoops(
  page: Page,
  device: Device,
  outDir: string,
  full: RawImage,
): Promise<Loop[]> {
  const loops: Loop[] = [];
  for (const region of LOOP_REGIONS[device]) {
    loops.push(await captureLoop(page, region, device, outDir, full));
  }
  return loops;
}
```

The `RawImage` import is type-only, so the two modules do not load each other at runtime.

- [ ] **Step 3: Call the loops from `capture/shoot.ts`**

Add the import below the other `./` imports:
```ts
import { captureLoops } from "./loops";
```

Change the type import to drop `Loop`:
```ts
import type { Capture, StickyHeader, Tile, Version } from "../src/data/types";
```

Replace:
```ts
    const { tiles, pageHeight } = await captureTiles(page, outDir);
    const loops: Loop[] = [];
```
with:
```ts
    const { tiles, pageHeight, full } = await captureTiles(page, outDir);
    const loops = job.withLoops ? await captureLoops(page, job.profile.device, outDir, full) : [];
```

Loops run before the header states, while the sticky header is still hidden. That keeps a loop's frames identical to the tiles they cover.

- [ ] **Step 4: Run the full capture**

Run: `pnpm capture`
Expected: as in Task 6, and under each after capture a line per loop. For example, `hero: 306 frames, a 10.20s loop` on desktop, then `how-1` to `how-3` on desktop and mobile. If a frame-0 check fails, the loop's region is not scroll-invariant: open `$CAPTURE_WORK_DIR/frames/<device>-<id>/frame-0000.png` next to the matching tile and find what differs before changing anything. If a region is taller than the viewport, reduce that region to the animated element itself in `LOOP_REGIONS`.

- [ ] **Step 5: Check the loops**

Run:
```bash
node -e "const d=require('./src/data/captures.json'); for (const c of d.captures) console.log(c.version, c.device, c.loops.map(l=>l.id+':'+l.duration.toFixed(2)+'s').join(' ') || '-')"
ffprobe -v error -show_entries format=duration -of csv=p=0 public/captures/after/desktop/loop-hero.mp4
ffmpeg -loglevel error -y -ss 5 -i public/captures/after/desktop/loop-hero.mp4 -frames:v 1 .capture/check/hero-5s.png
du -sh public/captures
```
Expected:
- The before lines print `-`. After desktop prints `hero:10.20s` plus three `how-N` entries; after mobile prints three `how-N` entries.
- `ffprobe` prints about `10.2`.
- `.capture/check/hero-5s.png` shows the slot cards moved relative to `.capture/check/after-desktop.png`.
- Note the `du` total in the commit message.

- [ ] **Step 6: Lint, test and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Capture the v2 hero reel and how-it-works vignettes as seamless loops" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Page shell and case-study header

**Files:**
- Create: `src/hooks/useMotionPreference.ts`, `src/motionFeatures.ts`, `src/data/caseStudy.ts`, `src/components/GlowBackground.tsx`, `src/components/MetaItem.tsx`, `src/components/CaseHeader.tsx`
- Modify: `src/App.tsx`, `e2e/smoke.spec.ts`, `package.json` (scripts)

**Interfaces:**
- Consumes: `parseUrlOptions` (Task 3); the `ink`, `mint`, `line` theme and the `caption` utility (Task 1).
- Produces: `MotionPreferenceContext`, `useMotionPreference(): { reduced: boolean }`; `CASE_STUDY`; the `review` script (any test titled `@review` runs only under it).

`reduced` is true only when the system asks for less motion and the page is not in recording mode. Every component reads it from this context, never from the media query directly.

- [ ] **Step 1: Write the failing test**

Append to `e2e/smoke.spec.ts`:
```ts
test("introduces the case study", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Front-end engineering")).toBeVisible();
  await expect(page.getByText("Shipped 29 Sept 2026")).toBeVisible();
  await expect(page.getByRole("link", { name: "bookable.health", exact: true })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
});

test("@review the page top", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/01-top.png" });
});
```

Add to `package.json` `scripts`:
```json
"review": "REVIEW=1 playwright test --grep @review"
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm e2e`
Expected: `introduces the case study` FAILS (`Front-end engineering` not found); the title test passes.

- [ ] **Step 3: Write the motion preference, features and copy**

`src/hooks/useMotionPreference.ts`:
```ts
import { createContext, useContext } from "react";

export type MotionPreference = { reduced: boolean };

export const MotionPreferenceContext = createContext<MotionPreference>({ reduced: false });

export function useMotionPreference(): MotionPreference {
  return useContext(MotionPreferenceContext);
}
```

`src/motionFeatures.ts`:
```ts
import { domMax } from "motion/react";

export default domMax;
```

`src/data/caseStudy.ts`:
```ts
export const CASE_STUDY = {
  title: "Bookable homepage, before & after",
  eyebrow: "Case study · Bookable",
  lede: "In September 2026 the Bookable homepage moved off the NHS design system and onto Bookable's own. Drag the divider, scroll inside the frame, or press Play.",
  role: "Front-end engineering",
  shipped: "Shipped 29 Sept 2026",
  stack: ["Next.js", "React", "Tailwind", "Design tokens"],
  liveUrl: "https://bookable.health",
} as const;
```

- [ ] **Step 4: Write the components**

`src/components/GlowBackground.tsx`:
```tsx
export function GlowBackground() {
  return <div aria-hidden="true" className="glow pointer-events-none fixed inset-[-20vmax] -z-10" />;
}
```

`src/components/MetaItem.tsx`:
```tsx
import type { ReactNode } from "react";

type MetaItemProps = { term: string; children: ReactNode };

export function MetaItem({ term, children }: MetaItemProps) {
  return (
    <div>
      <dt className="caption text-mist/50">{term}</dt>
      <dd className="mt-2 text-mist">{children}</dd>
    </div>
  );
}
```

`src/components/CaseHeader.tsx`:
```tsx
import { m } from "motion/react";
import { CASE_STUDY } from "../data/caseStudy";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { MetaItem } from "./MetaItem";

const RISE = [0.16, 1, 0.3, 1] as const;

export function CaseHeader() {
  const { reduced } = useMotionPreference();
  const words = CASE_STUDY.title.split(" ");
  return (
    <header className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-14 sm:pt-28">
      <p className="caption text-mint">{CASE_STUDY.eyebrow}</p>
      <h1 className="mt-5 max-w-[12ch] text-balance font-extrabold text-[clamp(44px,8.4vw,112px)] leading-[0.95] tracking-[-0.035em]">
        {words.map((word, index) => (
          <span key={word}>
            {index > 0 && " "}
            <m.span
              className="inline-block"
              initial={reduced ? false : { opacity: 0, y: "0.5em" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 * index, ease: RISE }}
            >
              {word}
            </m.span>
          </span>
        ))}
      </h1>
      <m.p
        className="mt-7 max-w-[620px] text-lg text-mist/75 sm:text-xl"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {CASE_STUDY.lede}
      </m.p>
      <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 text-sm">
        <MetaItem term="Role">{CASE_STUDY.role}</MetaItem>
        <MetaItem term="Shipped">{CASE_STUDY.shipped}</MetaItem>
        <MetaItem term="Stack">
          <ul className="flex flex-wrap gap-2">
            {CASE_STUDY.stack.map((item) => (
              <li key={item} className="rounded-full border border-line px-3 py-1">
                {item}
              </li>
            ))}
          </ul>
        </MetaItem>
        <MetaItem term="Live">
          <a
            href={CASE_STUDY.liveUrl}
            className="underline decoration-mint underline-offset-4 hover:text-mint"
          >
            bookable.health
          </a>
        </MetaItem>
      </dl>
    </header>
  );
}
```

The words are separated by real spaces, so the heading's text reads as one sentence to screen readers and to the title test.

- [ ] **Step 5: Wire the app**

`src/App.tsx`:
```tsx
import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CaseHeader } from "./components/CaseHeader";
import { GlowBackground } from "./components/GlowBackground";
import { MotionPreferenceContext } from "./hooks/useMotionPreference";
import { parseUrlOptions } from "./lib/urlOptions";

const loadFeatures = () => import("./motionFeatures").then((module) => module.default);

export function App() {
  const options = useMemo(() => parseUrlOptions(window.location.search), []);
  const systemReduced = useReducedMotion() ?? false;
  const preference = useMemo(
    () => ({ reduced: systemReduced && options.record === null }),
    [systemReduced, options.record],
  );
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={options.record === null ? "user" : "never"}>
        <MotionPreferenceContext value={preference}>
          <GlowBackground />
          <CaseHeader />
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
```

- [ ] **Step 6: Run the tests and review the screenshot**

Run: `pnpm e2e && pnpm review`
Expected: 2 tests pass, and `.capture/review/01-top.png` is written. Open it and check:
- The mint eyebrow sits above a two-to-three-line extra-bold title.
- The lede and the meta row (Role, Shipped, Stack chips, Live link) read clearly on the dark ground.
- A soft blue glow sits behind them.
- Nothing overflows sideways.

- [ ] **Step 7: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Add the page shell: glow ground, motion preference and the case-study header" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 9: The comparison stage: frame, layers, divider and locked scroll

**Files:**
- Create: `src/data/captures.ts`, `src/hooks/useElementSize.ts`, `src/hooks/useFrameScroll.ts`, `src/components/LockIcon.tsx`, `src/components/BrowserChrome.tsx`, `src/components/PhoneIsland.tsx`, `src/components/DeviceFrame.tsx`, `src/components/PageTile.tsx`, `src/components/PageLayer.tsx`, `src/components/HandleIcon.tsx`, `src/components/WipeDivider.tsx`, `src/components/VersionLabels.tsx`, `src/components/StageViewport.tsx`, `src/components/ComparisonStage.tsx`, `e2e/captureData.ts`, `e2e/stageHelpers.ts`, `e2e/stage.spec.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `createSectionMap` and the types (Task 2); `nextDividerValue`, `clamp` (Tasks 2–3); `captures.json` (Tasks 6–7); `useMotionPreference` (Task 8).
- Produces:
  - `CAPTURES: CapturesFile`, `captureFor(version, device): Capture`, `assetUrl(path): string` (`src/data/captures.ts`).
  - `useElementSize<T>(): [(element: T | null) => void, { width: number; height: number }]`.
  - `useFrameScroll(scroller, map, scale, initialScroll): { scrollA; scrollB; beforeY }`, all `MotionValue<number>`; `scrollA`/`scrollB` are in page px and `beforeY` is in screen px.
  - `type StageViewportHandle = { scrollTo(pagePx: number): void; glideTo(pagePx: number, seconds: number): void; getScroll(): number }`.
  - Test ids `stage-viewport` (with `data-scale`), `after-scroller`, `before-page`, `divider-handle`. The stage `<section aria-label="Before and after comparison">` carries `data-group`, the group under the anchor.

The after page is the real scroll container. The before page sits above it, clipped to the left of the divider and moved by `beforeY`. The clip is made with two opposing translations, an outer box moved left and an inner box moved back right, so dragging the divider never repaints the page images.

- [ ] **Step 1: Write the failing end-to-end tests**

`e2e/captureData.ts`:
```ts
import { readFileSync } from "node:fs";
import type { Capture, CapturesFile, Device, SectionId, Version } from "../src/data/types";

const FILE = JSON.parse(
  readFileSync(new URL("../src/data/captures.json", import.meta.url), "utf8"),
) as CapturesFile;

export function captureOf(version: Version, device: Device): Capture {
  const capture = FILE.captures.find((entry) => entry.version === version && entry.device === device);
  if (!capture) throw new Error(`No ${version} capture for ${device}`);
  return capture;
}

export function spanOf(capture: Capture, id: SectionId): { start: number; end: number } {
  const index = capture.sections.findIndex((section) => section.id === id);
  if (index === -1) throw new Error(`${id} is not a section of the ${capture.version} capture`);
  return {
    start: capture.sections[index].top,
    end: capture.sections[index + 1]?.top ?? capture.pageHeight,
  };
}

export function maxScrollOf(capture: Capture): number {
  return capture.pageHeight - capture.viewport.height;
}

export function anchorOf(capture: Capture, scroll: number): number {
  return (scroll / maxScrollOf(capture)) * capture.pageHeight;
}

export function scrollToMiddleOf(capture: Capture, id: SectionId): number {
  const span = spanOf(capture, id);
  return ((span.start + span.end) / 2 / capture.pageHeight) * maxScrollOf(capture);
}
```

These helpers restate the spec's anchor formula independently of `src/lib/sectionMap.ts`, so the tests check the behaviour rather than repeat the code.

`e2e/stageHelpers.ts`:
```ts
import { expect, type Page } from "@playwright/test";
import type { Capture } from "../src/data/types";
import { anchorOf } from "./captureData";

export function stageRegion(page: Page) {
  return page.getByRole("region", { name: "Before and after comparison" });
}

export async function stageScale(page: Page): Promise<number> {
  const viewport = page.getByTestId("stage-viewport");
  await expect.poll(async () => Number(await viewport.getAttribute("data-scale"))).toBeGreaterThan(0);
  return Number(await viewport.getAttribute("data-scale"));
}

export async function scrollAfterTo(page: Page, pagePx: number): Promise<void> {
  const scale = await stageScale(page);
  await page.getByTestId("after-scroller").evaluate((element, top) => {
    element.scrollTop = top;
  }, pagePx * scale);
}

export async function beforeAnchor(page: Page, before: Capture): Promise<number> {
  const scale = await stageScale(page);
  const translateY = await page
    .getByTestId("before-page")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  return anchorOf(before, -translateY / scale);
}
```

`e2e/stage.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { captureOf, scrollToMiddleOf, spanOf } from "./captureData";
import { beforeAnchor, scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("after", "desktop");
const BEFORE = captureOf("before", "desktop");

test("the divider follows the arrow keys and a drag", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByRole("slider", { name: "Divider between before and after" });
  await expect(slider).toHaveValue("50");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("55");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(slider).toHaveValue("35");

  const viewport = page.getByTestId("stage-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const frame = await viewport.boundingBox();
  const handle = await page.getByTestId("divider-handle").boundingBox();
  if (!frame || !handle) throw new Error("The stage has not laid out");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue("25");
});

test("scrolling the after page carries the before page to the same section", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  const how = spanOf(BEFORE, "how");
  await expect.poll(() => beforeAnchor(page, BEFORE)).toBeGreaterThanOrEqual(how.start);
  expect(await beforeAnchor(page, BEFORE)).toBeLessThan(how.end);
});

test("resizing the window keeps the frame on the same section", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.waitForTimeout(400);
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens on the mobile captures without scrolling sideways", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
      "src",
      /captures\/after\/mobile\//,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("@review the stage", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/02-stage.png" });
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/03-stage-how.png" });
});

test("@review a phone visitor", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/07-phone-top.png" });
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/07-phone-stage.png" });
  await page.close();
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm e2e e2e/stage.spec.ts`
Expected: 4 tests FAIL (no slider, no `after-scroller`).

- [ ] **Step 3: Write the data access and hooks**

`src/data/captures.ts`:
```ts
import data from "./captures.json";
import type { Capture, CapturesFile, Device, Version } from "./types";

export const CAPTURES = data as CapturesFile;

export function captureFor(version: Version, device: Device): Capture {
  const capture = CAPTURES.captures.find((entry) => entry.version === version && entry.device === device);
  if (!capture) throw new Error(`There is no ${version} capture for ${device}`);
  return capture;
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
```

`src/hooks/useElementSize.ts`:
```ts
import { useLayoutEffect, useState } from "react";

export type ElementSize = { width: number; height: number };

export function useElementSize<T extends HTMLElement>(): [(element: T | null) => void, ElementSize] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!element) return;
    const read = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, size];
}
```

`src/hooks/useFrameScroll.ts`:
```ts
import { type MotionValue, useMotionValue } from "motion/react";
import { type RefObject, useLayoutEffect, useRef } from "react";
import type { SectionMap } from "../lib/sectionMap";

export type FrameScroll = {
  scrollA: MotionValue<number>;
  scrollB: MotionValue<number>;
  beforeY: MotionValue<number>;
};

export function useFrameScroll(
  scroller: RefObject<HTMLElement | null>,
  map: SectionMap,
  scale: number,
  initialScroll: number,
): FrameScroll {
  const scrollA = useMotionValue(initialScroll);
  const scrollB = useMotionValue(map.mapScroll(initialScroll));
  const beforeY = useMotionValue(0);
  const restored = useRef(false);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || scale === 0) return;
    element.scrollTop = (restored.current ? scrollA.get() : initialScroll) * scale;
    restored.current = true;
    const update = () => {
      const pagePx = element.scrollTop / scale;
      const mapped = map.mapScroll(pagePx);
      scrollA.set(pagePx);
      scrollB.set(mapped);
      beforeY.set(-mapped * scale);
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [scroller, map, scale, initialScroll, scrollA, scrollB, beforeY]);

  return { scrollA, scrollB, beforeY };
}
```

When the scale changes on a resize, the effect puts the page back at the same page-pixel position. That is what keeps the frame on its section.

- [ ] **Step 4: Write the frame components**

`src/components/LockIcon.tsx`:
```tsx
export function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3" fill="currentColor">
      <path d="M5 7V5a3 3 0 1 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7H5Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z" />
    </svg>
  );
}
```

`src/components/BrowserChrome.tsx`:
```tsx
import { LockIcon } from "./LockIcon";

export function BrowserChrome() {
  return (
    <div aria-hidden="true" className="flex h-11 items-center gap-3 border-white/10 border-b px-4">
      <span className="flex w-14 gap-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <span className="mx-auto flex h-7 w-[min(360px,60%)] items-center justify-center gap-2 rounded-lg bg-white/[0.06] text-mist/70 text-xs">
        <LockIcon />
        bookable.health
      </span>
      <span className="w-14" />
    </div>
  );
}
```

`src/components/PhoneIsland.tsx`:
```tsx
export function PhoneIsland() {
  return (
    <div aria-hidden="true" className="flex h-10 items-center justify-center">
      <span className="h-[22px] w-[92px] rounded-full bg-black" />
    </div>
  );
}
```

`src/components/DeviceFrame.tsx`:
```tsx
import { m } from "motion/react";
import type { ReactNode } from "react";
import type { Device } from "../data/types";
import { BrowserChrome } from "./BrowserChrome";
import { PhoneIsland } from "./PhoneIsland";

type DeviceFrameProps = {
  device: Device;
  viewport: { width: number; height: number };
  children: ReactNode;
};

const CHROME = { desktop: { x: 0, y: 44 }, mobile: { x: 24, y: 52 } } as const;

export function DeviceFrame({ device, viewport, children }: DeviceFrameProps) {
  const chrome = CHROME[device];
  const ratio = viewport.width / viewport.height;
  const desktop = device === "desktop";
  return (
    <m.div
      layout
      transition={{ type: "spring", stiffness: 240, damping: 30 }}
      className={
        desktop
          ? "overflow-hidden bg-[#0d1f36] shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          : "bg-[#0a1424] px-3 pb-3 shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/12"
      }
      style={{
        width: `min(100cqw, calc((100cqh - ${chrome.y}px) * ${ratio} + ${chrome.x}px))`,
        borderRadius: desktop ? 18 : 52,
      }}
    >
      {desktop ? <BrowserChrome /> : <PhoneIsland />}
      <div
        className="relative overflow-hidden bg-ink-2"
        style={{ aspectRatio: `${viewport.width} / ${viewport.height}`, borderRadius: desktop ? 0 : 40 }}
      >
        {children}
      </div>
    </m.div>
  );
}
```

- [ ] **Step 5: Write the page layers, divider and labels**

`src/components/PageTile.tsx`:
```tsx
import { assetUrl } from "../data/captures";
import type { Tile } from "../data/types";

type PageTileProps = { tile: Tile; width: number; eager: boolean; alt: string };

export function PageTile({ tile, width, eager, alt }: PageTileProps) {
  return (
    <picture>
      <source srcSet={assetUrl(tile.avif)} type="image/avif" />
      <img
        src={assetUrl(tile.webp)}
        alt={alt}
        width={width}
        height={tile.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className="absolute left-0 block max-w-none select-none"
        style={{ top: tile.top, width, height: tile.height }}
      />
    </picture>
  );
}
```

`src/components/PageLayer.tsx`:
```tsx
import type { Capture } from "../data/types";
import { PageTile } from "./PageTile";

type PageLayerProps = { capture: Capture; scale: number; alt: string };

export function PageLayer({ capture, scale, alt }: PageLayerProps) {
  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: capture.viewport.width,
        height: capture.pageHeight,
        transform: `scale(${scale})`,
      }}
    >
      {capture.tiles.map((tile, index) => (
        <PageTile
          key={tile.webp}
          tile={tile}
          width={capture.viewport.width}
          eager={index === 0}
          alt={index === 0 ? alt : ""}
        />
      ))}
    </div>
  );
}
```

`src/components/HandleIcon.tsx`:
```tsx
export function HandleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6-6 6 6 6" />
      <path d="m15 6 6 6-6 6" />
    </svg>
  );
}
```

`src/components/WipeDivider.tsx`:
```tsx
import { m, type MotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { nextDividerValue } from "../lib/dividerKeys";
import { clamp } from "../lib/math";
import { HandleIcon } from "./HandleIcon";

type WipeDividerProps = { divider: MotionValue<number> };

export function WipeDivider({ divider }: WipeDividerProps) {
  const track = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(() => Math.round(divider.get() * 100));
  const left = useTransform(divider, (share) => `${share * 100}%`);

  useMotionValueEvent(divider, "change", (share) => setValue(Math.round(share * 100)));

  const followPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    divider.set(clamp((clientX - box.left) / box.width, 0, 1));
  };

  return (
    <div ref={track} className="pointer-events-none absolute inset-0">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Divider between before and after"
        aria-valuetext={`${value}% before, ${100 - value}% after`}
        onChange={(event) => divider.set(Number(event.currentTarget.value) / 100)}
        onKeyDown={(event) => {
          const next = nextDividerValue(divider.get(), event.key, event.shiftKey);
          if (next === null) return;
          event.preventDefault();
          divider.set(next);
        }}
        className="peer sr-only"
      />
      <m.div
        aria-hidden="true"
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_24px_rgba(111,224,172,0.55)]"
        style={{ left }}
      />
      <m.button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="divider-handle"
        className="pointer-events-auto absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_rgba(3,20,45,0.35)] ring-mint transition-shadow peer-focus-visible:ring-4"
        style={{ left }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          followPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) followPointer(event.clientX);
        }}
      >
        <HandleIcon />
      </m.button>
    </div>
  );
}
```

The native range input, visually hidden, carries the keyboard and screen-reader semantics. The visible handle only takes pointer drags, so it is hidden from assistive technology.

`src/components/VersionLabels.tsx`:
```tsx
import { m, type MotionValue, useTransform } from "motion/react";
import type { Device } from "../data/types";

type VersionLabelsProps = { device: Device; divider: MotionValue<number> };

const CHIP =
  "rounded-full px-3 py-1.5 font-extrabold text-[11px] uppercase leading-none tracking-[0.09em] backdrop-blur";

export function VersionLabels({ device, divider }: VersionLabelsProps) {
  const beforeOpacity = useTransform(divider, [0, 0.12], [0, 1]);
  const afterOpacity = useTransform(divider, [0.88, 1], [1, 0]);
  const compact = device === "mobile";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
      <m.span className={`${CHIP} bg-ink/75 text-mist`} style={{ opacity: beforeOpacity }}>
        {compact ? "Before" : "Before · NHS design system"}
      </m.span>
      <m.span className={`${CHIP} bg-mint text-ink`} style={{ opacity: afterOpacity }}>
        {compact ? "After" : "After · v2"}
      </m.span>
    </div>
  );
}
```

- [ ] **Step 6: Write the viewport and the stage**

`src/components/StageViewport.tsx`:
```tsx
import {
  type AnimationPlaybackControls,
  animate,
  m,
  type MotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useElementSize } from "../hooks/useElementSize";
import { useFrameScroll } from "../hooks/useFrameScroll";
import type { SectionMap } from "../lib/sectionMap";
import { PageLayer } from "./PageLayer";
import { VersionLabels } from "./VersionLabels";
import { WipeDivider } from "./WipeDivider";

export type StageViewportHandle = {
  scrollTo: (pagePx: number) => void;
  glideTo: (pagePx: number, seconds: number) => void;
  getScroll: () => number;
};

type StageViewportProps = {
  device: Device;
  divider: MotionValue<number>;
  map: SectionMap;
  initialScroll: number;
  onGroupChange: (id: SectionId) => void;
  ref?: Ref<StageViewportHandle>;
};

const GLIDE_EASE = [0.65, 0, 0.35, 1] as const;
const INTERRUPTIONS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

export function StageViewport({
  device,
  divider,
  map,
  initialScroll,
  onGroupChange,
  ref,
}: StageViewportProps) {
  const before = captureFor("before", device);
  const after = captureFor("after", device);
  const [measure, size] = useElementSize<HTMLDivElement>();
  const scale = size.width / after.viewport.width;
  const scroller = useRef<HTMLElement>(null);
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const group = useRef<SectionId>(map.groupAt(initialScroll));
  const { scrollA, beforeY } = useFrameScroll(scroller, map, scale, initialScroll);
  const outerX = useTransform(divider, (share) => `${(share - 1) * 100}%`);
  const innerX = useTransform(divider, (share) => `${(1 - share) * 100}%`);

  useMotionValueEvent(scrollA, "change", (pagePx) => {
    const next = map.groupAt(pagePx);
    if (next === group.current) return;
    group.current = next;
    onGroupChange(next);
  });

  useEffect(() => {
    onGroupChange(group.current);
  }, [onGroupChange]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const cancelGlide = () => {
      glide.current?.stop();
      glide.current = null;
    };
    for (const name of INTERRUPTIONS) element.addEventListener(name, cancelGlide, { passive: true });
    return () => {
      for (const name of INTERRUPTIONS) element.removeEventListener(name, cancelGlide);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(pagePx) {
        const element = scroller.current;
        if (element && scale > 0) element.scrollTop = pagePx * scale;
      },
      glideTo(pagePx, seconds) {
        const element = scroller.current;
        if (!element || scale === 0) return;
        glide.current?.stop();
        if (seconds === 0) {
          element.scrollTop = pagePx * scale;
          return;
        }
        glide.current = animate(element.scrollTop, pagePx * scale, {
          duration: seconds,
          ease: GLIDE_EASE,
          onUpdate: (value) => {
            element.scrollTop = value;
          },
        });
      },
      getScroll: () => scrollA.get(),
    }),
    [scale, scrollA],
  );

  return (
    <m.div
      ref={measure}
      layout
      data-testid="stage-viewport"
      data-scale={scale}
      className="absolute inset-0 overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.35 }}
    >
      <section
        ref={scroller}
        data-testid="after-scroller"
        aria-label="After: the v2 homepage. Scroll to move both versions together."
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none]"
      >
        <div className="relative" style={{ height: after.pageHeight * scale }}>
          <PageLayer
            capture={after}
            scale={scale}
            alt={`After: the Bookable homepage on its own design system, ${device}`}
          />
        </div>
      </section>
      <m.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ x: outerX }}>
        <m.div className="absolute inset-0" style={{ x: innerX }}>
          <m.div data-testid="before-page" className="absolute inset-x-0 top-0" style={{ y: beforeY }}>
            <PageLayer
              capture={before}
              scale={scale}
              alt={`Before: the Bookable homepage on the NHS design system, ${device}`}
            />
          </m.div>
        </m.div>
      </m.div>
      <WipeDivider divider={divider} />
      <VersionLabels device={device} divider={divider} />
    </m.div>
  );
}
```

`src/components/ComparisonStage.tsx`:
```tsx
import { useMotionValue } from "motion/react";
import { useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import { DeviceFrame } from "./DeviceFrame";
import { StageViewport } from "./StageViewport";

function mapFor(device: Device): SectionMap {
  const after = captureFor("after", device);
  return createSectionMap(after, captureFor("before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage() {
  const [device] = useState<Device>(initialDevice);
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(0.5);
  const after = captureFor("after", device);
  return (
    <section
      aria-label="Before and after comparison"
      data-group={group}
      className="relative mx-auto w-full max-w-[1480px] px-4 sm:px-6"
    >
      <div className="grid h-[min(80svh,900px)] min-h-[440px] place-items-center [container-type:size]">
        <DeviceFrame device={device} viewport={after.viewport}>
          <StageViewport
            key={device}
            device={device}
            divider={divider}
            map={MAPS[device]}
            initialScroll={0}
            onGroupChange={setGroup}
          />
        </DeviceFrame>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Mount the stage**

In `src/App.tsx`, add the import:
```tsx
import { ComparisonStage } from "./components/ComparisonStage";
```
and replace:
```tsx
          <GlowBackground />
          <CaseHeader />
```
with:
```tsx
          <GlowBackground />
          <CaseHeader />
          <main className="pb-24">
            <ComparisonStage />
          </main>
```

- [ ] **Step 8: Run the tests and review**

Run: `pnpm e2e && pnpm review`
Expected: all tests pass (6 so far). Open `.capture/review/02-stage.png`, `03-stage-how.png`, `07-phone-top.png` and `07-phone-stage.png` and check:
- The browser frame shows the before hero left of the divider and the after hero right of it, labelled.
- Scrolled to How it works, both halves show How it works.
- On the phone, a phone frame fills the width with no sideways overflow.

Then drag the divider and scroll inside the frame by hand in `pnpm dev` (http://localhost:5173). Both should feel smooth, with no seam lag at the divider while scrolling.

- [ ] **Step 9: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Add the comparison stage: device frame, wipe divider and section-locked scroll" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: Sticky header overlay and live loops

**Files:**
- Create: `src/components/StickyHeaderOverlay.tsx`, `src/components/LiveLoop.tsx`, `e2e/layers.spec.ts`
- Modify: `src/components/PageLayer.tsx` (rewrite), `src/components/StageViewport.tsx` (rewrite), `src/components/ComparisonStage.tsx` (pass `live`)

**Interfaces:**
- Consumes: Task 9's stage, `useFrameScroll`'s `scrollA`/`scrollB`, `assetUrl`, `useMotionPreference`.
- Produces: `StageViewport` gains the required prop `live: boolean`; `PageLayer` gains `live: boolean` and `root: RefObject<Element | null>`; test ids `header-top`, `header-scrolled`, `live-loop`.

Stacking inside the viewport, bottom to top:
1. The after scroller.
2. The after header overlay, so it shows only right of the divider.
3. The clipped before layer, with its own overlay if it has one.
4. The divider.
5. The labels.

A loop stays invisible until it is actually playing, so the still underneath shows whenever a video is loading, blocked or broken.

- [ ] **Step 1: Write the failing tests**

`e2e/layers.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { captureOf } from "./captureData";
import { scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("after", "desktop");

test("the v2 header lies clear over the hero and turns solid once the page moves", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  const solid = page.getByTestId("header-scrolled");
  await expect(solid).toHaveCSS("opacity", "0");
  await scrollAfterTo(page, 120);
  await expect(solid).toHaveCSS("opacity", "1");
  await scrollAfterTo(page, 0);
  await expect(solid).toHaveCSS("opacity", "0");
});

test("plays the captured loops on the after page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(AFTER.loops.length);
  await stageRegion(page).scrollIntoViewIfNeeded();
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
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  const opacities = await page
    .getByTestId("live-loop")
    .evaluateAll((videos) => videos.map((video) => getComputedStyle(video).opacity));
  expect(opacities).toEqual(AFTER.loops.map(() => "0"));
  await expect(page.getByTestId("after-scroller").locator("img").first()).toBeVisible();
});

test("@review the solid header", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await scrollAfterTo(page, 400);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/03b-header-solid.png" });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm e2e e2e/layers.spec.ts`
Expected: 3 tests FAIL (no `header-scrolled`, no `live-loop`).

- [ ] **Step 3: Write the overlay and the loop**

`src/components/StickyHeaderOverlay.tsx`:
```tsx
import { type MotionValue, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { assetUrl } from "../data/captures";
import type { StickyHeader } from "../data/types";

type StickyHeaderOverlayProps = {
  header: StickyHeader;
  width: number;
  scale: number;
  scroll: MotionValue<number>;
};

export function StickyHeaderOverlay({ header, width, scale, scroll }: StickyHeaderOverlayProps) {
  const [scrolled, setScrolled] = useState(() => scroll.get() >= header.flipAt);
  useMotionValueEvent(scroll, "change", (pagePx) => setScrolled(pagePx >= header.flipAt));
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ width, transform: `scale(${scale})` }}
    >
      {header.states.map((state) => (
        <div
          key={state.id}
          data-testid={`header-${state.id}`}
          className="absolute top-0 left-0 transition-opacity duration-[250ms]"
          style={{
            width,
            height: state.height,
            opacity: (state.id === "scrolled") === scrolled ? 1 : 0,
            backdropFilter: state.blur === null ? undefined : `blur(${state.blur}px)`,
          }}
        >
          <img
            src={assetUrl(state.src)}
            alt=""
            width={width}
            height={state.height}
            className="block max-w-none"
            style={{ width, height: state.height }}
          />
        </div>
      ))}
    </div>
  );
}
```

`src/components/LiveLoop.tsx`:
```tsx
import { useInView } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { assetUrl } from "../data/captures";
import type { Loop } from "../data/types";

type LiveLoopProps = { loop: Loop; root: RefObject<Element | null> };

export function LiveLoop({ loop, root }: LiveLoopProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const inView = useInView(video, { root, margin: "300px 0px" });

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setArmed(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setArmed(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (armed) video.current?.load();
  }, [armed]);

  useEffect(() => {
    const element = video.current;
    if (!element || !armed) return;
    if (inView) {
      element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }, [armed, inView]);

  const [topLeft, topRight, bottomRight, bottomLeft] = loop.radius;
  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      preload={armed ? "auto" : "none"}
      aria-hidden="true"
      data-testid="live-loop"
      onPlaying={() => setPlaying(true)}
      className="absolute max-w-none object-cover transition-opacity duration-300"
      style={{
        left: loop.rect.x,
        top: loop.rect.y,
        width: loop.rect.width,
        height: loop.rect.height,
        borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
        opacity: playing ? 1 : 0,
      }}
    >
      {armed && (
        <>
          <source src={assetUrl(loop.webm)} type='video/webm; codecs="vp9"' />
          <source src={assetUrl(loop.mp4)} type="video/mp4" />
        </>
      )}
    </video>
  );
}
```

Sources are added only once the page is idle, and `load()` then picks them up. Safari has no `requestIdleCallback`, so it falls back to a 1.5s timer.

- [ ] **Step 4: Rewrite `src/components/PageLayer.tsx`**

```tsx
import type { RefObject } from "react";
import type { Capture } from "../data/types";
import { LiveLoop } from "./LiveLoop";
import { PageTile } from "./PageTile";

type PageLayerProps = {
  capture: Capture;
  scale: number;
  alt: string;
  live: boolean;
  root: RefObject<Element | null>;
};

export function PageLayer({ capture, scale, alt, live, root }: PageLayerProps) {
  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: capture.viewport.width,
        height: capture.pageHeight,
        transform: `scale(${scale})`,
      }}
    >
      {capture.tiles.map((tile, index) => (
        <PageTile
          key={tile.webp}
          tile={tile}
          width={capture.viewport.width}
          eager={index === 0}
          alt={index === 0 ? alt : ""}
        />
      ))}
      {live && capture.loops.map((loop) => <LiveLoop key={loop.id} loop={loop} root={root} />)}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/StageViewport.tsx`**

```tsx
import {
  type AnimationPlaybackControls,
  animate,
  m,
  type MotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useElementSize } from "../hooks/useElementSize";
import { useFrameScroll } from "../hooks/useFrameScroll";
import { useMotionPreference } from "../hooks/useMotionPreference";
import type { SectionMap } from "../lib/sectionMap";
import { PageLayer } from "./PageLayer";
import { StickyHeaderOverlay } from "./StickyHeaderOverlay";
import { VersionLabels } from "./VersionLabels";
import { WipeDivider } from "./WipeDivider";

export type StageViewportHandle = {
  scrollTo: (pagePx: number) => void;
  glideTo: (pagePx: number, seconds: number) => void;
  getScroll: () => number;
};

type StageViewportProps = {
  device: Device;
  divider: MotionValue<number>;
  map: SectionMap;
  live: boolean;
  initialScroll: number;
  onGroupChange: (id: SectionId) => void;
  ref?: Ref<StageViewportHandle>;
};

const GLIDE_EASE = [0.65, 0, 0.35, 1] as const;
const INTERRUPTIONS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

export function StageViewport({
  device,
  divider,
  map,
  live,
  initialScroll,
  onGroupChange,
  ref,
}: StageViewportProps) {
  const { reduced } = useMotionPreference();
  const before = captureFor("before", device);
  const after = captureFor("after", device);
  const [measure, size] = useElementSize<HTMLDivElement>();
  const scale = size.width / after.viewport.width;
  const scroller = useRef<HTMLElement>(null);
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const group = useRef<SectionId>(map.groupAt(initialScroll));
  const { scrollA, scrollB, beforeY } = useFrameScroll(scroller, map, scale, initialScroll);
  const outerX = useTransform(divider, (share) => `${(share - 1) * 100}%`);
  const innerX = useTransform(divider, (share) => `${(1 - share) * 100}%`);

  useMotionValueEvent(scrollA, "change", (pagePx) => {
    const next = map.groupAt(pagePx);
    if (next === group.current) return;
    group.current = next;
    onGroupChange(next);
  });

  useEffect(() => {
    onGroupChange(group.current);
  }, [onGroupChange]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const cancelGlide = () => {
      glide.current?.stop();
      glide.current = null;
    };
    for (const name of INTERRUPTIONS) element.addEventListener(name, cancelGlide, { passive: true });
    return () => {
      for (const name of INTERRUPTIONS) element.removeEventListener(name, cancelGlide);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(pagePx) {
        const element = scroller.current;
        if (element && scale > 0) element.scrollTop = pagePx * scale;
      },
      glideTo(pagePx, seconds) {
        const element = scroller.current;
        if (!element || scale === 0) return;
        glide.current?.stop();
        if (seconds === 0) {
          element.scrollTop = pagePx * scale;
          return;
        }
        glide.current = animate(element.scrollTop, pagePx * scale, {
          duration: seconds,
          ease: GLIDE_EASE,
          onUpdate: (value) => {
            element.scrollTop = value;
          },
        });
      },
      getScroll: () => scrollA.get(),
    }),
    [scale, scrollA],
  );

  return (
    <m.div
      ref={measure}
      layout
      data-testid="stage-viewport"
      data-scale={scale}
      className="absolute inset-0 overflow-hidden bg-white"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.35 }}
    >
      <section
        ref={scroller}
        data-testid="after-scroller"
        aria-label="After: the v2 homepage. Scroll to move both versions together."
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none]"
      >
        <div className="relative" style={{ height: after.pageHeight * scale }}>
          <PageLayer
            capture={after}
            scale={scale}
            live={live}
            root={scroller}
            alt={`After: the Bookable homepage on its own design system, ${device}`}
          />
        </div>
      </section>
      {after.header && (
        <StickyHeaderOverlay
          header={after.header}
          width={after.viewport.width}
          scale={scale}
          scroll={scrollA}
        />
      )}
      <m.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ x: outerX }}>
        <m.div className="absolute inset-0" style={{ x: innerX }}>
          <m.div data-testid="before-page" className="absolute inset-x-0 top-0" style={{ y: beforeY }}>
            <PageLayer
              capture={before}
              scale={scale}
              live={false}
              root={scroller}
              alt={`Before: the Bookable homepage on the NHS design system, ${device}`}
            />
          </m.div>
          {before.header && (
            <StickyHeaderOverlay
              header={before.header}
              width={before.viewport.width}
              scale={scale}
              scroll={scrollB}
            />
          )}
        </m.div>
      </m.div>
      <WipeDivider divider={divider} />
      <VersionLabels device={device} divider={divider} />
    </m.div>
  );
}
```

- [ ] **Step 6: Pass `live` from the stage**

In `src/components/ComparisonStage.tsx`, add the import:
```tsx
import { useMotionPreference } from "../hooks/useMotionPreference";
```
add as the first line inside `ComparisonStage`:
```tsx
  const { reduced } = useMotionPreference();
```
and add the prop to `<StageViewport`:
```tsx
            live={!reduced}
```

- [ ] **Step 7: Run the tests and review**

Run: `pnpm e2e && pnpm review`
Expected: all tests pass (9). Then open the review images:
- In `.capture/review/02-stage.png` the after hero now shows its header.
- In `.capture/review/03b-header-solid.png` the after side shows the solid, blurred header over scrolled content, with no doubled header.
- In `pnpm dev`, the hero reel and the How it works vignettes move on the after side only, and nothing visibly jumps when a loop restarts.

- [ ] **Step 8: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Pin the v2 header in the frame and play the captured loops on the after page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Section rail, "what changed" callouts and the device switch

**Files:**
- Create: `src/data/changes.ts`, `src/components/SectionRail.tsx`, `src/components/ChangeCallouts.tsx`, `src/components/DeviceToggle.tsx`, `src/components/StageControls.tsx`, `e2e/navigation.spec.ts`
- Modify: `src/components/ComparisonStage.tsx` (rewrite)

**Interfaces:**
- Consumes: `StageViewportHandle` (Task 9), `SECTION_IDS`/`SECTION_LABELS` (Task 2), `useMotionPreference` (Task 8).
- Produces:
  - `CHANGES: Record<SectionId, readonly string[]>`.
  - `type RailLayout = "responsive" | "vertical" | "horizontal"`; `SectionRail({ active, onSelect, layout })`.
  - `ChangeCallouts({ group })`, `DeviceToggle({ device, onChange })`, `StageControls({ device, onDeviceChange })`.
  - The rail buttons are named after `SECTION_LABELS`; the device buttons are named "Desktop" and "Mobile".

Switching device keeps the section: the stage reads the current group from the old device's map, then opens the new device at that group's scroll position.

- [ ] **Step 1: Verify the callout claims against both builds**

Run:
```bash
W="${CAPTURE_WORK_DIR:-$(node -p "require('os').tmpdir()")/bookable-before-after}"
grep -c "Common questions about finding an NHS GP in" "$W/before/packages/bookable/app/_components/landing/LandingFaq.tsx"
grep -c "Questions before you start" "$W/after/packages/bookable/app/page.tsx"
grep -c "Looking for a GP in a specific city?" "$W/before/packages/bookable/app/_components/landing/LandingTags.tsx"
grep -c "Find an NHS GP surgery in your area" "$W/after/packages/bookable/app/page.tsx"
grep -c "Or browse where Bookable is live" "$W/after/packages/bookable/app/_components/landing/LandingAreaCta.tsx"
grep -c "Icon" "$W/before/packages/bookable/app/_components/landing/LandingHowItWorks.tsx"
grep -c "vignette" "$W/after/packages/bookable/app/_components/landing/LandingHowItWorks.tsx"
grep -c "scrollY <= 0" "$W/after/packages/bookable/app/_ui/HeroSiteHeader.tsx"
grep -c "thrown further than anywhere else it stands" "$W/after/packages/bookable/app/_ui/tokens.ts"
```
Expected: every count is 1 or more. If any is 0, rewrite that note in Step 3 to match what the source says before going on.

- [ ] **Step 2: Write the failing tests**

`e2e/navigation.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("after", "desktop");

test("the rail follows the scroll", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "areas"));
  await expect(page.getByRole("button", { name: "Areas" })).toHaveAttribute("aria-current", "true");
});

test("the rail glides the frame to a section and shows what changed there", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  await expect(
    page.getByText("Icons give way to looping product vignettes for each step."),
  ).toBeVisible();
});

test("switching device keeps the section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stageRegion(page)).toHaveAttribute("data-group", "faq-about");
  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/after\/mobile\//,
  );
  await expect(stageRegion(page)).toHaveAttribute("data-group", "faq-about");
});

test("@review the mobile frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Mobile" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/04-stage-mobile.png" });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm e2e e2e/navigation.spec.ts`
Expected: 3 tests FAIL (no rail, no device buttons).

- [ ] **Step 4: Write the copy and the components**

`src/data/changes.ts`:
```ts
import type { SectionId } from "./types";

export const CHANGES: Record<SectionId, readonly string[]> = {
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
};
```

`src/components/SectionRail.tsx`:
```tsx
import { m } from "motion/react";
import { SECTION_IDS, SECTION_LABELS } from "../data/sections";
import type { SectionId } from "../data/types";

export type RailLayout = "responsive" | "vertical" | "horizontal";

type SectionRailProps = {
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

export function SectionRail({ active, onSelect, layout }: SectionRailProps) {
  return (
    <nav aria-label="Homepage sections">
      <ol className={LIST[layout]}>
        {SECTION_IDS.map((id) => (
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
              <span className="relative">{SECTION_LABELS[id]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

`src/components/ChangeCallouts.tsx`:
```tsx
import { AnimatePresence, m } from "motion/react";
import { CHANGES } from "../data/changes";
import { SECTION_LABELS } from "../data/sections";
import type { SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";

type ChangeCalloutsProps = { group: SectionId };

const LIST = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } };
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ChangeCallouts({ group }: ChangeCalloutsProps) {
  const { reduced } = useMotionPreference();
  return (
    <aside aria-labelledby="callouts-heading" className="max-w-[420px]">
      <p id="callouts-heading" className="caption text-mint">
        What changed · {SECTION_LABELS[group]}
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
          {CHANGES[group].map((note) => (
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

`src/components/DeviceToggle.tsx`:
```tsx
import { m } from "motion/react";
import type { Device } from "../data/types";

type DeviceToggleProps = { device: Device; onChange: (device: Device) => void };

const OPTIONS: readonly { device: Device; label: string }[] = [
  { device: "desktop", label: "Desktop" },
  { device: "mobile", label: "Mobile" },
];

export function DeviceToggle({ device, onChange }: DeviceToggleProps) {
  return (
    <fieldset className="inline-flex rounded-full border border-line bg-white/[0.04] p-1">
      <legend className="sr-only">Device</legend>
      {OPTIONS.map((option) => (
        <button
          key={option.device}
          type="button"
          aria-pressed={device === option.device}
          onClick={() => onChange(option.device)}
          className="relative rounded-full px-4 py-1.5 font-bold text-mist/70 text-sm aria-pressed:text-ink"
        >
          {device === option.device && (
            <m.span
              layoutId="device-pill"
              className="absolute inset-0 rounded-full bg-mist"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <span className="relative">{option.label}</span>
        </button>
      ))}
    </fieldset>
  );
}
```

`src/components/StageControls.tsx`:
```tsx
import type { Device } from "../data/types";
import { DeviceToggle } from "./DeviceToggle";

type StageControlsProps = { device: Device; onDeviceChange: (device: Device) => void };

export function StageControls({ device, onDeviceChange }: StageControlsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <DeviceToggle device={device} onChange={onDeviceChange} />
      <p className="text-mist/50 text-sm">Drag the divider · scroll inside the frame</p>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/ComparisonStage.tsx`**

```tsx
import { useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

function mapFor(device: Device): SectionMap {
  const after = captureFor("after", device);
  return createSectionMap(after, captureFor("before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

const LAYOUT = {
  grid: "grid gap-5 @min-[1100px]/stage:h-[min(86svh,940px)] @min-[1100px]/stage:min-h-[600px] @min-[1100px]/stage:grid-cols-[160px_minmax(0,1fr)_300px] @min-[1100px]/stage:gap-8",
  frame:
    "grid h-[min(78svh,760px)] min-h-[420px] place-items-center [container-type:size] @min-[1100px]/stage:h-auto @min-[1100px]/stage:min-h-0",
  side: "min-w-0 @min-[1100px]/stage:self-center",
};

function initialDevice(): Device {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function ComparisonStage() {
  const { reduced } = useMotionPreference();
  const [device, setDevice] = useState<Device>(initialDevice);
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(0.5);
  const viewport = useRef<StageViewportHandle>(null);
  const deviceRef = useRef(device);
  const pendingScroll = useRef(0);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const changeDevice = useCallback((next: Device) => {
    const current = deviceRef.current;
    if (next === current) return;
    const scroll = viewport.current?.getScroll() ?? 0;
    pendingScroll.current = MAPS[next].scrollForGroup(MAPS[current].groupAt(scroll));
    setDevice(next);
  }, []);

  const glideTo = useCallback(
    (id: SectionId) => {
      viewport.current?.glideTo(MAPS[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [reduced],
  );

  const after = captureFor("after", device);
  return (
    <section
      aria-label="Before and after comparison"
      data-group={group}
      className="@container/stage relative mx-auto w-full max-w-[1480px] px-4 sm:px-6"
    >
      <div className={LAYOUT.grid}>
        <div className={LAYOUT.side}>
          <SectionRail active={group} onSelect={glideTo} layout="responsive" />
        </div>
        <div className={LAYOUT.frame}>
          <DeviceFrame device={device} viewport={after.viewport}>
            <StageViewport
              key={device}
              ref={viewport}
              device={device}
              divider={divider}
              map={MAPS[device]}
              live={!reduced}
              initialScroll={pendingScroll.current}
              onGroupChange={setGroup}
            />
          </DeviceFrame>
        </div>
        <div className={LAYOUT.side}>
          <ChangeCallouts group={group} />
        </div>
      </div>
      <StageControls device={device} onDeviceChange={changeDevice} />
    </section>
  );
}
```

- [ ] **Step 6: Run the tests and review**

Run: `pnpm e2e && pnpm review`
Expected: all tests pass (12). Then check the review images:
- `.capture/review/02-stage.png`: the rail sits left of the frame, with a mint pill on "Hero", and the hero's three notes sit on the right.
- `.capture/review/04-stage-mobile.png`: the phone frame with the rail and notes either side.
- `07-phone-stage.png`: the rail scrolls sideways above the frame and the notes sit below.

In `pnpm dev`, click through the rail. The frame should glide, the pill should slide, and the notes should swap with a short stagger.

- [ ] **Step 7: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Add the section rail, what-changed notes and the desktop/mobile switch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 12: Play, recording mode and reduced motion

**Files:**
- Create: `src/hooks/usePlayback.ts`, `src/components/PlayIcon.tsx`, `src/components/PlayButton.tsx`, `e2e/playback.spec.ts`
- Modify: `src/components/StageControls.tsx` (rewrite), `src/components/ComparisonStage.tsx` (rewrite), `src/App.tsx` (rewrite)

**Interfaces:**
- Consumes: `FULL_TOUR`, `SHORT_TOUR`, `stateAt`, `durationOf` (Task 3); `UrlOptions`, `RecordAspect` (Task 3); `StageViewportHandle.scrollTo` (Task 9); `RailLayout` (Task 11).
- Produces:
  - `type PlaybackTargets = { divider: MotionValue<number>; resolve: ScrollResolver; setDevice(device: Device, scrollTop: number): void; scrollTo(pagePx: number, device: Device): void }`.
  - `usePlayback(script, targets, { loop, cut }): { playing; play; stop }`; `LOOP_HOLD_MS = 1000`.
  - `ComparisonStage({ options: UrlOptions })`; the Play button is named "Play", or "Stop" while playing.

Any `pointerdown`, `wheel`, `keydown` or `touchstart` inside the stage stops Play, except on the Play button itself. In recording mode the stage alone fills the window, letterboxed to the aspect, with no controls and no cursor, and the tour loops.

- [ ] **Step 1: Write the failing tests**

`e2e/playback.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { stageRegion } from "./stageHelpers";

const SLIDER = { name: "Divider between before and after" };

test("Play runs the tour on its own", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  const slider = page.getByRole("slider", SLIDER);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("any input during Play stops it", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(600);
  const viewport = await page.getByTestId("stage-viewport").boundingBox();
  if (!viewport) throw new Error("The stage has not laid out");
  await page.mouse.move(viewport.x + viewport.width * 0.7, viewport.y + viewport.height * 0.5);
  await page.mouse.wheel(0, 120);
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  const slider = page.getByRole("slider", SLIDER);
  const held = await slider.inputValue();
  await page.waitForTimeout(500);
  await expect(slider).toHaveValue(held);
});

test("recording mode hides the controls and plays on its own", async ({ page }) => {
  await page.goto("/?record=16x9");
  await expect(page.getByRole("button", { name: /^(Play|Stop)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  const slider = page.getByRole("slider", SLIDER);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("with reduced motion the loops stay off and Play cuts instead of sweeping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(0);
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("slider", SLIDER)).toHaveValue("0", { timeout: 400 });
});

test("@review the recording frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: ".capture/review/08-record-16x9.png" });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm e2e e2e/playback.spec.ts`
Expected: 4 tests FAIL (no Play button; recording mode still shows the page).

- [ ] **Step 3: Write the playback hook**

`src/hooks/usePlayback.ts`:
```ts
import type { MotionValue } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Device } from "../data/types";
import { durationOf, type PlayScript, type ScrollResolver, stateAt } from "../lib/playScript";

export const LOOP_HOLD_MS = 1000;

export type PlaybackTargets = {
  divider: MotionValue<number>;
  resolve: ScrollResolver;
  setDevice: (device: Device, scrollTop: number) => void;
  scrollTo: (pagePx: number, device: Device) => void;
};

export type PlaybackOptions = { loop: boolean; cut: boolean };

export type Playback = { playing: boolean; play: () => void; stop: () => void };

export function usePlayback(
  script: PlayScript,
  targets: PlaybackTargets,
  options: PlaybackOptions,
): Playback {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const latest = useRef({ script, targets, options });

  useLayoutEffect(() => {
    latest.current = { script, targets, options };
  });

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const stop = useCallback(() => {
    cancel();
    setPlaying(false);
  }, [cancel]);

  const play = useCallback(() => {
    cancel();
    setPlaying(true);
    const startedAt = performance.now();
    let device: Device | null = null;
    const tick = (now: number) => {
      const { script: current, targets: on, options: mode } = latest.current;
      const duration = durationOf(current);
      const elapsed = mode.loop ? (now - startedAt) % (duration + LOOP_HOLD_MS) : now - startedAt;
      const state = stateAt(current, elapsed, on.resolve, mode.cut);
      if (state.device !== device) {
        device = state.device;
        on.setDevice(device, state.scrollTop);
      }
      on.divider.set(state.divider);
      on.scrollTo(state.scrollTop, state.device);
      if (!mode.loop && elapsed >= duration) {
        frame.current = null;
        setPlaying(false);
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { playing, play, stop };
}
```

- [ ] **Step 4: Write the Play button and controls**

`src/components/PlayIcon.tsx`:
```tsx
type PlayIconProps = { playing: boolean };

export function PlayIcon({ playing }: PlayIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      {playing ? (
        <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
      ) : (
        <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z" />
      )}
    </svg>
  );
}
```

`src/components/PlayButton.tsx`:
```tsx
import { PlayIcon } from "./PlayIcon";

type PlayButtonProps = { playing: boolean; onToggle: () => void };

export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  return (
    <button
      type="button"
      data-play-button=""
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 font-extrabold text-ink text-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2"
    >
      <PlayIcon playing={playing} />
      {playing ? "Stop" : "Play"}
    </button>
  );
}
```

Rewrite `src/components/StageControls.tsx`:
```tsx
import type { Device } from "../data/types";
import { DeviceToggle } from "./DeviceToggle";
import { PlayButton } from "./PlayButton";

type StageControlsProps = {
  device: Device;
  onDeviceChange: (device: Device) => void;
  playing: boolean;
  onTogglePlay: () => void;
};

export function StageControls({ device, onDeviceChange, playing, onTogglePlay }: StageControlsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <DeviceToggle device={device} onChange={onDeviceChange} />
      <PlayButton playing={playing} onToggle={onTogglePlay} />
      <p className="text-mist/50 text-sm">Drag the divider · scroll inside the frame</p>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/ComparisonStage.tsx`**

```tsx
import { useMotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { captureFor } from "../data/captures";
import type { Device, SectionId } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { type PlaybackTargets, usePlayback } from "../hooks/usePlayback";
import { FULL_TOUR, SHORT_TOUR } from "../lib/playScript";
import { createSectionMap, type SectionMap } from "../lib/sectionMap";
import type { RecordAspect, UrlOptions } from "../lib/urlOptions";
import { ChangeCallouts } from "./ChangeCallouts";
import { DeviceFrame } from "./DeviceFrame";
import { type RailLayout, SectionRail } from "./SectionRail";
import { StageControls } from "./StageControls";
import { StageViewport, type StageViewportHandle } from "./StageViewport";

type ComparisonStageProps = { options: UrlOptions };

type StageLayout = {
  root: string;
  box: string;
  grid: string;
  frame: string;
  side: string;
  rail: RailLayout;
};

function mapFor(device: Device): SectionMap {
  const after = captureFor("after", device);
  return createSectionMap(after, captureFor("before", device), after.viewport.height);
}

const MAPS: Record<Device, SectionMap> = { desktop: mapFor("desktop"), mobile: mapFor("mobile") };

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

export function ComparisonStage({ options }: ComparisonStageProps) {
  const { reduced } = useMotionPreference();
  const layout = options.record === null ? PAGE_LAYOUT : RECORD_LAYOUTS[options.record];
  const [device, setDevice] = useState<Device>(() =>
    options.record === null ? initialDevice() : "desktop",
  );
  const [group, setGroup] = useState<SectionId>("hero");
  const divider = useMotionValue(options.record === null ? 0.5 : 1);
  const stage = useRef<HTMLElement>(null);
  const viewport = useRef<StageViewportHandle>(null);
  const deviceRef = useRef(device);
  const pendingScroll = useRef(0);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const changeDevice = useCallback((next: Device) => {
    const current = deviceRef.current;
    if (next === current) return;
    const scroll = viewport.current?.getScroll() ?? 0;
    pendingScroll.current = MAPS[next].scrollForGroup(MAPS[current].groupAt(scroll));
    setDevice(next);
  }, []);

  const targets = useMemo<PlaybackTargets>(
    () => ({
      divider,
      resolve: (forDevice, target) => (target === "top" ? 0 : MAPS[forDevice].scrollForGroup(target)),
      setDevice: (next, scrollTop) => {
        pendingScroll.current = scrollTop;
        setDevice(next);
      },
      scrollTo: (pagePx, onDevice) => {
        if (onDevice === deviceRef.current) viewport.current?.scrollTo(pagePx);
      },
    }),
    [divider],
  );

  const script = options.tour === "short" ? SHORT_TOUR : FULL_TOUR;
  const { playing, play, stop } = usePlayback(script, targets, {
    loop: options.record !== null,
    cut: reduced,
  });

  useEffect(() => {
    if (options.record !== null) play();
  }, [options.record, play]);

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
      viewport.current?.glideTo(MAPS[deviceRef.current].scrollForGroup(id), reduced ? 0 : 0.9);
    },
    [reduced],
  );

  const after = captureFor("after", device);
  return (
    <section
      ref={stage}
      aria-label="Before and after comparison"
      data-group={group}
      className={layout.root}
    >
      <div className={layout.box}>
        <div className={layout.grid}>
          <div className={layout.side}>
            <SectionRail active={group} onSelect={glideTo} layout={layout.rail} />
          </div>
          <div className={layout.frame}>
            <DeviceFrame device={device} viewport={after.viewport}>
              <StageViewport
                key={device}
                ref={viewport}
                device={device}
                divider={divider}
                map={MAPS[device]}
                live={!reduced}
                initialScroll={pendingScroll.current}
                onGroupChange={setGroup}
              />
            </DeviceFrame>
          </div>
          <div className={layout.side}>
            <ChangeCallouts group={group} />
          </div>
        </div>
        {options.record === null && (
          <StageControls
            device={device}
            onDeviceChange={changeDevice}
            playing={playing}
            onTogglePlay={playing ? stop : play}
          />
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Rewrite `src/App.tsx` for recording mode**

```tsx
import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { CaseHeader } from "./components/CaseHeader";
import { ComparisonStage } from "./components/ComparisonStage";
import { GlowBackground } from "./components/GlowBackground";
import { MotionPreferenceContext } from "./hooks/useMotionPreference";
import { parseUrlOptions } from "./lib/urlOptions";

const loadFeatures = () => import("./motionFeatures").then((module) => module.default);

export function App() {
  const options = useMemo(() => parseUrlOptions(window.location.search), []);
  const systemReduced = useReducedMotion() ?? false;
  const preference = useMemo(
    () => ({ reduced: systemReduced && options.record === null }),
    [systemReduced, options.record],
  );
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={options.record === null ? "user" : "never"}>
        <MotionPreferenceContext value={preference}>
          {options.record === null ? (
            <>
              <GlowBackground />
              <CaseHeader />
              <main className="pb-24">
                <ComparisonStage options={options} />
              </main>
            </>
          ) : (
            <ComparisonStage options={options} />
          )}
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
```

- [ ] **Step 7: Run the tests and review**

Run: `pnpm e2e && pnpm review`
Expected: all tests pass (16). Open `.capture/review/08-record-16x9.png`: the frame, rail and notes fill a 16:9 box on the dark ground, with no controls showing.

Then check by hand:
- In `pnpm dev`, press Play and watch the whole tour: opening sweep, five stops, the morph to the phone, the phone sweep, two stops, and back to desktop.
- Then open `http://localhost:5173/?record=4x3&tour=short`. It should loop with a 1s hold between runs.

- [ ] **Step 8: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "Add Play, the recording mode for shots, and reduced-motion behaviour" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 13: The design-system diff

**Files:**
- Create: `src/lib/tokenFormat.ts`, `src/lib/tokenFormat.test.ts`, `src/components/Crossfade.tsx`, `src/components/TokenCard.tsx`, `src/components/TypefaceDemo.tsx`, `src/components/HeadlineDemo.tsx`, `src/components/CornersDemo.tsx`, `src/components/ElevationDemo.tsx`, `src/components/HeroGroundDemo.tsx`, `src/components/PaletteDemo.tsx`, `src/components/DesignDiff.tsx`, `e2e/design-diff.spec.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CAPTURES`, `captureFor`, `assetUrl` (Task 9); `MeasuredTokens`, `PaletteGroup`, `Version` (Task 2); `useMotionPreference` (Task 8).
- Produces: `typefaceName`, `headlineSummary`, `splitTopLevel`, `shadowSummary`, `rgbToHex`, `groundSummary`, `colourCount` (`src/lib/tokenFormat.ts`); `TokenCard({ title, beforeValue, afterValue, children: (state: Version) => ReactNode })`; `Crossfade({ state, before, after })`; the section `aria-labelledby` "The system underneath".

Every value on a card comes from the capture: computed styles measured on the running pages, and palettes and radii read from each commit's token files. Nothing is typed in by hand.

- [ ] **Step 1: Write the failing formatting tests**

`src/lib/tokenFormat.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  colourCount,
  groundSummary,
  headlineSummary,
  rgbToHex,
  shadowSummary,
  splitTopLevel,
  typefaceName,
} from "./tokenFormat";

describe("typefaceName", () => {
  it("names the faces behind next/font's generated families", () => {
    expect(typefaceName("__frutiger_5a2b7c, __frutiger_Fallback_5a2b7c")).toBe("Frutiger");
    expect(
      typefaceName('"__Hanken_Grotesk_a1b2c3", "__Hanken_Grotesk_Fallback_a1b2c3", system-ui'),
    ).toBe("Hanken Grotesk");
    expect(typefaceName('"Helvetica Neue", Arial')).toBe("Helvetica Neue");
  });
});

describe("headlineSummary", () => {
  it("joins size, leading, weight and tracking", () => {
    const base = { fontFamily: "x", fontSize: "64px", fontWeight: "600" };
    expect(headlineSummary({ ...base, lineHeight: "72px", letterSpacing: "normal" })).toBe(
      "64px / 72px · 600 · no tracking",
    );
    expect(
      headlineSummary({ ...base, lineHeight: "64px", letterSpacing: "-2.24px", fontWeight: "800" }),
    ).toBe("64px / 64px · 800 · -2.24px tracking");
  });
});

describe("splitTopLevel", () => {
  it("splits on commas outside brackets", () => {
    expect(splitTopLevel("a(1, 2), b, c(3)")).toEqual(["a(1, 2)", "b", "c(3)"]);
  });
});

describe("shadowSummary", () => {
  it("counts the layers and finds the deepest blur", () => {
    expect(
      shadowSummary("rgba(0, 0, 0, 0.24) 0px 8px 48px 0px, rgb(216, 221, 224) 0px 4px 0px 0px"),
    ).toBe("2 layers, up to 48px blur");
    expect(shadowSummary("rgba(3, 20, 45, 0.42) 0px 30px 72px 0px")).toBe("1 layer, 72px blur");
    expect(shadowSummary("none")).toBe("No shadow");
  });
});

describe("groundSummary", () => {
  it("describes a flat colour by its hex", () => {
    expect(rgbToHex("rgb(0, 94, 184)")).toBe("#005EB8");
    expect(groundSummary("rgb(0, 94, 184)")).toBe("Flat #005EB8");
  });

  it("counts a radial gradient's stops", () => {
    expect(
      groundSummary(
        "radial-gradient(125% 130% at 12% 0%, rgb(19, 135, 204) 0%, rgb(10, 99, 172) 40%, rgb(8, 63, 128) 72%, rgb(5, 47, 96) 100%)",
      ),
    ).toBe("Radial gradient, 4 stops");
  });
});

describe("colourCount", () => {
  it("counts every swatch in every group", () => {
    expect(
      colourCount([
        { name: "blue", swatches: [{ name: "blue", hex: "#005EB8" }, { name: "blue-dark", hex: "#002F5C" }] },
        { name: "green", swatches: [{ name: "green", hex: "#007F3B" }] },
      ]),
    ).toBe(3);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm test src/lib/tokenFormat.test.ts`
Expected: FAIL, `Failed to resolve import "./tokenFormat"`.

- [ ] **Step 3: Implement the formatting**

`src/lib/tokenFormat.ts`:
```ts
import type { MeasuredTokens, PaletteGroup } from "../data/types";

export function typefaceName(fontFamily: string): string {
  const family = fontFamily.toLowerCase();
  if (family.includes("frutiger")) return "Frutiger";
  if (family.includes("hanken")) return "Hanken Grotesk";
  return (fontFamily.split(",")[0] ?? fontFamily).replace(/["']/g, "").trim();
}

export function headlineSummary(headline: MeasuredTokens["headline"]): string {
  const tracking =
    headline.letterSpacing === "normal" ? "no tracking" : `${headline.letterSpacing} tracking`;
  return `${headline.fontSize} / ${headline.lineHeight} · ${headline.fontWeight} · ${tracking}`;
}

export function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function shadowSummary(boxShadow: string): string {
  if (boxShadow === "none") return "No shadow";
  const layers = splitTopLevel(boxShadow);
  const blurs = layers.map((layer) => {
    const lengths = layer.replace(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi, "").match(/-?[\d.]+px/g) ?? [];
    return Number.parseFloat(lengths[2] ?? "0");
  });
  const deepest = Math.max(...blurs);
  return layers.length === 1
    ? `1 layer, ${deepest}px blur`
    : `${layers.length} layers, up to ${deepest}px blur`;
}

export function rgbToHex(rgb: string): string {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!match) return rgb;
  const hex = match
    .slice(1, 4)
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex.toUpperCase()}`;
}

export function groundSummary(ground: string): string {
  if (ground.startsWith("radial-gradient")) {
    const stops = ground.match(/rgba?\(|#[0-9a-f]{3,8}\b/gi)?.length ?? 0;
    return `Radial gradient, ${stops} stops`;
  }
  if (ground.startsWith("linear-gradient")) return "Linear gradient";
  return `Flat ${rgbToHex(ground)}`;
}

export function colourCount(groups: readonly PaletteGroup[]): number {
  return groups.reduce((total, group) => total + group.swatches.length, 0);
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `pnpm test`
Expected: PASS, 60 tests across 11 files.

- [ ] **Step 5: Write the failing end-to-end test**

`e2e/design-diff.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("token cards flip to v2 as they scroll in, and back on a click", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "The system underneath" });
  const typeface = section.getByRole("button", { name: /^Typeface/ });
  await typeface.scrollIntoViewIfNeeded();
  await expect(typeface).toHaveAttribute("aria-pressed", "true");
  await typeface.click();
  await expect(typeface).toHaveAttribute("aria-pressed", "false");
  await expect(section.getByText("Frutiger", { exact: true })).toBeVisible();
  await expect(section.getByText("Hanken Grotesk", { exact: true })).toBeVisible();
});

test("@review the design-system diff", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.getByRole("region", { name: "The system underneath" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: ".capture/review/05-design-diff.png" });
});
```

Run: `pnpm e2e e2e/design-diff.spec.ts`
Expected: FAIL, no region named "The system underneath".

- [ ] **Step 6: Write the card and its crossfade**

`src/components/Crossfade.tsx`:
```tsx
import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";
import type { Version } from "../data/types";
import { useMotionPreference } from "../hooks/useMotionPreference";

type CrossfadeProps = { state: Version; before: ReactNode; after: ReactNode };

export function Crossfade({ state, before, after }: CrossfadeProps) {
  const { reduced } = useMotionPreference();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={state}
        className="grid size-full place-items-center"
        initial={reduced ? false : { opacity: 0, scale: 0.96, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={reduced ? undefined : { opacity: 0, scale: 1.02, filter: "blur(6px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {state === "before" ? before : after}
      </m.span>
    </AnimatePresence>
  );
}
```

`src/components/TokenCard.tsx`:
```tsx
import { useInView } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Version } from "../data/types";

type TokenCardProps = {
  title: string;
  beforeValue: string;
  afterValue: string;
  children: (state: Version) => ReactNode;
};

const SETTLE_MS = 450;

export function TokenCard({ title, beforeValue, afterValue, children }: TokenCardProps) {
  const card = useRef<HTMLButtonElement>(null);
  const inView = useInView(card, { once: true, amount: 0.6 });
  const [settled, setSettled] = useState(false);
  const [choice, setChoice] = useState<Version | null>(null);

  useEffect(() => {
    if (!inView) return;
    const id = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [inView]);

  const state: Version = choice ?? (settled ? "after" : "before");
  return (
    <button
      ref={card}
      type="button"
      aria-pressed={state === "after"}
      onClick={() => setChoice(state === "after" ? "before" : "after")}
      className="flex flex-col rounded-3xl border border-line bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2"
    >
      <span className="caption text-mist/60">{title}</span>
      <span className="mt-4 grid h-40 place-items-center overflow-hidden rounded-2xl bg-ink-2">
        {children(state)}
      </span>
      <span className="mt-4 grid grid-cols-2 gap-3 text-sm leading-snug">
        <span className={state === "before" ? "text-mist" : "text-mist/60"}>
          <span className="caption block text-slate">Before</span>
          <span className="block">{beforeValue}</span>
        </span>
        <span className={state === "after" ? "text-mist" : "text-mist/60"}>
          <span className="caption block text-mint">After</span>
          <span className="block">{afterValue}</span>
        </span>
      </span>
    </button>
  );
}
```

- [ ] **Step 7: Write the six demos**

`src/components/TypefaceDemo.tsx`:
```tsx
import { assetUrl } from "../data/captures";
import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type TypefaceDemoProps = { state: Version; specimen: string };

export function TypefaceDemo({ state, specimen }: TypefaceDemoProps) {
  return (
    <Crossfade
      state={state}
      before={
        <img src={assetUrl(specimen)} alt="" loading="lazy" className="max-h-28 w-auto max-w-[88%]" />
      }
      after={
        <span className="text-center leading-none">
          <span className="block font-extrabold text-6xl tracking-[-0.035em]">Aa</span>
          <span className="mt-3 block text-mist/70 text-sm">500 · 700 · 800</span>
        </span>
      }
    />
  );
}
```

`src/components/HeadlineDemo.tsx`:
```tsx
import type { MeasuredTokens, Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type Headline = MeasuredTokens["headline"];

type HeadlineDemoProps = { state: Version; before: Headline; after: Headline };

const DEMO_SCALE = 0.42;

function scaled(value: string): string {
  return value === "normal" ? "normal" : `calc(${value} * ${DEMO_SCALE})`;
}

function sample(tokens: Headline, family: string) {
  return (
    <span
      className="block px-5 text-center"
      style={{
        fontFamily: family,
        fontSize: scaled(tokens.fontSize),
        lineHeight: scaled(tokens.lineHeight),
        letterSpacing: scaled(tokens.letterSpacing),
        fontWeight: tokens.fontWeight,
      }}
    >
      Register and book with an NHS GP
    </span>
  );
}

export function HeadlineDemo({ state, before, after }: HeadlineDemoProps) {
  return (
    <Crossfade
      state={state}
      before={
        <span className="grid gap-2">
          {sample(before, "Arial, sans-serif")}
          <span className="text-center text-[11px] text-mist/60">
            Shown in Arial, Frutiger's NHS fallback
          </span>
        </span>
      }
      after={sample(after, "var(--font-sans)")}
    />
  );
}
```

`src/components/CornersDemo.tsx`:
```tsx
import type { MeasuredTokens, Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type CornersDemoProps = {
  state: Version;
  before: MeasuredTokens;
  after: MeasuredTokens;
  scale: readonly string[];
};

function shapes(tokens: MeasuredTokens) {
  return (
    <span className="flex items-center gap-4">
      <span className="h-20 w-24 bg-mist/90" style={{ borderRadius: tokens.card.borderRadius }} />
      <span className="h-11 w-36 bg-mist/90" style={{ borderRadius: tokens.search.borderRadius }} />
    </span>
  );
}

export function CornersDemo({ state, before, after, scale }: CornersDemoProps) {
  return (
    <Crossfade
      state={state}
      before={shapes(before)}
      after={
        <span className="flex flex-col items-center gap-4">
          {shapes(after)}
          <span className="flex gap-1">
            {scale.map((radius) => (
              <span key={radius} className="size-3 border border-mint/70" style={{ borderRadius: radius }} />
            ))}
          </span>
        </span>
      }
    />
  );
}
```

`src/components/ElevationDemo.tsx`:
```tsx
import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type ElevationDemoProps = { state: Version; before: string; after: string };

function card(shadow: string) {
  return <span className="h-14 w-44 rounded-2xl bg-white" style={{ boxShadow: shadow }} />;
}

export function ElevationDemo({ state, before, after }: ElevationDemoProps) {
  return (
    <span className="grid size-full place-items-center bg-[#eef2f4]">
      <Crossfade state={state} before={card(before)} after={card(after)} />
    </span>
  );
}
```

`src/components/HeroGroundDemo.tsx`:
```tsx
import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type HeroGroundDemoProps = { state: Version; before: string; after: string };

function panel(ground: string) {
  return <span className="block size-full" style={{ background: ground }} />;
}

export function HeroGroundDemo({ state, before, after }: HeroGroundDemoProps) {
  return (
    <span className="block size-full">
      <Crossfade state={state} before={panel(before)} after={panel(after)} />
    </span>
  );
}
```

`src/components/PaletteDemo.tsx`:
```tsx
import type { PaletteGroup, Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type PaletteDemoProps = {
  state: Version;
  before: readonly PaletteGroup[];
  after: readonly PaletteGroup[];
};

export function PaletteDemo({ state, before, after }: PaletteDemoProps) {
  return (
    <Crossfade
      state={state}
      before={
        <span className="flex max-w-[260px] flex-wrap justify-center gap-1.5">
          {before
            .flatMap((group) => group.swatches)
            .map((swatch) => (
              <span
                key={swatch.name}
                className="size-5 rounded-full ring-1 ring-white/10"
                style={{ background: swatch.hex }}
              />
            ))}
        </span>
      }
      after={
        <span className="flex w-[86%] flex-col gap-1">
          {after.map((group) => (
            <span key={group.name} className="flex h-3 overflow-hidden rounded-full">
              {group.swatches.map((swatch) => (
                <span key={swatch.name} className="flex-1" style={{ background: swatch.hex }} />
              ))}
            </span>
          ))}
        </span>
      }
    />
  );
}
```

- [ ] **Step 8: Write the section and mount it**

`src/components/DesignDiff.tsx`:
```tsx
import { CAPTURES, captureFor } from "../data/captures";
import {
  colourCount,
  groundSummary,
  headlineSummary,
  shadowSummary,
  typefaceName,
} from "../lib/tokenFormat";
import { CornersDemo } from "./CornersDemo";
import { ElevationDemo } from "./ElevationDemo";
import { HeadlineDemo } from "./HeadlineDemo";
import { HeroGroundDemo } from "./HeroGroundDemo";
import { PaletteDemo } from "./PaletteDemo";
import { TokenCard } from "./TokenCard";
import { TypefaceDemo } from "./TypefaceDemo";

export function DesignDiff() {
  const before = captureFor("before", "desktop").tokens;
  const after = captureFor("after", "desktop").tokens;
  const { palettes, radiusScale, specimens } = CAPTURES;
  return (
    <section aria-labelledby="diff-heading" className="mx-auto w-full max-w-[1240px] px-6 pt-32">
      <p className="caption text-mint">Design system</p>
      <h2 id="diff-heading" className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl">
        The system underneath
      </h2>
      <p className="mt-5 max-w-[560px] text-lg text-mist/70">
        Six tokens, measured from the running pages. Each card flips to v2 as it scrolls in; tap one
        to flip it back.
      </p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <TokenCard
          title="Typeface"
          beforeValue={typefaceName(before.headline.fontFamily)}
          afterValue={typefaceName(after.headline.fontFamily)}
        >
          {(state) => <TypefaceDemo state={state} specimen={specimens.frutiger} />}
        </TokenCard>
        <TokenCard
          title="Headline"
          beforeValue={headlineSummary(before.headline)}
          afterValue={headlineSummary(after.headline)}
        >
          {(state) => <HeadlineDemo state={state} before={before.headline} after={after.headline} />}
        </TokenCard>
        <TokenCard
          title="Corners"
          beforeValue={`Card ${before.card.borderRadius}, search ${before.search.borderRadius}`}
          afterValue={`Card ${after.card.borderRadius}, search ${after.search.borderRadius}`}
        >
          {(state) => <CornersDemo state={state} before={before} after={after} scale={radiusScale} />}
        </TokenCard>
        <TokenCard
          title="Elevation"
          beforeValue={shadowSummary(before.search.boxShadow)}
          afterValue={shadowSummary(after.search.boxShadow)}
        >
          {(state) => (
            <ElevationDemo state={state} before={before.search.boxShadow} after={after.search.boxShadow} />
          )}
        </TokenCard>
        <TokenCard
          title="Hero ground"
          beforeValue={groundSummary(before.heroGround)}
          afterValue={groundSummary(after.heroGround)}
        >
          {(state) => <HeroGroundDemo state={state} before={before.heroGround} after={after.heroGround} />}
        </TokenCard>
        <TokenCard
          title="Palette"
          beforeValue={`${colourCount(palettes.before)} colours`}
          afterValue={`${colourCount(palettes.after)} colours in ${palettes.after.length} ramps`}
        >
          {(state) => <PaletteDemo state={state} before={palettes.before} after={palettes.after} />}
        </TokenCard>
      </div>
    </section>
  );
}
```

In `src/App.tsx`, add the import:
```tsx
import { DesignDiff } from "./components/DesignDiff";
```
and replace:
```tsx
                <ComparisonStage options={options} />
              </main>
```
with:
```tsx
                <ComparisonStage options={options} />
                <DesignDiff />
              </main>
```

- [ ] **Step 9: Run the tests and review**

Run: `pnpm test && pnpm e2e && pnpm review`
Expected: 60 unit tests and 17 end-to-end tests pass. Open `.capture/review/05-design-diff.png`. The six cards should be in the v2 state, every value readable, the specimen and palette ramps crisp, and the elevation card's shadows visible on its light panel. In `pnpm dev`, scroll the cards in to watch them flip, and click one to flip it back.

- [ ] **Step 10: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Add the design-system diff: six measured tokens that flip from v0 to v2" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 14: Ship timeline and credits

**Files:**
- Create: `src/data/timeline.ts`, `src/components/ShipTimeline.tsx`, `src/components/SiteCredits.tsx`, `e2e/timeline.spec.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CASE_STUDY` (Task 8), `captureFor` (Task 9), `useMotionPreference` (Task 8).
- Produces: `type ShipChunk = { date: string; title: string; detail: string }`, `TIMELINE`; the section `aria-labelledby` "Four chunks, one week"; the page footer (`contentinfo`).

- [ ] **Step 1: Write the failing test**

`e2e/timeline.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("tells how the redesign shipped and credits the captures", async ({ page }) => {
  await page.goto("/");
  const timeline = page.getByRole("region", { name: "Four chunks, one week" });
  await timeline.scrollIntoViewIfNeeded();
  await expect(timeline.getByRole("listitem")).toHaveCount(4);
  await expect(timeline.getByRole("heading", { level: 3 })).toHaveText([
    "Site footer",
    "Site header",
    "Postcode search",
    "Homepage",
  ]);
  await expect(page.getByRole("link", { name: "Live at bookable.health" })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
});

test("@review the timeline", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.getByRole("region", { name: "Four chunks, one week" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: ".capture/review/06-timeline.png" });
});
```

Run: `pnpm e2e e2e/timeline.spec.ts`
Expected: FAIL, no region named "Four chunks, one week".

- [ ] **Step 2: Write the data and components**

`src/data/timeline.ts`:
```ts
export type ShipChunk = { date: string; title: string; detail: string };

export const TIMELINE: readonly ShipChunk[] = [
  {
    date: "22 Sept 2026",
    title: "Site footer",
    detail: "One v2 footer swapped in on every page but triage.",
  },
  {
    date: "29 Sept 2026",
    title: "Site header",
    detail: "The NHS header retired for the v2 header.",
  },
  {
    date: "29 Sept 2026",
    title: "Postcode search",
    detail: "The v2 search put into the homepage hero ahead of the rebuild.",
  },
  {
    date: "29 Sept 2026",
    title: "Homepage",
    detail: "The homepage and area pages rebuilt on the v2 landing design.",
  },
];
```

`src/components/ShipTimeline.tsx`:
```tsx
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { CASE_STUDY } from "../data/caseStudy";
import { TIMELINE } from "../data/timeline";
import { useMotionPreference } from "../hooks/useMotionPreference";

const DRAW = [0.65, 0, 0.35, 1] as const;

export function ShipTimeline() {
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(track, { once: true, amount: 0.4 });
  const { reduced } = useMotionPreference();
  const shown = reduced || inView;
  return (
    <section aria-labelledby="timeline-heading" className="mx-auto w-full max-w-[1240px] px-6 pt-32 pb-8">
      <p className="caption text-mint">How it shipped</p>
      <h2 id="timeline-heading" className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl">
        Four chunks, one week
      </h2>
      <div ref={track} className="relative mt-14">
        <m.span
          aria-hidden="true"
          className="absolute top-[7px] left-0 hidden h-px w-full origin-left bg-linear-to-r from-mint via-mint/60 to-transparent sm:block"
          initial={reduced ? false : { scaleX: 0 }}
          animate={shown ? { scaleX: 1 } : undefined}
          transition={{ duration: 1.2, ease: DRAW }}
        />
        <m.span
          aria-hidden="true"
          className="absolute top-0 left-[7px] h-full w-px origin-top bg-linear-to-b from-mint via-mint/60 to-transparent sm:hidden"
          initial={reduced ? false : { scaleY: 0 }}
          animate={shown ? { scaleY: 1 } : undefined}
          transition={{ duration: 1.2, ease: DRAW }}
        />
        <ol className="grid gap-10 sm:grid-cols-4 sm:gap-6">
          {TIMELINE.map((chunk, index) => (
            <m.li
              key={chunk.title}
              className="relative pl-8 sm:pt-8 sm:pl-0"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={shown ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.25 + index * 0.15, duration: 0.5 }}
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 size-[15px] rounded-full border-2 border-mint bg-ink"
              />
              <p className="caption text-mist/55">{chunk.date}</p>
              <h3 className="mt-2 font-extrabold text-xl">{chunk.title}</h3>
              <p className="mt-2 text-mist/70 text-sm leading-relaxed">{chunk.detail}</p>
            </m.li>
          ))}
        </ol>
      </div>
      <a
        href={CASE_STUDY.liveUrl}
        className="mt-14 inline-flex items-center gap-2 font-extrabold text-lg text-mint hover:underline"
      >
        Live at bookable.health <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
```

`src/components/SiteCredits.tsx`:
```tsx
import { captureFor } from "../data/captures";

const CAPTURED_ON = new Date(captureFor("after", "desktop").capturedAt).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function SiteCredits() {
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured on {CAPTURED_ON} from production builds of both versions. Frutiger is
        licensed to the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
```

- [ ] **Step 3: Mount them**

In `src/App.tsx`, add the imports:
```tsx
import { ShipTimeline } from "./components/ShipTimeline";
import { SiteCredits } from "./components/SiteCredits";
```
and replace:
```tsx
                <DesignDiff />
              </main>
```
with:
```tsx
                <DesignDiff />
                <ShipTimeline />
              </main>
              <SiteCredits />
```

- [ ] **Step 4: Run the tests and review**

Run: `pnpm e2e && pnpm review`
Expected: 18 end-to-end tests pass. Open `.capture/review/06-timeline.png`: the mint line draws across four dated chunks, ending on "Live at bookable.health →", with the credits footer below.

- [ ] **Step 5: Lint and commit**

```bash
pnpm lint:fix && pnpm lint && pnpm typecheck
git add -A
git commit -m "Close the page with the ship timeline and the capture credits" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Sharing, budgets, docs and final verification

**Files:**
- Create: `e2e/og.spec.ts`, `scripts/budget.ts`, `capture/compareLive.ts`, `README.md`
- Modify: `index.html` (social meta), `vite.config.ts` (social image URL), `package.json` (scripts)
- Generated: `public/og.png`

**Interfaces:**
- Consumes: everything above.
- Produces: scripts `og`, `budget`, `capture:compare`; environment variables `VITE_BASE` (sub-path) and `VITE_SITE_URL` (absolute origin for `og:image`).

- [ ] **Step 1: Add the social meta and its URL**

In `index.html`, add inside `<head>` after the description:
```html
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Bookable homepage, before &amp; after" />
    <meta
      property="og:description"
      content="Drag, scroll and play through the Bookable homepage before and after its move to its own design system."
    />
    <meta property="og:image" content="%SOCIAL_IMAGE%" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#061528" />
```

Replace `vite.config.ts`:
```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const base = process.env.VITE_BASE ?? "/";
const siteUrl = (process.env.VITE_SITE_URL ?? "").replace(/\/$/, "");

function socialImage(): Plugin {
  return {
    name: "social-image",
    transformIndexHtml: (html) => html.replaceAll("%SOCIAL_IMAGE%", `${siteUrl}${base}og.png`),
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), socialImage()],
});
```

- [ ] **Step 2: Write the image, budget and comparison scripts**

`e2e/og.spec.ts`:
```ts
import { test } from "@playwright/test";

test("@og writes the link-preview image", async ({ page }) => {
  test.skip(!process.env.OG, "Run with pnpm og");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto("/");
  await page
    .getByRole("region", { name: "Before and after comparison" })
    .evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "public/og.png" });
});
```

`scripts/budget.ts`:
```ts
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { CapturesFile } from "../src/data/types";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BASE = process.env.VITE_BASE ?? "/";
const JS_BUDGET = 100 * 1024;
const IMAGE_BUDGET = 1.5 * 1024 * 1024;

const html = readFileSync(join(DIST, "index.html"), "utf8");
const scripts = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
].map((match) => match[1].slice(BASE.length));
const jsBytes = scripts.reduce(
  (total, path) => total + gzipSync(readFileSync(join(DIST, path))).length,
  0,
);

const data = JSON.parse(readFileSync(join(ROOT, "src/data/captures.json"), "utf8")) as CapturesFile;
const firstPaint = data.captures
  .filter((capture) => capture.device === "desktop")
  .flatMap((capture) => [
    capture.tiles[0].avif,
    ...(capture.header?.states.map((state) => state.src) ?? []),
  ]);
const imageBytes = firstPaint.reduce((total, path) => total + statSync(join(DIST, path)).size, 0);

console.log(`Initial JS: ${(jsBytes / 1024).toFixed(1)} KB gzipped (budget ${JS_BUDGET / 1024} KB)`);
console.log(
  `First-paint images: ${(imageBytes / 1024 / 1024).toFixed(2)} MB (budget ${IMAGE_BUDGET / 1024 / 1024} MB)`,
);
if (jsBytes > JS_BUDGET || imageBytes > IMAGE_BUDGET) process.exitCode = 1;
```

`capture/compareLive.ts`:
```ts
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import type { CapturesFile } from "../src/data/types";
import { DATA_FILE, PUBLIC_DIR, ROOT } from "./paths";
import { SCALE, SOCS_REJECTED } from "./profiles";

const LIVE_URL = "https://bookable.health";
const GAP = 40;

async function main() {
  const file = JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile;
  const after = file.captures.find(
    (capture) => capture.version === "after" && capture.device === "desktop",
  );
  if (!after) throw new Error("There is no after capture for desktop");
  const { width, height } = after.viewport;

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
    const page = await context.newPage();
    await page.goto(LIVE_URL, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: ".phone-help-bubble { display: none !important; }" });
    await page.waitForTimeout(1500);
    const live = await page.screenshot();
    const captured = await sharp(join(PUBLIC_DIR, after.tiles[0].webp))
      .extract({ left: 0, top: 0, width: width * SCALE, height: height * SCALE })
      .png()
      .toBuffer();
    const out = join(ROOT, ".capture");
    mkdirSync(out, { recursive: true });
    const target = join(out, "live-vs-capture.png");
    await sharp({
      create: {
        width: width * SCALE * 2 + GAP,
        height: height * SCALE,
        channels: 4,
        background: "#061528",
      },
    })
      .composite([
        { input: live, left: 0, top: 0 },
        { input: captured, left: width * SCALE + GAP, top: 0 },
      ])
      .png()
      .toFile(target);
    console.log(`Wrote ${target}: the live site on the left, the capture on the right`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
```

Add to `package.json` `scripts`:
```json
"og": "OG=1 playwright test --grep @og",
"budget": "tsx scripts/budget.ts",
"capture:compare": "tsx capture/compareLive.ts"
```

- [ ] **Step 3: Write the README**

`README.md`:
````markdown
# Bookable homepage, before & after

An interactive, animated before and after of the Bookable homepage (bookable.health) as it moved
from the NHS design system to Bookable's own (v2) in September 2026. Drag the divider, scroll inside
the frame (both versions stay on the same section), switch Desktop and Mobile, or press Play.

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

Open `/?record=16x9` or `/?record=4x3` (add `&tour=short` for a cut of about 15 seconds). The
comparison fills the window with no controls or cursor and loops its tour; screen-record the
window. Recording mode ignores the reduced-motion setting.

## Deploy

`pnpm build` writes a static site to `dist/`. Set `VITE_BASE=/work/bookable/` to serve it from a
sub-path, and `VITE_SITE_URL=https://your.site` so the link preview uses an absolute image URL.
Regenerate the preview image with `pnpm og`, then build again. `pnpm budget` checks the initial
JS (100 KB gzipped) and first-paint image (1.5 MB) budgets.

## Recapture

The captures in `public/captures/` and `src/data/captures.json` come from two pinned commits of
the sanny repo: `0a143c6820` (before) and `c016453be7` (after).

```bash
pnpm capture
```

This needs a sanny checkout (`SANNY_REPO`, default `~/Desktop/repos/sanny`), pnpm, and ffmpeg
with libx264 and libvpx-vp9. Each commit is exported with `git archive` into
`CAPTURE_WORK_DIR` (default `<os tmp>/bookable-before-after`), built, and served on ports 3061
and 3062 against the public production API. Nothing is written to sanny.
`pnpm capture --skip-loops` skips the video loops; `pnpm capture:clean` deletes the builds;
`pnpm capture:serve` serves both builds for inspection; `pnpm capture:compare` puts the live
site next to the capture in `.capture/live-vs-capture.png`. The capture hides the sticky header
on purpose, because the page draws it as an overlay.

## Licensing

Frutiger is licensed to the NHS, so no Frutiger file is in this project; the specimen is a
rendered image. Hanken Grotesk is OFL and loads from Google Fonts. The screenshots show the public
Bookable homepage.
````

- [ ] **Step 4: Generate the preview image and check the budgets**

Run: `pnpm og && pnpm build && pnpm budget`
Expected: `public/og.png` exists and is 1200×630, showing the stage. `pnpm budget` prints both figures within budget and exits 0.

If the JS is over budget:
- Confirm `dist/assets` has a separate chunk for `motionFeatures` (it must load lazily).
- Confirm `captures.json` is small.

If the images are over budget:
- Lower the AVIF quality in `capture/shoot.ts` from 62 to 55.
- Re-run `pnpm capture` and re-check.

Open `public/og.png` to confirm it is a clean, readable 1200×630 crop of the stage.

- [ ] **Step 5: Compare the capture with the live site**

Run: `pnpm capture:compare`
Open `.capture/live-vs-capture.png`.

Expected matches:
- The hero layout, headline, search pill, slot cards and colours match side by side.
- The only expected difference is the header, which the capture omits because the page draws it as an overlay.

If anything else differs, find the cause before shipping. For example, Weglot might not render its language pill against localhost. In that case, capture the after header's two states from bookable.health instead (`captureHeaderStates` against the live URL) and say so in the README.

- [ ] **Step 6: Run everything and review every screenshot**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm review`
Expected: 60 unit tests and 18 end-to-end tests pass.

Then open every image in `.capture/review/` and compare it with the spec, sections 5.1–5.6:
- `01-top`, `02-stage`, `03-stage-how`, `03b-header-solid`, `04-stage-mobile`
- `05-design-diff`, `06-timeline`, `07-phone-top`, `07-phone-stage`, `08-record-16x9`

For each image, check spacing, legibility, alignment of both versions at the divider, and no overflow. Also check the faintest text on the dark ground, `text-mist/50` on `ink`, which must reach WCAG AA (4.5:1).

Optionally check WebKit:
```bash
pnpm exec playwright install webkit
pnpm exec playwright test e2e/layers.spec.ts --browser=webkit
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the link-preview image, budget check, live comparison and README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
