# Bookable redesign

An interactive, animated before and after of six Bookable pages (bookable.health) as they moved
from the NHS design system to Bookable's own (v2) in 2026: the homepage, a guide article,
the help centre, the GP search, a GP surgery page and a clinician page. Drag a divider, scroll inside a frame (both versions stay on the same section),
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

Open `/?record=16x9` or `/?record=4x3`. Add `&page=article`, `&page=help`, `&page=search`, `&page=gp` or `&page=clinician` for the other
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

| Page | Before | After (at `c016453be7` unless noted) |
|---|---|---|
| Homepage | `/` at `0a143c6820` | `/` |
| Guide article | `/how-to/book-doctor-appointment-nhs` at `1e021d8370^` | `/book-a-gp-appointment` |
| Help centre | `/faq` at `38facb0a65^` | `/help` |
| GP search | `/gp/search` at `801e381b9a^` | `/gp/search` at `3362f7fc39` |
| GP surgery page | `/gp/john-smith-medical-centre-loc_9a5qmmkpexdu` at `96766b8a9c^` | the same at `3362f7fc39` |
| Clinician page | `/clinician/cli_9a5qmmqhn4r5` at `5a4e8c4cdf^` | the same at `3362f7fc39` |

```bash
pnpm capture
pnpm capture --page article --page help
```

This needs a sanny checkout (`SANNY_REPO`, default `~/Desktop/repos/sanny`), pnpm, and ffmpeg
with libx264 and libvpx-vp9. Each commit is exported with `git archive` into `CAPTURE_WORK_DIR`
(default `<os tmp>/bookable-before-after`), built, and served against the public production API:
the homepage before on port 3061, every after page on 3062, the article before on 3063, the help
centre before on 3064 the GP search before on 3065, every page at
`3362f7fc39` on 3066, the surgery page before on 3067 and the clinician page before on 3068. The
GP search, surgery and clinician pages are shot for postcode IG1 2UT.

API calls are answered from `capture/fixtures/api/<page>/`. A read (GET) with no fixture is fetched
from the production API once and saved there; writes (POST, PUT, PATCH, DELETE) are never sent and
each needs a fixture written by hand. Each page's `clock.json` holds the time its data was recorded,
and the browser clock is frozen at it, so dates such as "tomorrow" read the same on every recapture.
`CAPTURE_OFFLINE=1 pnpm capture` fails on any call without a fixture instead of fetching it. Only
calls the browser makes are covered: the surgery and clinician pages also fetch data while the Next
server renders them, and those calls go to production. Nothing is written to sanny.

`--page` captures only those pages and leaves every other page's files and data as they were.
`--skip-loops` skips the homepage's video loops. `pnpm capture:clean` deletes the builds;
`pnpm capture:serve [--page …]` serves builds for inspection; `pnpm capture:compare [--page …]`
puts the live site next to the capture in `.capture/live-vs-capture-<page>.png`. The GP search, surgery
and clinician before pages were built after the v2 footer landed (`7721c5b954`), so the capture
swaps their footer for the last NHS footer, shot from the homepage before build. The surgery and clinician
before pages also postdate the v2 header (`9a5d90ba1d`), so everything above `<main>` (the header
and the Back bar) is swapped for what the same route showed at `9a5d90ba1d^`, served on 3069. The capture hides
each page's sticky parts (the header, the breadcrumb bar, the article's contents sidebar) on
purpose, because the page draws them as live layers.

## Licensing

Frutiger is licensed to the NHS, so no Frutiger file is in this project; the specimen is a
rendered image. Hanken Grotesk is OFL and is bundled from `@fontsource/hanken-grotesk`. The screenshots show public
Bookable pages.
