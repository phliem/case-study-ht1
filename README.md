# Bookable redesign

An interactive, animated before and after of Bookable (bookable.health) as it moved from the NHS
design system to its own (v2) in 2026: the homepage, a guide article, the help centre, care
navigation, the GP search, a GP surgery page, booking and a clinician page. Drag a divider, scroll
inside a frame (both versions stay on the same section), switch Desktop and Mobile, or press Play.
Care navigation and booking are journeys, so each is shown as its steps stacked into one page.

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

Open `/?record=16x9` or `/?record=4x3`. Add `&page=` with `article`, `help`, `carenav`, `search`, `gp`, `booking` or `clinician` for the other
comparisons, and `&tour=short` for a cut of about 15 seconds. The comparison fills the window with
no controls or cursor and loops its tour; screen-record the window. Recording mode ignores the
reduced-motion setting.

## Deploy

`pnpm build` writes a static site to `dist/`. Set `VITE_BASE=/work/bookable/` to serve it from a
sub-path, and `VITE_SITE_URL=https://your.site` so the link preview uses an absolute image URL.
Regenerate the preview image with `pnpm og`, then build again. `pnpm budget` checks the initial
JS (110 KB gzipped) and first-paint image (1.5 MB) budgets.

## Recapture

The captures in `public/captures/` and `src/data/captures.json` come from pinned commits of the
sanny repo:

| Page | Before | After |
|---|---|---|
| Homepage | `/` at `0a143c6820` | `/` at `c016453be7` |
| Guide article | `/how-to/book-doctor-appointment-nhs` at `1e021d8370^` | `/book-a-gp-appointment` at `c016453be7` |
| Help centre | `/faq` at `38facb0a65^` | `/help` at `c016453be7` |
| Care navigation | `/choose` onwards at `9a5d90ba1d^` | `/choose` onwards at `9732397e02` |
| GP search | `/gp/search` at `d304517e90` (30 January) | `/gp/search` at `9732397e02` |
| GP surgery page | `/gp/john-smith-medical-centre-loc_9a5qmmkpexdu` at `96766b8a9c^` | the same at `9732397e02` |
| Booking | Book appointment onwards at `9a5d90ba1d^` | Book appointment onwards at `9732397e02` |
| Clinician page | `/clinician/cli_9a5qmmqhn4r5` at `5a4e8c4cdf^` | the same at `9732397e02` |

```bash
pnpm capture
pnpm capture --page article --page help
```

This needs a sanny checkout (`SANNY_REPO`, default `~/Desktop/repos/sanny`), pnpm, and ffmpeg
with libx264 and libvpx-vp9. Each commit is exported with `git archive` into `CAPTURE_WORK_DIR`
(default `~/.cache/bookable-before-after`, not the OS temp folder, which macOS prunes), built,
and served: `0a143c6820` on 3061, `c016453be7` on 3062, `1e021d8370^` on 3063, `38facb0a65^` on
3064, `d304517e90` on 3065, `9732397e02` on 3066, `96766b8a9c^` on 3067, `5a4e8c4cdf^` on 3068 and
`9a5d90ba1d^` on 3069. A build that is missing files is rebuilt. The GP search, surgery, clinician
and journey captures use postcode IG1 2UT. Nothing is written to sanny.

API calls (and postcodes.io lookups) are answered from `capture/fixtures/api/<page>/`. A read with
no fixture is fetched from production once and saved there; writes are never sent. Each page's
`clock.json` holds the time its data was recorded, and the browser clock is frozen at it, so dates
such as "tomorrow" read the same on every recapture. `CAPTURE_OFFLINE=1 pnpm capture` fails on any
call without a fixture instead of fetching it. Only calls the browser makes are covered: pages that
fetch while the Next server renders them still call production for that part. Two of the January
GP search fixtures are edited by hand: the nationwide lists it loads before it knows the postcode
are emptied, and the `farsi` language its schema predates is removed.

The journeys are scripted in `capture/flows.ts` with a fictional patient, Alex Taylor (born
14 June 1990, 07700 900123, alex.taylor@example.com, code 123456). Every write they make (holding a
time, sending details, the code check, care navigation) is answered by a stub in that file, so
no booking or care navigation is ever created. Each step is a screenshot under a band that names the
page or step. `CAPTURE_FLOW_DEBUG=1` saves every step to `.capture/flow-debug/` and logs the
requests.

`--page` captures only those pages and leaves every other page's files and data as they were.
`--skip-loops` skips the homepage's video loops. `pnpm capture:clean` deletes the builds;
`pnpm capture:serve [--page …]` serves builds for inspection; `pnpm capture:compare [--page …]`
puts the live site next to the capture in `.capture/live-vs-capture-<page>.png`.

Every before page dates from before v2. The surgery and clinician before commits came after the v2
footer (`7721c5b954`), so the capture paints in the last NHS footer, shot from the homepage before
build; the journeys get the same footer wherever one shows. Those two pages also came after the v2
header (`9a5d90ba1d`), so everything above `<main>` is swapped for what the same route showed at
`9a5d90ba1d^`. The capture hides each page's sticky parts (the header, the breadcrumb bar, the
article's contents sidebar, the January search's filter bar and map) on purpose, because the page
draws them as live layers. Analytics requests are blocked during captures.

## Licensing

Frutiger is licensed to the NHS, so no Frutiger file is in this project; the specimen is a
rendered image. Hanken Grotesk is OFL and is bundled from `@fontsource/hanken-grotesk`. The screenshots show public
Bookable pages.
