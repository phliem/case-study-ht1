import { assetUrl } from "../data/captures";
import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type TypefaceDemoProps = { state: Version; specimen: string };

export function TypefaceDemo({ state, specimen }: TypefaceDemoProps) {
  return (
    <Crossfade
      state={state}
      before={
        <img
          src={assetUrl(specimen)}
          alt=""
          loading="lazy"
          className="max-h-28 w-auto max-w-[88%]"
        />
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
