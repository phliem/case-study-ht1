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
