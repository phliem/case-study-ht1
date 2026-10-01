import type { Version } from "../data/types";
import { Crossfade } from "./Crossfade";

type ElevationDemoProps = { state: Version; before: string; after: string };

function card(shadow: string) {
  return <span className="h-14 w-44 rounded-2xl bg-white" style={{ boxShadow: shadow }} />;
}

export function ElevationDemo({ state, before, after }: ElevationDemoProps) {
  return (
    <span className="grid size-full place-items-center bg-[#eef2f4]">
      <Crossfade state={state} before={card(before)} after={card(after)} />
    </span>
  );
}
