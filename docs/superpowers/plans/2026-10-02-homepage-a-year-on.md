# The homepage, a year on — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second view, `/?view=a-year-on`, that sets Bookable's homepage from 30 September 2025 against v2 on the existing comparison stage, leaving the main page as it is apart from one link.

**Architecture:** A fourth comparison id, `home-2025`, joins the per-page data (groups, notes, tours, captures). Its 2025 side is captured from a commit fetched by full SHA into the capture's own cache, because the local sanny clone is shallow. Its v2 side reuses the homepage's v2 capture with its sections regrouped, declared once in `src/data/reuse.ts`. A small views map says which comparisons each view shows, and the URL's `view` parameter picks the view.

**Tech Stack:** Vite 8, React 19.3, TypeScript 7, Motion 13.5 (`LazyMotion`, `m`), Tailwind 4, Biome 2.5, Vitest 5, Playwright 1.63, tsx, sharp, pnpm 10, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-02-homepage-a-year-on-design.md`, which extends `2026-10-01-before-after-showcase-design.md` and `2026-10-01-article-and-help-comparisons-design.md`. Read all three.

## Global Constraints

- Never write into sanny (`~/Desktop/repos/sanny`); only read it. Builds and fetched history go under `CAPTURE_WORK_DIR` (default `<os tmp>/bookable-before-after`).
- The 2025 build is `d914fbe7db53acc671025f4c8f67f6e4ae38587f` on port 3065. The v2 side is the homepage's `c016453be7` capture, reused, never shot again.
- `/?view=a-year-on` renders the new view; no `view`, or any other value, renders the main page.
- The main page is unchanged apart from the link "See the homepage a year on →" at the end of its header.
- Copy is exactly the spec's: header (§3.2), rail labels (§3.3), notes (§3.4), side labels (§3.2).
- Accessible names on the new view: region "The homepage, a year on"; rail "Homepage sections"; slider "Homepage: divider between before and after".
- Initial JS stays under 100 KB gzipped; first-paint images under 1.5 MB on each view.
- Biome: 100-character lines, 2-space indent. Never add a lint suppression without asking the user first.
- Comments only for a why the code cannot show. One component per file; `type` over `interface`; props types declared separately.
- Logic is test-first: a failing test, then the code.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on `build-showcase`; do not merge or push.

## Commands

- Unit: `pnpm test`, or one file: `pnpm exec vitest run <path>`.
- Types: `pnpm typecheck`. Lint: `pnpm lint`; fix formatting with `pnpm exec biome check --write <paths>`.
- End to end: `pnpm e2e` (builds, previews on port 4173, runs everything but `@review` and `@og`); one file: `pnpm exec playwright test <path>`. The build runs `tsc --noEmit`, so a type error anywhere, e2e files included, stops every e2e test.
- Review shots: `pnpm review` (writes `.capture/review/`). Budgets: `pnpm build && pnpm budget`.

## Review Focus

1. **Sub-path deploys** (`VITE_BASE=/work/bookable/`): the links between the views must keep the base, or they 404 on the portfolio host. Pinned by the `viewHref` sub-path test (Task 3).
2. **Shared links with odd parameters:** `?view=year`, `?view=A-YEAR-ON` and a bare `?view` open the main page; `?view=a-year-on&page=article`, outside recording, still shows the year-on view. Pinned by the `urlOptions` tests and the "ignores a page asked for outside recording" e2e test (Task 3).
3. **Phone visitors on the new view:** header and stage fit 390px with no sideways scroll, and the frame opens on the mobile captures. Pinned by the phone loop (Task 5).
4. **Keyboard visitors on the new view:** Tab from the back link reaches the rail and then the divider. Pinned by the keyboard test (Task 5).
5. **A later homepage recapture that drops or moves a group the regrouping starts at** must fail before deploy rather than show a misaligned v2. Pinned by the `regroup` throw tests and the both-device mapping test (Task 2).

## File structure

New:

- `capture/builds.test.ts`: the clone-or-fetch choice and the 2025 build's pin.
- `src/data/views.ts`, `src/data/views.test.ts`: which comparisons each view shows; view ids; links between views.
- `src/data/reuse.ts`, `src/data/reuse.test.ts`: the reused v2 side (declaration, `regroup`, `findCapture`).
- `src/components/PageHeader.tsx`: the header layout both views share, moved out of `CaseHeader`.
- `src/components/YearHeader.tsx`: the new view's header.
- `src/components/ViewLink.tsx`: a link to the other view.
- `src/components/LiveLink.tsx`: the bookable.health link both headers show.
- `src/components/MainView.tsx`: the main page, moved out of `App`.
- `src/components/YearOnView.tsx`: the new view.
- `e2e/year.spec.ts`: the new view end to end.
- `public/captures/home-2025/before/{desktop,mobile}/`: generated by the capture.

Modified: `capture/builds.ts`, `capture/pages.ts` and its test, `capture/capture.ts`, `capture/merge.ts` and its test, `capture/args.test.ts`, `capture/compareLive.ts`, `src/data/types.ts`, `src/data/pages.ts` and its test, `src/data/changes.ts`, `src/data/captures.ts` and its test, `src/data/captures.json` (generated), `src/data/caseStudy.ts`, `src/lib/playScript.ts` and its test, `src/lib/urlOptions.ts` and its test, `src/App.tsx`, `src/components/{CaseHeader,ComparisonStage,StageIntro,StageViewport,VersionLabels,SiteCredits}.tsx`, `e2e/{captureData,stageHelpers}.ts`, `e2e/{smoke,stage}.spec.ts`, `scripts/budget.ts`, `README.md`.

---

### Task 1: Fetch commits the sanny clone lacks

The local sanny clone is shallow (its history starts on 9 June 2026), so `git archive` cannot export the 30 Sept 2025 commit from it. `prepareBuild` learns to fetch such a commit, by full SHA, into a bare cache repo under `CAPTURE_WORK_DIR`, and to export from there.

**Files:**
- Create: `capture/builds.test.ts`
- Modify: `capture/builds.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BuildName` gains `"home-2025"`; `BUILDS["home-2025"] = { name: "home-2025", commit: "d914fbe7db53acc671025f4c8f67f6e4ae38587f", port: 3065 }`; `commitSource(commit: string, inClone: boolean): "clone" | "fetch"`; `HISTORY_DIR: string`. `prepareBuild(spec)` keeps its signature.

- [ ] **Step 1: Write the failing test**

`capture/builds.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUILDS, commitSource } from "./builds";

const FULL = "d914fbe7db53acc671025f4c8f67f6e4ae38587f";

describe("commitSource", () => {
  it("exports a commit the sanny clone has from the clone", () => {
    expect(commitSource("0a143c6820", true)).toBe("clone");
    expect(commitSource("1e021d8370^", true)).toBe("clone");
    expect(commitSource(FULL, true)).toBe("clone");
  });

  it("fetches a commit the clone lacks when it is pinned by full SHA", () => {
    expect(commitSource(FULL, false)).toBe("fetch");
  });

  it("stops on a short or relative ref the clone lacks", () => {
    expect(() => commitSource("d914fbe7db", false)).toThrow(
      "d914fbe7db is not in the sanny clone at",
    );
    expect(() => commitSource("1e021d8370^", false)).toThrow(
      "only a full 40-character SHA can be fetched",
    );
  });
});

describe("BUILDS", () => {
  it("pins the 2025 homepage by full SHA, the only form a fetch can ask for", () => {
    expect(BUILDS["home-2025"]).toEqual({ name: "home-2025", commit: FULL, port: 3065 });
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm exec vitest run capture/builds.test.ts`
Expected: FAIL, because `commitSource` is not exported and `BUILDS["home-2025"]` is undefined.

- [ ] **Step 3: Implement**

In `capture/builds.ts`:

1. Import `spawnSync` too:

```ts
import { type ChildProcess, execFileSync, execSync, spawn, spawnSync } from "node:child_process";
```

2. Replace the `BuildName` type, the comment and `BUILDS`:

```ts
export type BuildName = "home-before" | "after" | "article-before" | "help-before" | "home-2025";
```

```ts
// The two older commits are the last before their pages were replaced: 1e021d8370 swapped the
// how-to pages for the guide pages, and 38facb0a65 swapped /faq for /help. home-2025 predates a
// shallow clone's history, so it is pinned by the full SHA a fetch needs.
export const BUILDS: Record<BuildName, BuildSpec> = {
  "home-before": { name: "home-before", commit: "0a143c6820", port: 3061 },
  after: { name: "after", commit: "c016453be7", port: 3062 },
  "article-before": { name: "article-before", commit: "1e021d8370^", port: 3063 },
  "help-before": { name: "help-before", commit: "38facb0a65^", port: 3064 },
  "home-2025": {
    name: "home-2025",
    commit: "d914fbe7db53acc671025f4c8f67f6e4ae38587f",
    port: 3065,
  },
};
```

3. Below `export const SANNY_REPO = …`, add:

```ts
export const HISTORY_DIR = join(WORK_DIR, "sanny-history.git");

const FULL_SHA = /^[0-9a-f]{40}$/;

export function commitSource(commit: string, inClone: boolean): "clone" | "fetch" {
  if (inClone) return "clone";
  if (FULL_SHA.test(commit)) return "fetch";
  throw new Error(
    `${commit} is not in the sanny clone at ${SANNY_REPO}, and only a full 40-character SHA can be fetched; pin the full SHA in BUILDS`,
  );
}

function hasCommit(repo: string, commit: string): boolean {
  const found = spawnSync("git", ["-C", repo, "cat-file", "-e", `${commit}^{commit}`], {
    stdio: "ignore",
  });
  return found.status === 0;
}

function repoWith(commit: string): string {
  if (commitSource(commit, hasCommit(SANNY_REPO, commit)) === "clone") return SANNY_REPO;
  if (!existsSync(join(HISTORY_DIR, "HEAD"))) {
    mkdirSync(HISTORY_DIR, { recursive: true });
    execFileSync("git", ["init", "--quiet", "--bare", HISTORY_DIR]);
  }
  if (!hasCommit(HISTORY_DIR, commit)) {
    const origin = execFileSync("git", ["-C", SANNY_REPO, "remote", "get-url", "origin"], {
      encoding: "utf8",
    }).trim();
    console.log(`Fetching ${commit.slice(0, 10)} from ${origin} into ${HISTORY_DIR}`);
    execFileSync("git", ["-C", HISTORY_DIR, "fetch", "--quiet", "--depth=1", origin, commit], {
      stdio: "inherit",
    });
  }
  return HISTORY_DIR;
}
```

4. In `prepareBuild`, resolve and export from whichever repo has the commit. The start of the function becomes:

```ts
export function prepareBuild(spec: BuildSpec): PreparedBuild {
  const repo = repoWith(spec.commit);
  const fullCommit = execFileSync("git", ["-C", repo, "rev-parse", `${spec.commit}^{commit}`], {
    encoding: "utf8",
  }).trim();
```

and the export line becomes:

```ts
  execSync(
    `git -C ${JSON.stringify(repo)} archive ${fullCommit} | tar -x -C ${JSON.stringify(dir)}`,
    {
      stdio: "inherit",
    },
  );
```

Everything else in `prepareBuild` stays as it is.

- [ ] **Step 4: Run the test to make sure it passes**

Run: `pnpm exec vitest run capture/builds.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Prepare the real 2025 build and check sanny is untouched**

```bash
mkdir -p .capture
cat > .capture/prepare-home-2025.ts <<'EOF'
import { BUILDS, prepareBuild } from "../capture/builds";

const build = prepareBuild(BUILDS["home-2025"]);
console.log(`${build.name} ${build.fullCommit} at ${build.dir}`);
EOF
shasum ~/Desktop/repos/sanny/.git/shallow
pnpm exec tsx .capture/prepare-home-2025.ts
shasum ~/Desktop/repos/sanny/.git/shallow
pnpm exec tsx .capture/prepare-home-2025.ts
```

Expected:
- The first run prints `Fetching d914fbe7db from git@github.com:healthtech1/sanny.git into <tmp>/bookable-before-after/sanny-history.git`, installs and builds (several minutes), then `home-2025 d914fbe7db53acc671025f4c8f67f6e4ae38587f at <tmp>/bookable-before-after/home-2025`.
- Both `shasum` lines are identical.
- The second run prints `Reusing the home-2025 build at …` and no `Fetching` line.

`.capture/` is git-ignored, so the script stays out of the repo.

- [ ] **Step 6: Lint, typecheck and run the unit suite**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all clean; the unit count grows by 4.

- [ ] **Step 7: Commit**

```bash
git add capture/builds.ts capture/builds.test.ts
git commit -m "Fetch a build's commit when the sanny clone lacks it

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Add the 2025 comparison and capture it

Adding `"home-2025"` to `PageId` forces every per-page map (pages, notes, tours, stage maps, capture sources) to change at once, so this task adds the whole comparison as data, captures its 2025 side, and keeps the main page exactly as it was. The new view itself comes in Task 3.

**Files:**
- Create: `src/data/views.ts`, `src/data/views.test.ts`, `src/data/reuse.ts`, `src/data/reuse.test.ts`
- Modify: `src/data/types.ts`, `src/data/pages.ts`, `src/data/pages.test.ts`, `src/data/changes.ts`, `src/lib/playScript.ts`, `src/lib/playScript.test.ts`, `src/data/captures.ts`, `src/data/captures.test.ts`, `src/components/StageIntro.tsx`, `src/components/ComparisonStage.tsx`, `src/App.tsx`, `capture/pages.ts`, `capture/pages.test.ts`, `capture/capture.ts`, `capture/merge.ts`, `capture/merge.test.ts`, `capture/args.test.ts`, `capture/compareLive.ts`, `e2e/captureData.ts`, `e2e/smoke.spec.ts`, `e2e/stage.spec.ts`
- Generated: `src/data/captures.json`, `public/captures/home-2025/before/{desktop,mobile}/*`

**Interfaces:**
- Consumes: `BUILDS["home-2025"]` (Task 1).
- Produces:
  - `PageId = "home" | "article" | "help" | "home-2025"`; `Home2025SectionId = "hero" | "proof-how" | "faq-about" | "areas" | "footer"`.
  - `StageIntroCopy = { number: string; summary: string; shipped: string }`; `PageInfo = { id; name; noun; route; sections; intro: StageIntroCopy | null }`.
  - `PAGE_IDS = ["home", "article", "help", "home-2025"]`.
  - `ViewId = "main" | "a-year-on"`; `VIEWS = { main: ["home", "article", "help"], "a-year-on": ["home-2025"] } as const`.
  - From `src/data/reuse.ts`: `REUSED_AFTER`, `type ReusedPage` (`"home-2025"`), `type Reuse = { from: PageId; starts: Partial<Record<SectionId, SectionId>> }`, `reusedAfter(page: PageId): Reuse | null`, `isReused(page: PageId, version: Version): boolean`, `regroup(source: Capture, page: PageId, starts: Partial<Record<SectionId, SectionId>>): Capture`, `findCapture(file: CapturesFile, page: PageId, version: Version, device: Device): Capture`.
  - `captureFor(page, version, device)` returns the same object on every call.
  - `StageIntro` props: `{ page: PageId; intro: StageIntroCopy; headingId: string }`.
  - From `capture/pages.ts`: `type ShotSide = { page; version; side: { build; path; anchors; pinned } }` and `shotSides(pages: readonly PageId[]): ShotSide[]`.

- [ ] **Step 1: Write failing tests for the comparison's pages and the views**

In `src/data/pages.test.ts`, change the import line and add to the existing tests:

```ts
import { CHANGES } from "./changes";
import { addressOf, isPageId, PAGE_IDS, PAGES, sectionIds, sectionLabel } from "./pages";
import { VIEWS } from "./views";
```

In "labels each page's groups", add:

```ts
    expect(sectionLabel("home-2025", "proof-how")).toBe("Reviews & how it works");
    expect(sectionLabel("home-2025", "faq-about")).toBe("FAQ & About");
```

In "addresses each frame by the after page's path", add:

```ts
    expect(addressOf("home-2025")).toBe("bookable.health");
```

In "recognises page ids", add:

```ts
    expect(isPageId("home-2025")).toBe(true);
```

And add a test:

```ts
  it("gives an intro to the main page's comparisons only", () => {
    expect(PAGE_IDS.filter((page) => PAGES[page].intro === null)).toEqual(["home-2025"]);
    expect(VIEWS.main.map((page) => PAGES[page].intro?.number)).toEqual(["01", "02", "03"]);
  });
```

Create `src/data/views.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PAGE_IDS } from "./pages";
import { VIEWS } from "./views";

describe("VIEWS", () => {
  it("puts every comparison in exactly one view", () => {
    const listed: string[] = Object.values(VIEWS).flat();
    expect([...listed].sort()).toEqual([...PAGE_IDS].sort());
  });

  it("keeps the main page's three comparisons in their order", () => {
    expect(VIEWS.main).toEqual(["home", "article", "help"]);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `pnpm exec vitest run src/data/pages.test.ts src/data/views.test.ts`
Expected: FAIL. `./views` cannot be resolved, and `sectionLabel("home-2025", …)` throws.

- [ ] **Step 3: Add the comparison's types, page entry, views and notes**

`src/data/types.ts`: replace the first lines through `SectionId` with:

```ts
export type PageId = "home" | "article" | "help" | "home-2025";
export type Version = "before" | "after";
export type Device = "desktop" | "mobile";
export type HomeSectionId = "hero" | "proof" | "how" | "faq-about" | "areas" | "footer";
export type ArticleSectionId = "title" | "guide" | "questions" | "next" | "footer";
export type HelpSectionId = "title" | "questions" | "more-help" | "footer";
export type Home2025SectionId = "hero" | "proof-how" | "faq-about" | "areas" | "footer";
export type SectionIdOf = {
  home: HomeSectionId;
  article: ArticleSectionId;
  help: HelpSectionId;
  "home-2025": Home2025SectionId;
};
export type SectionId = SectionIdOf[PageId];
```

The rest of `types.ts` stays.

`src/data/pages.ts`, whole file:

```ts
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
```

`src/data/views.ts`:

```ts
import type { PageId } from "./types";

export type ViewId = "main" | "a-year-on";

export const VIEWS = {
  main: ["home", "article", "help"],
  "a-year-on": ["home-2025"],
} as const satisfies Record<ViewId, readonly PageId[]>;
```

`src/data/changes.ts`: add this entry to `CHANGES`, after `help`, copied exactly from spec §3.4:

```ts
  "home-2025": {
    hero: [
      'The headline "Get an appointment with a new GP surgery this week." becomes "Register and book with an NHS GP".',
      'A boxed postcode form under an "appointments available" count becomes the hero\'s single control: one postcode search, with a reel of appointment cards beside it on desktop.',
      'The NHS-blue header and its "Providing NHS services" logo give way to Bookable\'s own, which lies clear over the hero until the page moves.',
    ],
    "proof-how": [
      "Reviews move above how it works.",
      "Twelve star-rated reviews in a strip that scrolls sideways become one testimonials section, with headline figures under the quotes.",
      "Three bulleted steps become a looping product vignette each, labelled Step 1, Step 2, Step 3.",
    ],
    "faq-about": [
      'Five NHS accordions under "Frequently asked questions" become a new five under "Questions before you start".',
      'New in v2: "About finding an NHS GP in England" follows them.',
    ],
    areas: [
      'New in v2: "Find an NHS GP surgery in your area", with the areas where Bookable is live underneath.',
      "The 2025 homepage had no areas section, so its side waits here while v2 scrolls past.",
    ],
    footer: [
      'The NHS footer, with three links, "Made with 💙 in Stratford" and a copyright line, becomes the site-wide v2 footer: brand, inline nav, the 111/999 disclaimer and legal links.',
      "On phones the nav becomes 56px full-width rows and the legal links a two-column grid.",
    ],
  },
```

`src/components/StageIntro.tsx`, whole file. The JSX is unchanged; only where the copy comes from changes:

```tsx
import { PAGES, type StageIntroCopy } from "../data/pages";
import type { PageId } from "../data/types";
import { MetaItem } from "./MetaItem";

type StageIntroProps = { page: PageId; intro: StageIntroCopy; headingId: string };

export function StageIntro({ page, intro, headingId }: StageIntroProps) {
  const { name, route } = PAGES[page];
  const { number, summary, shipped } = intro;
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-10 sm:pt-28">
      <p className="caption text-mint">{number}</p>
      <h2 id={headingId} className="mt-3 font-extrabold text-4xl tracking-[-0.03em] sm:text-5xl">
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

In `src/components/ComparisonStage.tsx`, replace

```tsx
        {!recording && <StageIntro page={page} headingId={headingId} />}
```

with

```tsx
        {!recording && info.intro && (
          <StageIntro page={page} intro={info.intro} headingId={headingId} />
        )}
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `pnpm exec vitest run src/data/pages.test.ts src/data/views.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tour test**

In `src/lib/playScript.test.ts`, inside `describe("TOURS", …)`, add:

```ts
  it("tours the 2025 homepage through its own groups", () => {
    expect(durationOf(TOURS["home-2025"].full)).toBe(30_400);
    expect(durationOf(TOURS["home-2025"].short)).toBe(14_800);
    expect(glideStops(TOURS["home-2025"].full)).toEqual([
      "proof-how",
      "faq-about",
      "areas",
      "footer",
      "top",
      "proof-how",
      "faq-about",
      "top",
    ]);
  });
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `pnpm exec vitest run src/lib/playScript.test.ts`
Expected: FAIL. `TOURS["home-2025"]` is undefined, so this test and "only glides to groups of its own page" both throw.

- [ ] **Step 7: Add the tours**

In `src/lib/playScript.ts`, add to `TOURS` after `help`:

```ts
  "home-2025": {
    full: fullTour(["proof-how", "faq-about", "areas", "footer"], ["proof-how", "faq-about"]),
    short: shortTour(["proof-how", "faq-about"]),
  },
```

- [ ] **Step 8: Run it to make sure it passes**

Run: `pnpm exec vitest run src/lib/playScript.test.ts`
Expected: PASS. The homepage tours stay at 34 s and 14.8 s.

- [ ] **Step 9: Write the failing tests for the reused v2 side**

Create `src/data/reuse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CAPTURES } from "./captures";
import { PAGE_IDS } from "./pages";
import { findCapture, isReused, REUSED_AFTER, regroup, reusedAfter } from "./reuse";
import type { Capture, Device, SectionId } from "./types";

const DEVICES: readonly Device[] = ["desktop", "mobile"];
const STARTS = REUSED_AFTER["home-2025"].starts;

function homeAfter(device: Device): Capture {
  const capture = CAPTURES.captures.find(
    (entry) => entry.page === "home" && entry.version === "after" && entry.device === device,
  );
  if (!capture) throw new Error(`There is no home after capture for ${device}`);
  return capture;
}

function topOf(capture: Capture, id: SectionId): number {
  const section = capture.sections.find((entry) => entry.id === id);
  if (!section) throw new Error(`${id} is not a group of the capture`);
  return section.top;
}

describe("findCapture", () => {
  it("gives the 2025 comparison the homepage's v2 capture, regrouped", () => {
    for (const device of DEVICES) {
      const home = homeAfter(device);
      expect(findCapture(CAPTURES, "home-2025", "after", device)).toEqual({
        ...home,
        page: "home-2025",
        sections: [
          { id: "hero", top: topOf(home, "hero") },
          { id: "proof-how", top: topOf(home, "proof") },
          { id: "faq-about", top: topOf(home, "faq-about") },
          { id: "areas", top: topOf(home, "areas") },
          { id: "footer", top: topOf(home, "footer") },
        ],
      });
    }
  });

  it("returns a stored capture as the file holds it", () => {
    expect(findCapture(CAPTURES, "home", "after", "desktop")).toBe(homeAfter("desktop"));
  });

  it("names a capture the file lacks", () => {
    expect(() => findCapture({ ...CAPTURES, captures: [] }, "help", "before", "mobile")).toThrow(
      "There is no help before capture for mobile",
    );
  });
});

describe("regroup", () => {
  it("throws when a group has no start", () => {
    const starts = {
      hero: "hero",
      "proof-how": "proof",
      "faq-about": "faq-about",
      footer: "footer",
    } as const;
    expect(() => regroup(homeAfter("desktop"), "home-2025", starts)).toThrow(
      "areas has no start group in the home-2025 regrouping",
    );
  });

  it("throws when the capture lacks a start group", () => {
    const home = homeAfter("desktop");
    const withoutProof = {
      ...home,
      sections: home.sections.filter((section) => section.id !== "proof"),
    };
    expect(() => regroup(withoutProof, "home-2025", STARTS)).toThrow(
      "The home after desktop capture has no proof group",
    );
  });

  it("throws when the starts are out of order", () => {
    expect(() =>
      regroup(homeAfter("desktop"), "home-2025", {
        ...STARTS,
        "proof-how": "how",
        "faq-about": "proof",
      }),
    ).toThrow("faq-about would start at");
  });
});

describe("isReused", () => {
  it("reuses only the 2025 comparison's after side, from the homepage", () => {
    const reused = PAGE_IDS.flatMap((page) =>
      (["before", "after"] as const)
        .filter((version) => isReused(page, version))
        .map((version) => `${page} ${version}`),
    );
    expect(reused).toEqual(["home-2025 after"]);
    expect(reusedAfter("home-2025")?.from).toBe("home");
    expect(reusedAfter("home")).toBeNull();
  });
});
```

- [ ] **Step 10: Run them to make sure they fail**

Run: `pnpm exec vitest run src/data/reuse.test.ts`
Expected: FAIL, because `./reuse` cannot be resolved.

- [ ] **Step 11: Implement the reuse and route `captureFor` through it**

`src/data/reuse.ts`:

```ts
import { sectionIds } from "./pages";
import type {
  Capture,
  CapturesFile,
  Device,
  PageId,
  SectionId,
  SectionIdOf,
  SectionTop,
  Version,
} from "./types";

export type Reuse = { from: PageId; starts: Partial<Record<SectionId, SectionId>> };

const HOME_2025_STARTS: Record<SectionIdOf["home-2025"], SectionIdOf["home"]> = {
  hero: "hero",
  "proof-how": "proof",
  "faq-about": "faq-about",
  areas: "areas",
  footer: "footer",
};

export const REUSED_AFTER = {
  "home-2025": { from: "home", starts: HOME_2025_STARTS },
} as const;

export type ReusedPage = keyof typeof REUSED_AFTER;

const REUSES: Partial<Record<PageId, Reuse>> = REUSED_AFTER;

export function reusedAfter(page: PageId): Reuse | null {
  return REUSES[page] ?? null;
}

export function isReused(page: PageId, version: Version): boolean {
  return version === "after" && reusedAfter(page) !== null;
}

export function regroup(
  source: Capture,
  page: PageId,
  starts: Partial<Record<SectionId, SectionId>>,
): Capture {
  const sections = sectionIds(page).map((id): SectionTop => {
    const from = starts[id];
    if (from === undefined) throw new Error(`${id} has no start group in the ${page} regrouping`);
    const start = source.sections.find((section) => section.id === from);
    if (!start) {
      throw new Error(
        `The ${source.page} ${source.version} ${source.device} capture has no ${from} group`,
      );
    }
    return { id, top: start.top };
  });
  for (let index = 1; index < sections.length; index++) {
    const previous = sections[index - 1];
    const section = sections[index];
    if (section.top <= previous.top) {
      throw new Error(
        `${section.id} would start at ${section.top}px, not below ${previous.id} at ${previous.top}px`,
      );
    }
  }
  return { ...source, page, sections };
}

export function findCapture(
  file: CapturesFile,
  page: PageId,
  version: Version,
  device: Device,
): Capture {
  const reuse = version === "after" ? reusedAfter(page) : null;
  if (reuse) return regroup(findCapture(file, reuse.from, version, device), page, reuse.starts);
  const capture = file.captures.find(
    (entry) => entry.page === page && entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`There is no ${page} ${version} capture for ${device}`);
  return capture;
}
```

`src/data/captures.ts`, whole file:

```ts
import data from "./captures.json";
import { findCapture } from "./reuse";
import type { Capture, CapturesFile, Device, PageId, Version } from "./types";

export const CAPTURES = data as CapturesFile;

const FOUND = new Map<string, Capture>();

export function captureFor(page: PageId, version: Version, device: Device): Capture {
  const key = `${page} ${version} ${device}`;
  const known = FOUND.get(key);
  if (known) return known;
  const capture = findCapture(CAPTURES, page, version, device);
  FOUND.set(key, capture);
  return capture;
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
```

The map keeps a regrouped capture the same object across renders, so effects keyed on it do not re-run.

- [ ] **Step 12: Run them to make sure they pass**

Run: `pnpm exec vitest run src/data/reuse.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 13: Write failing tests for the capture side**

`capture/args.test.ts`: change the default and the error messages, and add one test:

```ts
  it("captures every page with loops by default", () => {
    expect(parseCaptureArgs([])).toEqual({
      pages: ["home", "article", "help", "home-2025"],
      skipLoops: false,
    });
  });
```

```ts
  it("rejects a page it does not know, or none", () => {
    expect(() => parseCaptureArgs(["--page", "faq"])).toThrow(
      "--page takes home, article, help, home-2025, not faq",
    );
    expect(() => parseCaptureArgs(["--page"])).toThrow(
      "--page takes home, article, help, home-2025, not nothing",
    );
  });

  it("captures the 2025 homepage on its own", () => {
    expect(parseCaptureArgs(["--page", "home-2025"]).pages).toEqual(["home-2025"]);
  });
```

`capture/pages.test.ts`, whole file:

```ts
import { describe, expect, it } from "vitest";
import { PAGE_IDS, sectionIds } from "../src/data/pages";
import { isReused } from "../src/data/reuse";
import type { PageId, Version } from "../src/data/types";
import { anchorList, buildsFor, PAGE_SOURCES, shotSides } from "./pages";

const VERSIONS: readonly Version[] = ["before", "after"];

function pinnedIds(page: PageId, version: Version): string[] {
  const shot = shotSides([page]).find((entry) => entry.version === version);
  if (!shot) throw new Error(`The ${page} ${version} side is not shot`);
  return shot.side.pinned.map((query) => query.id);
}

describe("PAGE_SOURCES", () => {
  it("anchors every group of every side that is shot", () => {
    for (const { page, version } of shotSides(PAGE_IDS)) {
      expect(anchorList(page, version).map(([id]) => id)).toEqual(sectionIds(page));
    }
  });

  it("starts every page at its top and ends it on the footer after main", () => {
    for (const { page, version } of shotSides(PAGE_IDS)) {
      const kinds = anchorList(page, version).map(([, anchor]) => anchor.kind);
      expect(kinds.at(0)).toBe("page-top");
      expect(kinds.at(-1)).toBe("footer-after-main");
    }
  });

  it("leaves only the old how-to page without common questions and the 2025 homepage without areas", () => {
    const absent = shotSides(PAGE_IDS).flatMap(({ page, version }) =>
      anchorList(page, version)
        .filter(([, anchor]) => anchor.kind === "absent")
        .map(([id]) => `${page} ${version} ${id}`),
    );
    expect(absent).toEqual(["article before questions", "home-2025 before areas"]);
  });

  it("pins the new pages' sticky parts and none of the old pages'", () => {
    expect(PAGE_IDS.map((page) => pinnedIds(page, "before"))).toEqual([[], [], [], []]);
    expect(pinnedIds("home", "after")).toEqual(["header"]);
    expect(pinnedIds("article", "after")).toEqual(["header", "breadcrumbs", "contents"]);
    expect(pinnedIds("help", "after")).toEqual(["header", "breadcrumbs"]);
  });

  it("shoots no side whose capture is reused", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        expect(PAGE_SOURCES[page][version] === null, `${page} ${version}`).toBe(
          isReused(page, version),
        );
      }
    }
  });

  it("has no anchors for a reused side", () => {
    expect(() => anchorList("home-2025", "after")).toThrow(
      "The home-2025 after side reuses another page's capture",
    );
  });
});

describe("buildsFor", () => {
  it("builds only what the chosen pages need", () => {
    expect(buildsFor(["home"])).toEqual(["home-before", "after"]);
    expect(buildsFor(["article", "help"])).toEqual(["article-before", "after", "help-before"]);
    expect(buildsFor(["home-2025"])).toEqual(["home-2025"]);
  });
});
```

`capture/merge.test.ts`:

1. Add the import:

```ts
import { isReused } from "../src/data/reuse";
```

2. Make `pageCaptures` produce only the sides that are shot:

```ts
function pageCaptures(page: PageId, commit: string): Capture[] {
  return VERSIONS.filter((version) => !isReused(page, version)).flatMap((version) =>
    DEVICES.map((device) => fake(page, version, device, commit)),
  );
}
```

3. The expectation in "replaces one page's captures and leaves every other entry as it was" becomes:

```ts
    expect(merged.captures.map((capture) => `${capture.page}:${capture.commit}`)).toEqual([
      ...Array.from({ length: 4 }, () => "home:old"),
      ...Array.from({ length: 4 }, () => "article:new"),
      ...Array.from({ length: 4 }, () => "help:old"),
      ...Array.from({ length: 2 }, () => "home-2025:old"),
    ]);
```

4. Add two tests:

```ts
  it("replaces only the 2025 homepage's two captures", () => {
    const merged = mergeCaptures(EXISTING, pageCaptures("home-2025", "new"), null);
    expect(
      merged.captures
        .slice(12)
        .map((capture) => `${capture.page} ${capture.version} ${capture.device}:${capture.commit}`),
    ).toEqual(["home-2025 before desktop:new", "home-2025 before mobile:new"]);
    const untouched = (file: CapturesFile) =>
      JSON.stringify(file.captures.filter((capture) => capture.page !== "home-2025"));
    expect(untouched(merged)).toBe(untouched(EXISTING));
  });

  it("refuses a stored capture for a side that reuses another page's", () => {
    const stray = fake("home-2025", "after", "desktop", "new");
    expect(() =>
      mergeCaptures(EXISTING, [...pageCaptures("home-2025", "new"), stray], null),
    ).toThrow(
      "captures.json would hold a home-2025 after desktop capture, but that side reuses another page's",
    );
  });
```

- [ ] **Step 14: Run them to make sure they fail**

Run: `pnpm exec vitest run capture/args.test.ts capture/pages.test.ts capture/merge.test.ts`
Expected:
- `args.test.ts` passes already: `PAGE_IDS` drives it, and its new expectations match.
- `pages.test.ts` fails: `shotSides` is not exported, and there is no `home-2025` source.
- `merge.test.ts` fails: the merge expects `home-2025 after` captures, and lets a stray one through.

- [ ] **Step 15: Teach the capture pipeline about the reused side**

`capture/pages.ts`:

1. Imports become:

```ts
import { sectionIds } from "../src/data/pages";
import type { ReusedPage } from "../src/data/reuse";
import type { Device, PageId, SectionId, SectionIdOf, Version } from "../src/data/types";
import type { BuildName } from "./builds";
import type { TokenSelectors } from "./inPage";
import type { SectionAnchor } from "./sections";
```

2. Replace `type PageSource` and add `ShotSide` and `VERSIONS` after it:

```ts
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
```

3. Add the source to `PAGE_SOURCES`, after `help`:

```ts
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
```

4. Replace `anchorList` and `buildsFor` with:

```ts
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
```

`capture/capture.ts`:

1. The pages import becomes:

```ts
import { anchorList, buildsFor, HOME_TOKEN_SELECTORS, shotSides } from "./pages";
```

2. Delete `const VERSIONS: readonly Version[] = ["before", "after"];`. Keep the `Version` type import; `homeTokens` still uses it.

3. Replace the capture loop (`for (const page of pages) { for (const version of VERSIONS) { … } }`) with:

```ts
      for (const { page, version, side } of shotSides(pages)) {
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
              pinned: side.pinned.filter((query) => query.devices.includes(device)),
              tokens: page === "home" ? HOME_TOKEN_SELECTORS[version] : null,
              withLoops: page === "home" && version === "after" && !skipLoops,
              withSpecimen: page === "home" && version === "before" && device === "desktop",
            }),
          );
        }
      }
```

`capture/merge.ts`:

1. Add the import:

```ts
import { isReused } from "../src/data/reuse";
```

2. The loop over pages becomes:

```ts
  for (const page of PAGE_IDS) {
    for (const version of VERSIONS) {
      const reused = isReused(page, version);
      for (const device of DEVICES) {
        const matches = pool.filter(
          (capture) =>
            capture.page === page && capture.version === version && capture.device === device,
        );
        if (reused) {
          if (matches.length > 0) {
            throw new Error(
              `captures.json would hold a ${page} ${version} ${device} capture, but that side reuses another page's`,
            );
          }
          continue;
        }
        if (matches.length !== 1) {
          throw new Error(
            `captures.json would have ${matches.length} ${page} ${version} ${device} captures; capture ${page} as well`,
          );
        }
        captures.push(matches[0]);
      }
    }
  }
```

`capture/compareLive.ts`:

1. Add the import:

```ts
import { reusedAfter } from "../src/data/reuse";
```

2. At the top of the `for (const page of pages)` loop in `main`, add:

```ts
    const reuse = reusedAfter(page);
    if (reuse) {
      console.log(`Skipping ${page}: its after side is the ${reuse.from} capture, so compare that`);
      continue;
    }
```

- [ ] **Step 16: Run them to make sure they pass**

Run: `pnpm exec vitest run capture/args.test.ts capture/pages.test.ts capture/merge.test.ts`
Expected: PASS.

- [ ] **Step 17: Describe the finished data file in its test, and watch it fail**

`src/data/captures.test.ts`:

1. Imports become:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSectionMap } from "../lib/sectionMap";
import { CAPTURES, captureFor } from "./captures";
import { PAGE_IDS, sectionIds } from "./pages";
import { isReused } from "./reuse";
```

2. Under `const PUBLIC = …`, add:

```ts
const VERSIONS = ["before", "after"] as const;
const DEVICES = ["desktop", "mobile"] as const;
```

3. Replace "holds before and after, desktop and mobile, for every page" with:

```ts
  it("stores one capture for every side that is shot, and none for a reused side", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        for (const device of DEVICES) {
          const matches = CAPTURES.captures.filter(
            (capture) =>
              capture.page === page && capture.version === version && capture.device === device,
          );
          expect(matches.length, `${page} ${version} ${device}`).toBe(
            isReused(page, version) ? 0 : 1,
          );
        }
      }
    }
  });

  it("answers for every comparison, version and device, with the same object each time", () => {
    for (const page of PAGE_IDS) {
      for (const version of VERSIONS) {
        for (const device of DEVICES) {
          const capture = captureFor(page, version, device);
          expect([capture.page, capture.version, capture.device]).toEqual([page, version, device]);
          expect(capture.sections.map((section) => section.id)).toEqual(sectionIds(page));
          expect(captureFor(page, version, device)).toBe(capture);
        }
      }
    }
  });

  it("maps the 2025 homepage onto v2 on both devices, holding it still through Areas", () => {
    for (const device of DEVICES) {
      const after = captureFor("home-2025", "after", device);
      const before = captureFor("home-2025", "before", device);
      const map = createSectionMap(after, before, after.viewport.height);
      const areas = after.sections.findIndex((section) => section.id === "areas");
      const start = after.sections[areas].top;
      const end = after.sections[areas + 1].top;
      const scrollAt = (anchor: number) => (anchor / after.pageHeight) * map.maxScrollA;
      expect(map.groupAt(scrollAt(start + 20))).toBe("areas");
      expect(map.mapScroll(scrollAt(end - 20))).toBeCloseTo(map.mapScroll(scrollAt(start + 20)), 6);
    }
  });
```

Run: `pnpm exec vitest run src/data/captures.test.ts`
Expected: FAIL with `home-2025 before desktop: expected 0 to be 1`, and `There is no home-2025 before capture for desktop`.

- [ ] **Step 18: Capture the 2025 homepage**

Run: `pnpm capture --page home-2025`
Expected output includes `Reusing the home-2025 build at …/home-2025` (built in Task 1), `Capturing the home-2025 before page on desktop`, `Capturing the home-2025 before page on mobile`, then `Wrote …/src/data/captures.json`. No other build starts.

If the floating-element check stops the capture, an overlay is showing. Add its selector to `HIDDEN_SELECTORS` in `capture/css.ts` and run again. The probe found nothing visible once the consent preset is set.

- [ ] **Step 19: Check the capture**

```bash
node -e 'const d = require("./src/data/captures.json"); for (const c of d.captures.filter((c) => c.page === "home-2025")) console.log(c.version, c.device, c.commit.slice(0, 10), c.pageHeight, JSON.stringify(c.sections.map((s) => s.top)), c.tiles.length, c.pinned.length, c.loops.length)'
git diff --numstat src/data/captures.json
git status --short public/captures
```

Expected:
- Two lines, `before desktop d914fbe7db 2438 [0,460,1384,2273,2273] 2 0 0` and `before mobile d914fbe7db 2166 [0,484,1208,1937,1937] 2 0 0`. These are the probe's values; a few pixels either way is fine. A missing group, or a top far from these, means an anchor matched the wrong element: stop and fix the anchor.
- `numstat` shows one deletion: the closing brace of the last help capture gains a comma. Everything else is added.
- Only `public/captures/home-2025/` is new.

Then look at `public/captures/home-2025/before/desktop/tile-00.webp` and `…/mobile/tile-00.webp`. If your viewer needs PNG, convert one with `node -e 'require("sharp")("public/captures/home-2025/before/desktop/tile-00.webp").png().toFile(".capture/home-2025-desktop.png")'`. Check:
- no cookie drawer;
- the NHS header, the blue hero with "Get an appointment with a new GP surgery this week.", "How it works", the reviews strip, five FAQ accordions and the NHS footer;
- every note in `CHANGES["home-2025"]` matches what the tiles show.

- [ ] **Step 20: Run the data tests to make sure they pass**

Run: `pnpm exec vitest run src/data/captures.test.ts`
Expected: PASS.

- [ ] **Step 21: Wire the app and the e2e helpers so the main page stays as it was**

`src/components/ComparisonStage.tsx`: add the new comparison to `MAPS`:

```ts
const MAPS: Record<PageId, DeviceMaps> = {
  home: mapsFor("home"),
  article: mapsFor("article"),
  help: mapsFor("help"),
  "home-2025": mapsFor("home-2025"),
};
```

`src/App.tsx`: render the main view's comparisons, not every comparison. Replace the `PAGE_IDS` import with

```ts
import { VIEWS } from "./data/views";
```

and `{PAGE_IDS.map((page, index) => (` with `{VIEWS.main.map((page, index) => (`.

`e2e/captureData.ts`: look captures up the way the app does. Add `import { findCapture } from "../src/data/reuse";` and make `captureOf`:

```ts
export function captureOf(page: PageId, version: Version, device: Device): Capture {
  return findCapture(FILE, page, version, device);
}
```

`e2e/smoke.spec.ts`: the imports become

```ts
import { PAGES } from "../src/data/pages";
import { VIEWS } from "../src/data/views";
```

and "shows the three comparisons, each under its own names" loops `for (const id of VIEWS.main)`.

`e2e/stage.spec.ts`: the imports become

```ts
import { PAGES } from "../src/data/pages";
import { VIEWS } from "../src/data/views";
```

`MIDDLE` gains the new comparison (Task 5 uses it):

```ts
const MIDDLE: Record<PageId, SectionId> = {
  home: "how",
  article: "guide",
  help: "questions",
  "home-2025": "proof-how",
};
```

and the first loop becomes `for (const id of VIEWS.main) {`.

- [ ] **Step 22: Run every check**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: lint and types clean, all unit tests pass, and all 44 e2e tests pass, which shows the main page is unchanged.

- [ ] **Step 23: Commit**

```bash
git add src capture e2e public/captures/home-2025
git commit -m "Add the 2025 homepage as a comparison and capture it

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Open the year-on view

**Files:**
- Create: `src/components/PageHeader.tsx`, `src/components/YearHeader.tsx`, `src/components/ViewLink.tsx`, `src/components/LiveLink.tsx`, `src/components/MainView.tsx`, `src/components/YearOnView.tsx`, `e2e/year.spec.ts`
- Modify: `src/data/caseStudy.ts`, `src/data/views.ts`, `src/data/views.test.ts`, `src/lib/urlOptions.ts`, `src/lib/urlOptions.test.ts`, `src/components/CaseHeader.tsx`, `src/components/ComparisonStage.tsx`, `src/components/SiteCredits.tsx`, `src/App.tsx`, `e2e/stageHelpers.ts`

**Interfaces:**
- Consumes: `VIEWS`, `ViewId` (Task 2); `PAGES["home-2025"].intro === null` (Task 2).
- Produces:
  - `A_YEAR_ON` copy constant.
  - `VIEW_IDS: readonly ViewId[]`, `isViewId(value: string | null): value is ViewId`, `viewHref(base: string, view: ViewId): string`.
  - `UrlOptions` gains `view: ViewId`, and in recording mode `page` defaults to the view's first comparison.
  - `ComparisonStage` prop `labelledBy?: string`.
  - `SiteCredits` prop `pages: readonly PageId[]`.
  - e2e `stageName(id: PageId): string`.

- [ ] **Step 1: Add the new view's copy**

Append to `src/data/caseStudy.ts`:

```ts
export const A_YEAR_ON = {
  title: "The homepage, a year on",
  lede: "Bookable's homepage on 30 September 2025, on the NHS design system, against v2 a year later. Drag the divider, scroll inside the frame, or press Play.",
  before: "30 Sept 2025",
  after: "v2, shipped 29 Sept 2026",
  documentTitle: "The homepage, a year on · Bookable",
  link: "See the homepage a year on",
} as const;
```

- [ ] **Step 2: Write failing unit tests for the view in the URL**

`src/lib/urlOptions.test.ts`: every existing whole-object expectation gains `view: "main"`. For example, the first test becomes:

```ts
  it("defaults to the full tour with no recording", () => {
    expect(parseUrlOptions("")).toEqual({ record: null, tour: "full", page: "home", view: "main" });
  });
```

Do the same in "reads the 16:9 recording mode", "reads the 4:3 recording mode with the short tour", both lines of "ignores an aspect it does not know", and "reads the page to record". Then add:

```ts
  it("opens the year-on view", () => {
    expect(parseUrlOptions("?view=a-year-on")).toEqual({
      record: null,
      tour: "full",
      page: "home-2025",
      view: "a-year-on",
    });
  });

  it("opens the main view for a view it does not know", () => {
    expect(parseUrlOptions("?view=year").view).toBe("main");
    expect(parseUrlOptions("?view=A-YEAR-ON").view).toBe("main");
    expect(parseUrlOptions("?view").view).toBe("main");
  });

  it("records the view's first comparison unless a page is asked for", () => {
    expect(parseUrlOptions("?view=a-year-on&record=16x9").page).toBe("home-2025");
    expect(parseUrlOptions("?view=a-year-on&record=16x9&page=help").page).toBe("help");
    expect(parseUrlOptions("?record=16x9&page=home-2025")).toEqual({
      record: "16x9",
      tour: "full",
      page: "home-2025",
      view: "main",
    });
  });

  it("keeps the year-on view when a page is asked for outside recording", () => {
    expect(parseUrlOptions("?view=a-year-on&page=article")).toEqual({
      record: null,
      tour: "full",
      page: "article",
      view: "a-year-on",
    });
  });
```

`src/data/views.test.ts`: the import becomes `import { isViewId, VIEWS, viewHref } from "./views";`. Add:

```ts
describe("isViewId", () => {
  it("recognises view ids", () => {
    expect(isViewId("main")).toBe(true);
    expect(isViewId("a-year-on")).toBe(true);
    expect(isViewId("year")).toBe(false);
    expect(isViewId(null)).toBe(false);
  });
});

describe("viewHref", () => {
  it("links to each view from the site root", () => {
    expect(viewHref("/", "main")).toBe("/");
    expect(viewHref("/", "a-year-on")).toBe("/?view=a-year-on");
  });

  it("keeps a sub-path base", () => {
    expect(viewHref("/work/bookable/", "main")).toBe("/work/bookable/");
    expect(viewHref("/work/bookable/", "a-year-on")).toBe("/work/bookable/?view=a-year-on");
  });
});
```

- [ ] **Step 3: Run them to make sure they fail**

Run: `pnpm exec vitest run src/lib/urlOptions.test.ts src/data/views.test.ts`
Expected: FAIL. `view` is missing from the options, and `isViewId` and `viewHref` are not exported.

- [ ] **Step 4: Read the view from the URL**

Append to `src/data/views.ts`:

```ts
export const VIEW_IDS: readonly ViewId[] = ["main", "a-year-on"];

export function isViewId(value: string | null): value is ViewId {
  return VIEW_IDS.some((id) => id === value);
}

export function viewHref(base: string, view: ViewId): string {
  return view === "main" ? base : `${base}?view=${view}`;
}
```

`src/lib/urlOptions.ts`, whole file:

```ts
import { isPageId } from "../data/pages";
import type { PageId } from "../data/types";
import { isViewId, VIEWS, type ViewId } from "../data/views";

export type RecordAspect = "16x9" | "4x3";

export type UrlOptions = {
  record: RecordAspect | null;
  tour: "full" | "short";
  page: PageId;
  view: ViewId;
};

export function parseUrlOptions(search: string): UrlOptions {
  const params = new URLSearchParams(search);
  const record = params.get("record");
  const page = params.get("page");
  const asked = params.get("view");
  const view: ViewId = isViewId(asked) ? asked : "main";
  return {
    record: record === "16x9" || record === "4x3" ? record : null,
    tour: params.get("tour") === "short" ? "short" : "full",
    page: isPageId(page) ? page : VIEWS[view][0],
    view,
  };
}
```

- [ ] **Step 5: Run them to make sure they pass**

Run: `pnpm exec vitest run src/lib/urlOptions.test.ts src/data/views.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing end-to-end tests for the view**

`e2e/stageHelpers.ts`: name the year-on stage by its header. Add the imports and `stageName`, and use it in `stageRegion`:

```ts
import { A_YEAR_ON } from "../src/data/caseStudy";
```

```ts
const NAMED_BY_VIEW: Partial<Record<PageId, string>> = { "home-2025": A_YEAR_ON.title };

export function stageName(id: PageId): string {
  return NAMED_BY_VIEW[id] ?? PAGES[id].name;
}

export function stageRegion(page: Page, id: PageId = "home"): Locator {
  return page.getByRole("region", { name: stageName(id), exact: true });
}
```

Create `e2e/year.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { A_YEAR_ON, CASE_STUDY } from "../src/data/caseStudy";
import { changesFor } from "../src/data/changes";
import { PAGES } from "../src/data/pages";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

const YEAR = "/?view=a-year-on";

test("the main page links to the homepage a year on, and the new view links back", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: A_YEAR_ON.link, exact: true }).click();
  await expect(page).toHaveURL(/\/\?view=a-year-on$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(A_YEAR_ON.title);
  await page.getByRole("link", { name: CASE_STUDY.title, exact: true }).click();
  await expect(page).toHaveURL(/:4173\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(CASE_STUDY.title);
});

test("opens with its own title and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(YEAR);
  await expect(page).toHaveTitle(A_YEAR_ON.documentTitle);
  expect(errors).toEqual([]);
});

test("introduces the comparison with both dates", async ({ page }) => {
  await page.goto(YEAR);
  const banner = page.getByRole("banner");
  await expect(banner.getByText(A_YEAR_ON.lede)).toBeVisible();
  await expect(banner.getByText(A_YEAR_ON.before, { exact: true })).toBeVisible();
  await expect(banner.getByText(A_YEAR_ON.after, { exact: true })).toBeVisible();
  await expect(banner.getByRole("link", { name: "bookable.health", exact: true })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
});

test("shows one comparison, named by the header and without an intro of its own", async ({
  page,
}) => {
  await page.goto(YEAR);
  await expect(page.getByRole("region", { name: A_YEAR_ON.title, exact: true })).toHaveCount(1);
  const stage = await openStage(page, "home-2025");
  await expect(
    stage.getByRole("navigation", { name: "Homepage sections", exact: true }).getByRole("button"),
  ).toHaveText(PAGES["home-2025"].sections.map((section) => section.label));
  await expect(dividerSlider(page, "home-2025")).toHaveCount(1);
  await expect(stage.getByText(changesFor("home-2025", "hero")[0])).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
});

test("ignores a page asked for outside recording", async ({ page }) => {
  await page.goto(`${YEAR}&page=article`);
  await expect(stageRegion(page, "home-2025")).toHaveCount(1);
  await expect(stageRegion(page, "article")).toHaveCount(0);
});

test("credits the captures it shows", async ({ page }) => {
  await page.goto(YEAR);
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
  await expect(page.getByRole("contentinfo")).toContainText(/Screens captured (on|between) \d/);
});

test("shares the main page header's left edge", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const lefts: number[] = [];
    for (const url of ["/", YEAR]) {
      await page.goto(url);
      lefts.push(
        await page
          .getByRole("heading", { level: 1 })
          .evaluate((heading) => Math.round(heading.getBoundingClientRect().left)),
      );
    }
    expect(lefts[1], `${viewport.width}px`).toBe(lefts[0]);
  }
});
```

- [ ] **Step 7: Run them to make sure they fail**

Run: `pnpm exec playwright test e2e/year.spec.ts`
Expected: FAIL. There is no "See the homepage a year on" link, and `?view=a-year-on` still renders the main page, so the year-on title, region and credits are missing. "shares the main page header's left edge" may pass already; that is fine.

- [ ] **Step 8: Build the shared header and the links**

`src/components/LiveLink.tsx`:

```tsx
import { CASE_STUDY } from "../data/caseStudy";

export function LiveLink() {
  return (
    <a
      href={CASE_STUDY.liveUrl}
      className="underline decoration-mint underline-offset-4 hover:text-mint"
    >
      bookable.health
    </a>
  );
}
```

`src/components/ViewLink.tsx`:

```tsx
import { type ViewId, viewHref } from "../data/views";

type ViewLinkProps = { view: ViewId; direction: "back" | "forward"; children: string };

export function ViewLink({ view, direction, children }: ViewLinkProps) {
  return (
    <a
      href={viewHref(import.meta.env.BASE_URL, view)}
      className="font-bold underline decoration-mint underline-offset-4 hover:text-mint"
    >
      {direction === "back" && <span aria-hidden="true">← </span>}
      {children}
      {direction === "forward" && <span aria-hidden="true"> →</span>}
    </a>
  );
}
```

`src/components/PageHeader.tsx`, which is the old `CaseHeader` layout with its content passed in:

```tsx
import { m } from "motion/react";
import type { ReactNode } from "react";
import { CASE_STUDY } from "../data/caseStudy";
import { useMotionPreference } from "../hooks/useMotionPreference";

type PageHeaderProps = {
  title: string;
  lede: string;
  headingId?: string;
  back?: ReactNode;
  next?: ReactNode;
  children: ReactNode;
};

const RISE = [0.16, 1, 0.3, 1] as const;

export function PageHeader({ title, lede, headingId, back, next, children }: PageHeaderProps) {
  const { reduced } = useMotionPreference();
  const words = title.split(" ");
  return (
    <header className="mx-auto w-full max-w-[1240px] px-6 pt-20 pb-14 sm:pt-28">
      {back && <p className="mb-8 text-sm">{back}</p>}
      <p className="caption text-mint">{CASE_STUDY.eyebrow}</p>
      <h1
        id={headingId}
        className="mt-5 max-w-[12ch] text-balance font-extrabold text-[clamp(44px,8.4vw,112px)] leading-[0.95] tracking-[-0.035em]"
      >
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
        {lede}
      </m.p>
      <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 text-sm">{children}</dl>
      {next && <p className="mt-10 text-sm">{next}</p>}
    </header>
  );
}
```

`src/components/CaseHeader.tsx`, whole file:

```tsx
import { A_YEAR_ON, CASE_STUDY } from "../data/caseStudy";
import { LiveLink } from "./LiveLink";
import { MetaItem } from "./MetaItem";
import { PageHeader } from "./PageHeader";
import { ViewLink } from "./ViewLink";

export function CaseHeader() {
  return (
    <PageHeader
      title={CASE_STUDY.title}
      lede={CASE_STUDY.lede}
      next={
        <ViewLink view="a-year-on" direction="forward">
          {A_YEAR_ON.link}
        </ViewLink>
      }
    >
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
        <LiveLink />
      </MetaItem>
    </PageHeader>
  );
}
```

`src/components/YearHeader.tsx`:

```tsx
import { A_YEAR_ON, CASE_STUDY } from "../data/caseStudy";
import { LiveLink } from "./LiveLink";
import { MetaItem } from "./MetaItem";
import { PageHeader } from "./PageHeader";
import { ViewLink } from "./ViewLink";

type YearHeaderProps = { headingId: string };

export function YearHeader({ headingId }: YearHeaderProps) {
  return (
    <PageHeader
      title={A_YEAR_ON.title}
      lede={A_YEAR_ON.lede}
      headingId={headingId}
      back={
        <ViewLink view="main" direction="back">
          {CASE_STUDY.title}
        </ViewLink>
      }
    >
      <MetaItem term="Before">{A_YEAR_ON.before}</MetaItem>
      <MetaItem term="After">{A_YEAR_ON.after}</MetaItem>
      <MetaItem term="Live">
        <LiveLink />
      </MetaItem>
    </PageHeader>
  );
}
```

- [ ] **Step 9: Let a stage be named from outside, and date the credits per view**

`src/components/ComparisonStage.tsx`:

1. The props type becomes:

```ts
type ComparisonStageProps = {
  page: PageId;
  options: UrlOptions;
  eager: boolean;
  labelledBy?: string;
};
```

2. The signature becomes `export function ComparisonStage({ page, options, eager, labelledBy }: ComparisonStageProps) {`.

3. Right after `const headingId = useId();`, add:

```ts
  const ownIntro = !recording && labelledBy === undefined;
  if (ownIntro && info.intro === null) {
    throw new Error(
      `The ${page} comparison has no intro, so it needs the id of the heading that names it`,
    );
  }
```

4. On the `<section>`, `aria-labelledby={recording ? undefined : headingId}` becomes:

```tsx
      aria-labelledby={recording ? undefined : (labelledBy ?? headingId)}
```

5. The intro line from Task 2 becomes:

```tsx
        {ownIntro && info.intro && (
          <StageIntro page={page} intro={info.intro} headingId={headingId} />
        )}
```

`src/components/SiteCredits.tsx`, whole file:

```tsx
import { captureFor } from "../data/captures";
import type { PageId } from "../data/types";
import { capturedOn } from "../lib/capturedOn";

type SiteCreditsProps = { pages: readonly PageId[] };

const VERSIONS = ["before", "after"] as const;
const DEVICES = ["desktop", "mobile"] as const;

export function SiteCredits({ pages }: SiteCreditsProps) {
  const captured = capturedOn(
    pages.flatMap((page) =>
      VERSIONS.flatMap((version) =>
        DEVICES.map((device) => captureFor(page, version, device).capturedAt),
      ),
    ),
  );
  return (
    <footer className="mx-auto w-full max-w-[1240px] border-line border-t px-6 py-10 text-mist/50 text-sm">
      <p>
        Screens captured {captured} from production builds of each version. Frutiger is licensed to
        the NHS, so it appears here only as an image.
      </p>
    </footer>
  );
}
```

On the main view this dates the same twelve captures as before, so its credit line does not change.

- [ ] **Step 10: Split the two views out of `App`**

`src/components/MainView.tsx`:

```tsx
import { VIEWS } from "../data/views";
import type { UrlOptions } from "../lib/urlOptions";
import { CaseHeader } from "./CaseHeader";
import { ComparisonStage } from "./ComparisonStage";
import { DeferredDesignDiff } from "./DeferredDesignDiff";
import { SiteCredits } from "./SiteCredits";

type MainViewProps = { options: UrlOptions };

export function MainView({ options }: MainViewProps) {
  return (
    <>
      <CaseHeader />
      <main className="pb-24">
        {VIEWS.main.map((page, index) => (
          <ComparisonStage key={page} page={page} options={options} eager={index === 0} />
        ))}
        <DeferredDesignDiff />
      </main>
      <SiteCredits pages={VIEWS.main} />
    </>
  );
}
```

`src/components/YearOnView.tsx`:

```tsx
import { useEffect, useId } from "react";
import { A_YEAR_ON } from "../data/caseStudy";
import { VIEWS } from "../data/views";
import type { UrlOptions } from "../lib/urlOptions";
import { ComparisonStage } from "./ComparisonStage";
import { SiteCredits } from "./SiteCredits";
import { YearHeader } from "./YearHeader";

type YearOnViewProps = { options: UrlOptions };

const [PAGE] = VIEWS["a-year-on"];

export function YearOnView({ options }: YearOnViewProps) {
  const headingId = useId();
  useEffect(() => {
    document.title = A_YEAR_ON.documentTitle;
  }, []);
  return (
    <>
      <YearHeader headingId={headingId} />
      <main className="pb-24">
        <ComparisonStage page={PAGE} options={options} eager labelledBy={headingId} />
      </main>
      <SiteCredits pages={VIEWS["a-year-on"]} />
    </>
  );
}
```

`src/App.tsx`, whole file:

```tsx
import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { ComparisonStage } from "./components/ComparisonStage";
import { GlowBackground } from "./components/GlowBackground";
import { MainView } from "./components/MainView";
import { YearOnView } from "./components/YearOnView";
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
              {options.view === "main" ? (
                <MainView options={options} />
              ) : (
                <YearOnView options={options} />
              )}
            </>
          ) : (
            <ComparisonStage page={options.page} options={options} eager />
          )}
        </MotionPreferenceContext>
      </MotionConfig>
    </LazyMotion>
  );
}
```

- [ ] **Step 11: Run the view's tests to make sure they pass**

Run: `pnpm exec playwright test e2e/year.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 12: Run every check**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all clean. 51 e2e tests pass: the 44 existing, which show the main page is unchanged, plus 7 new.

- [ ] **Step 13: Commit**

```bash
git add src e2e
git commit -m "Open the homepage a year on at ?view=a-year-on

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Name the year-on comparison's sides by date

**Files:**
- Modify: `src/data/pages.ts`, `src/components/VersionLabels.tsx`, `src/components/StageViewport.tsx`, `e2e/year.spec.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `PAGES` (Task 2).
- Produces: `SideLabel = { long: string; short: string }`; `PageInfo.sides: Record<Version, SideLabel>`; `VersionLabels` props `{ page: PageId; device: Device; divider: MotionValue<number> }`.

- [ ] **Step 1: Write the failing tests**

Append to `e2e/year.spec.ts`:

```ts
test("names the two sides by date", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await expect(stage.getByText("Sept 2025 · NHS design system", { exact: true })).toBeVisible();
  await expect(stage.getByText("Sept 2026 · v2", { exact: true })).toBeVisible();
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByText("2025", { exact: true })).toBeVisible();
  await expect(stage.getByText("v2", { exact: true })).toBeVisible();
});
```

Append to `e2e/smoke.spec.ts`:

```ts
test("names the homepage's sides by design system", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page);
  await expect(stage.getByText("Before · NHS design system", { exact: true })).toBeVisible();
  await expect(stage.getByText("After · v2", { exact: true })).toBeVisible();
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByText("Before", { exact: true })).toBeVisible();
  await expect(stage.getByText("After", { exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Run them to make sure the new one fails**

Run: `pnpm exec playwright test e2e/year.spec.ts e2e/smoke.spec.ts`
Expected: "names the two sides by date" FAILS, because the chips still read "Before · NHS design system". "names the homepage's sides by design system" passes already and pins the main page's labels.

- [ ] **Step 3: Give each comparison its side labels**

`src/data/pages.ts`:

1. The type import becomes `import type { PageId, SectionId, SectionIdOf, Version } from "./types";`.

2. Add after `StageIntroCopy`:

```ts
export type SideLabel = { long: string; short: string };
```

3. `PageInfo` gains `sides: Record<Version, SideLabel>;`, after `sections`.

4. Add after `type SectionsOf…`:

```ts
const NHS_AND_V2: Record<Version, SideLabel> = {
  before: { long: "Before · NHS design system", short: "Before" },
  after: { long: "After · v2", short: "After" },
};
```

5. `home`, `article` and `help` gain `sides: NHS_AND_V2,` after `sections`. `"home-2025"` gains:

```ts
    sides: {
      before: { long: "Sept 2025 · NHS design system", short: "2025" },
      after: { long: "Sept 2026 · v2", short: "v2" },
    },
```

`src/components/VersionLabels.tsx`, whole file:

```tsx
import type { MotionValue } from "motion/react";
import { PAGES } from "../data/pages";
import type { Device, PageId } from "../data/types";
import { useLiveStyle } from "../hooks/useLiveStyle";
import { clamp } from "../lib/math";

type VersionLabelsProps = { page: PageId; device: Device; divider: MotionValue<number> };

const CHIP =
  "rounded-full px-3 py-1.5 font-extrabold text-[11px] uppercase leading-none tracking-[0.09em] backdrop-blur";

const FADE_SHARE = 0.12;

export function VersionLabels({ page, device, divider }: VersionLabelsProps) {
  const { sides } = PAGES[page];
  const beforeChip = useLiveStyle<HTMLSpanElement>(divider, "opacity", (share) =>
    String(clamp(share / FADE_SHARE, 0, 1)),
  );
  const afterChip = useLiveStyle<HTMLSpanElement>(divider, "opacity", (share) =>
    String(clamp((1 - share) / FADE_SHARE, 0, 1)),
  );
  const compact = device === "mobile";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between"
    >
      <span ref={beforeChip.ref} className={`${CHIP} bg-ink/75 text-mist`} style={beforeChip.style}>
        {compact ? sides.before.short : sides.before.long}
      </span>
      <span ref={afterChip.ref} className={`${CHIP} bg-mint text-ink`} style={afterChip.style}>
        {compact ? sides.after.short : sides.after.long}
      </span>
    </div>
  );
}
```

`src/components/StageViewport.tsx`: `<VersionLabels device={device} divider={divider} />` becomes

```tsx
      <VersionLabels page={page} device={device} divider={divider} />
```

- [ ] **Step 4: Run them to make sure they pass, then every check**

Run: `pnpm exec playwright test e2e/year.spec.ts e2e/smoke.spec.ts`
Expected: PASS.

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all clean; 53 e2e tests pass.

- [ ] **Step 5: Commit**

```bash
git add src e2e
git commit -m "Name the year-on comparison's sides by date

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Run the stage tests on the year-on comparison too

These tests pin behaviour the stage already has, on the new comparison and its view. They should pass at once. A failure is a real bug: keep the failing test as its regression test, fix the code, and only then move on.

**Files:**
- Modify: `e2e/stageHelpers.ts`, `e2e/stage.spec.ts`, `e2e/year.spec.ts`

**Interfaces:**
- Consumes: `VIEW_IDS`, `VIEWS`, `viewHref` (Tasks 2 and 3); `stageName` (Task 3).
- Produces: e2e `viewUrl(id: PageId): string`.

- [ ] **Step 1: Open any comparison on its own view**

Add to `e2e/stageHelpers.ts`:

```ts
import { VIEW_IDS, VIEWS, viewHref } from "../src/data/views";
```

```ts
export function viewUrl(id: PageId): string {
  const view = VIEW_IDS.find((key) => {
    const pages: readonly PageId[] = VIEWS[key];
    return pages.includes(id);
  });
  if (!view) throw new Error(`${id} is in no view`);
  return viewHref("/", view);
}
```

- [ ] **Step 2: Loop the stage tests over every comparison**

`e2e/stage.spec.ts`:

1. Imports become:

```ts
import { expect, test } from "@playwright/test";
import { PAGE_IDS, PAGES } from "../src/data/pages";
import type { PageId, SectionId } from "../src/data/types";
import { captureOf, scrollForAnchor, scrollToMiddleOf, spanOf } from "./captureData";
import {
  beforeAnchor,
  dividerSlider,
  openStage,
  scrollAfterTo,
  stageName,
  stageRegion,
  viewUrl,
} from "./stageHelpers";
```

2. The first loop becomes `for (const id of PAGE_IDS) {`, its `test.describe(PAGES[id].name, …)` becomes `test.describe(stageName(id), …)`, and each of its three `await page.goto("/");` becomes `await page.goto(viewUrl(id));`. The existing titles stay the same: `stageName` gives "Homepage", "Guide article" and "Help centre" for the main page's three.

3. The phone-sized loop becomes:

```ts
  for (const id of ["home", "article", "home-2025"] as const) {
    test(`${stageName(id)} opens on the mobile captures without scrolling sideways`, async ({
      page,
    }) => {
      await page.goto(viewUrl(id));
      const stage = await openStage(page, id);
      await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
        "src",
        new RegExp(`${captureOf(id, "after", "mobile").tiles[0].webp}$`),
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
```

`PAGES` is still imported for the "before the animation code has loaded" titles.

- [ ] **Step 3: Add the year-on stage's own behaviour tests and review shots**

`e2e/year.spec.ts`: the imports become

```ts
import { expect, test } from "@playwright/test";
import { A_YEAR_ON, CASE_STUDY } from "../src/data/caseStudy";
import { changesFor } from "../src/data/changes";
import { PAGES } from "../src/data/pages";
import { captureOf, scrollForAnchor, scrollToMiddleOf, spanOf } from "./captureData";
import {
  beforeAnchor,
  dividerSlider,
  openStage,
  scrollAfterTo,
  stageRegion,
} from "./stageHelpers";
```

Append:

```ts
test("the 2025 page holds still while v2 scrolls through the areas", async ({ page }) => {
  const after = captureOf("home-2025", "after", "desktop");
  const before = captureOf("home-2025", "before", "desktop");
  const areas = spanOf(after, "areas");
  const held = spanOf(before, "areas").start;
  await page.goto(YEAR);
  await openStage(page, "home-2025");
  await scrollAfterTo(page, scrollForAnchor(after, areas.start + 20), "home-2025");
  await expect(stageRegion(page, "home-2025")).toHaveAttribute("data-group", "areas");
  await expect.poll(() => beforeAnchor(page, before, "home-2025")).toBeCloseTo(held, 0);
  await scrollAfterTo(page, scrollForAnchor(after, areas.end - 20), "home-2025");
  await expect.poll(() => beforeAnchor(page, before, "home-2025")).toBeCloseTo(held, 0);
});

test("switching device keeps the group", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stage).toHaveAttribute("data-group", "faq-about");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("before-page").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/home-2025\/before\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "faq-about");
});

test("Play tours the year-on comparison", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage).toHaveAttribute("data-group", "proof-how", { timeout: 5000 });
});

test("recording mode shows the year-on comparison, asked for by page or by view", async ({
  page,
}) => {
  for (const url of ["/?record=16x9&page=home-2025", `${YEAR}&record=16x9`]) {
    await page.goto(url);
    const stage = page.getByRole("region", { name: PAGES["home-2025"].name, exact: true });
    await expect(stage.getByTestId("before-page").locator("img").first()).toHaveAttribute(
      "src",
      /captures\/home-2025\/before\/desktop\//,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  }
});

test("a keyboard visitor tabs from the back link to the divider", async ({ page }) => {
  await page.goto(YEAR);
  await page.getByRole("link", { name: CASE_STUDY.title, exact: true }).focus();
  const slider = dividerSlider(page, "home-2025");
  for (let presses = 0; presses < 16; presses++) {
    if (await slider.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(slider).toBeFocused();
});

test("with reduced motion Play cuts instead of sweeping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(dividerSlider(page, "home-2025")).toHaveValue("0", { timeout: 400 });
});

test("@review the homepage a year on", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto(YEAR);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/14-year-top.png" });
  await openStage(page, "home-2025");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/15-year-stage.png" });
  await scrollAfterTo(
    page,
    scrollToMiddleOf(captureOf("home-2025", "after", "desktop"), "proof-how"),
    "home-2025",
  );
  await page.waitForTimeout(900);
  await page.screenshot({ path: ".capture/review/15-year-stage-middle.png" });
});

test("@review the homepage a year on, on a phone", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto(YEAR);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/16-year-phone-top.png" });
  await openStage(page, "home-2025");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/16-year-phone-stage.png" });
  await page.close();
});
```

- [ ] **Step 4: Run them**

Run: `pnpm exec playwright test e2e/stage.spec.ts e2e/year.spec.ts`
Expected: PASS. If one fails, debug it before going on, and keep the failing test as the regression test for the fix.

- [ ] **Step 5: Take and look at the review shots**

Run: `pnpm review`
Then open `.capture/review/14-year-top.png`, `15-year-stage.png`, `15-year-stage-middle.png`, `16-year-phone-top.png` and `16-year-phone-stage.png`, plus `01-top.png` for the main page's new link. Check:
- the header reads as spec §3.2, with the back link above the eyebrow;
- the frame shows the 2025 page left of the divider and v2 right of it;
- the chips read "Sept 2025 · NHS design system" and "Sept 2026 · v2";
- the callouts match the group in view;
- nothing overflows on the phone;
- on the main page, the link sits under the header details.

- [ ] **Step 6: Run every check**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
Expected: all clean. 63 e2e tests pass: 53 before this task, plus 4 stage tests for the year-on comparison (three in the loop, one on a phone) and 6 behaviour tests.

- [ ] **Step 7: Commit**

```bash
git add e2e
git commit -m "Run the stage tests on the year-on comparison too

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Budget each view, document it, and check the whole branch

**Files:**
- Modify: `scripts/budget.ts`, `README.md`
- Outside the repo: `/Users/liem/.claude/projects/-Users-liem-Desktop-repos-sanny/memory/project_bookable_before_after_showcase.md` and its line in `MEMORY.md` there

**Interfaces:**
- Consumes: `VIEW_IDS`, `VIEWS` (Tasks 2 and 3); `findCapture` (Task 2).
- Produces: nothing for code.

- [ ] **Step 1: Budget first paint per view**

`scripts/budget.ts`:

1. Add the imports:

```ts
import { findCapture } from "../src/data/reuse";
import { VIEW_IDS, VIEWS } from "../src/data/views";
```

2. Replace everything from `const firstPaint = …` to the end of the file with:

```ts
console.log(
  `Initial JS: ${(jsBytes / 1024).toFixed(1)} KB gzipped (budget ${JS_BUDGET / 1024} KB)`,
);
let over = jsBytes > JS_BUDGET;
for (const view of VIEW_IDS) {
  const [first] = VIEWS[view];
  const firstPaint = (["before", "after"] as const).flatMap((version) => {
    const capture = findCapture(data, first, version, "desktop");
    return [
      capture.tiles[0].avif,
      ...capture.pinned.flatMap((layer) => layer.states.map((state) => state.src)),
    ];
  });
  const imageBytes = firstPaint.reduce(
    (total, path) => total + statSync(join(DIST, path)).size,
    0,
  );
  console.log(
    `First-paint images (${view}): ${(imageBytes / 1024 / 1024).toFixed(2)} MB (budget ${IMAGE_BUDGET / 1024 / 1024} MB)`,
  );
  if (imageBytes > IMAGE_BUDGET) over = true;
}
if (over) process.exitCode = 1;
```

For the main view this counts what the script counted before: both homepage desktop first tiles and the header layers.

- [ ] **Step 2: Run the budgets**

Run: `pnpm build && pnpm budget`
Expected: `Initial JS:` under 100.0 KB (96.8 KB before this work); `First-paint images (main): 0.33 MB`; `First-paint images (a-year-on):` under 1.50 MB; exit code 0.

If the initial JS is over budget, load the year-on view only on that view. In `src/App.tsx`, replace the static `YearOnView` import with

```tsx
const YearOnView = lazy(() =>
  import("./components/YearOnView").then((module) => ({ default: module.YearOnView })),
);
```

importing `lazy` and `Suspense` from `react`. Then wrap the view as `<Suspense fallback={null}><YearOnView options={options} /></Suspense>`, and run Step 2 again.

- [ ] **Step 3: Document the view in the README**

`README.md`:

1. Append to the first paragraph: `A second view, `/?view=a-year-on`, sets the homepage from 30 September 2025 against v2 a year later.`

2. In "Record a shot", the second sentence becomes: `Add `&page=article`, `&page=help` or `&page=home-2025` for the other comparisons (`/?view=a-year-on&record=16x9` records the year-on one too), and `&tour=short` for a cut of about 15 seconds.`

3. In "Deploy", the last sentence becomes: `` `pnpm budget` checks the initial JS (100 KB gzipped) and, for each view, the first-paint image (1.5 MB) budgets.``

4. Add this row to the recapture table:

```markdown
| Homepage, a year on | `/` at `d914fbe7db` (30 Sept 2025) | the homepage's after capture, regrouped |
```

5. Add `pnpm capture --page home-2025` to the commands block.

6. The ports sentence ends: `… the article before on 3063, the help centre before on 3064 and the 2025 homepage on 3065. Nothing is written to sanny.`

7. Add a paragraph after it:

```markdown
A commit the sanny clone lacks (a shallow clone stops in June 2026) is fetched by its full SHA
from sanny's `origin` into `CAPTURE_WORK_DIR/sanny-history.git` and exported from there. The
year-on comparison's v2 side is not shot: it is the homepage's after capture with its sections
regrouped (`src/data/reuse.ts`), so recapturing `home` updates both views, and
`pnpm capture:compare` skips it.
```

8. `pnpm capture:clean` deletes the builds and the fetched history: change "deletes the builds" to "deletes the builds and the fetched history".

- [ ] **Step 4: Update the project memory**

In `/Users/liem/.claude/projects/-Users-liem-Desktop-repos-sanny/memory/project_bookable_before_after_showcase.md`, keep the frontmatter's `name` and `metadata`, and update `description` and the body:
- the second view, `/?view=a-year-on`, comparing the homepage at sanny `d914fbe7db` (30 Sept 2025) with v2;
- `home-2025` on port 3065, fetched by full SHA from sanny's origin into `<work dir>/sanny-history.git`, because the local clone is shallow (history from 2026-06-09);
- its v2 side reuses the homepage's after capture, regrouped in `src/data/reuse.ts`.

Then update its line in `MEMORY.md` to mention the year-on view.

- [ ] **Step 5: Check the whole branch**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm e2e && pnpm e2e && pnpm e2e
pnpm build && pnpm budget
pnpm review
```

Expected:
- All clean.
- The same e2e count passes on all three runs. This catches flaky tests.
- Budgets within limits.
- Review shots written.

Then check in a real browser:
1. Run `pnpm preview`.
2. Open `http://localhost:4173/` and follow "See the homepage a year on".
3. On the year-on view: drag the divider, scroll the frame through every group, switch to Mobile, and press Play.
4. Follow the back link.
5. Repeat at a 390px-wide window.

The desktop app's browser pane runs as a hidden document, with animations frozen and key input dropped. If you use it, judge layout and text from screenshots and `read_page`, and leave motion to the e2e tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/budget.ts README.md
git commit -m "Budget each view and document the year-on view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
