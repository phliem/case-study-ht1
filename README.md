# Bookable redesign

An interactive, animated before and after of Bookable (bookable.health): the site at the end of
January 2026, on the NHS design system, next to the site on 9 October 2026, on its own (v2). It
covers the homepage, a guide article, the help centre, care navigation, the GP search, a GP surgery
page, booking and a clinician page. Drag a divider, scroll
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

The captures in `public/captures/` and `src/data/captures.json` come from two commits of the sanny
repo: develop at the end of January (`d304517e90`, 30 January 2026) on the left and develop on
9 October 2026 (`d82562aaf8`) on the right. Clinician pages did not exist in January, so that
comparison's left side is the page as it first shipped (`0a3ca099df`, the build fix for
`b81a98fae9`, 4 September 2026).

| Page | January | October |
|---|---|---|
| Homepage | `/` | `/` |
| Guide article | `/how-to/book-doctor-appointment-nhs` | `/articles/book-a-gp-appointment` |
| Help centre | `/faq` | `/help` |
| Care navigation | homepage search onwards | `/choose` onwards |
| GP search | `/gp/search` | `/gp/search` |
| GP surgery page | `/gp/john-smith-medical-centre-loc_9a5qmmkpexdu` | the same |
| Booking | Book on the surgery page onwards | Book appointment onwards |
| Clinician page | `/clinician/cli_9a5qmmqhn4r5` (September) | the same |

```bash
pnpm capture
pnpm capture --page article --page help
```

This needs a sanny checkout (`SANNY_REPO`, default `~/Desktop/repos/sanny`), pnpm, and ffmpeg
with libx264 and libvpx-vp9. Each commit is exported with `git archive` into `CAPTURE_WORK_DIR`
(default `~/.cache/bookable-before-after`, not the OS temp folder, which macOS prunes), built,
and served: January on 3065, October on 3066 and the first clinician page on 3068. A build that is
missing files is rebuilt. The search, surgery, clinician and journey captures use postcode
IG1 2UT. Nothing is written to sanny.

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
no booking or care navigation is ever created. January's postcode box suggests places through
Google Places, which the build has no key for, so its one suggestion is stubbed too. Each step is a
screenshot under a band that names the page or step. `CAPTURE_FLOW_DEBUG=1` saves every step to
`.capture/flow-debug/` and logs the requests. Today's booking window can stay on "Finding your NHS
record" after the code in a scripted run, so the capture then opens the booking's status page
itself, which is where the patient lands.

`--page` captures only those pages and leaves every other page's files and data as they were.
`--version after` re-shoots only the October sides and keeps the January ones, homepage tokens
included, as they were (`--version before` does the reverse).
`--skip-loops` skips the homepage's video loops. `pnpm capture:clean` deletes the builds;
`pnpm capture:serve [--page …]` serves builds for inspection; `pnpm capture:compare [--page …]`
puts the live site next to the capture in `.capture/live-vs-capture-<page>.png`.

The capture hides each page's sticky parts (the header, the breadcrumb bar, the article's contents
sidebar, the January search's filter bar and map) on purpose, because the page draws them as live
layers, and the booking bars that dock to the window on surgery and clinician pages. The journeys
keep those bars, because they hold the step's button. Analytics requests are blocked during
captures.

## Licensing

Frutiger is licensed to the NHS, so no Frutiger file is in this project; the specimen is a
rendered image. Hanken Grotesk is OFL and is bundled from `@fontsource/hanken-grotesk`. The screenshots show public
Bookable pages.
