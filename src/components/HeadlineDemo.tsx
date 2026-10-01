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
