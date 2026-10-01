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
          {(state) => (
            <HeadlineDemo state={state} before={before.headline} after={after.headline} />
          )}
        </TokenCard>
        <TokenCard
          title="Corners"
          beforeValue={`Card ${before.card.borderRadius}, search ${before.search.borderRadius}`}
          afterValue={`Card ${after.card.borderRadius}, search ${after.search.borderRadius}`}
        >
          {(state) => (
            <CornersDemo state={state} before={before} after={after} scale={radiusScale} />
          )}
        </TokenCard>
        <TokenCard
          title="Elevation"
          beforeValue={shadowSummary(before.search.boxShadow)}
          afterValue={shadowSummary(after.search.boxShadow)}
        >
          {(state) => (
            <ElevationDemo
              state={state}
              before={before.search.boxShadow}
              after={after.search.boxShadow}
            />
          )}
        </TokenCard>
        <TokenCard
          title="Hero ground"
          beforeValue={groundSummary(before.heroGround)}
          afterValue={groundSummary(after.heroGround)}
        >
          {(state) => (
            <HeroGroundDemo state={state} before={before.heroGround} after={after.heroGround} />
          )}
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
