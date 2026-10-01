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
              <span
                key={radius}
                className="size-3 border border-mint/70"
                style={{ borderRadius: radius }}
              />
            ))}
          </span>
        </span>
      }
    />
  );
}
