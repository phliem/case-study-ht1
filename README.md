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
