import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type HeroGroundDemoProps = { state: Version; before: string; after: string };

function panel(ground: string) {
  return <span className="block size-full" style={{ background: ground }} />;
}

export function HeroGroundDemo({ state, before, after }: HeroGroundDemoProps) {
  return (
    <span className="block size-full">
      <Crossfade state={state} before={panel(before)} after={panel(after)} />
    </span>
  );
}
