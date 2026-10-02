import type { PinnedLayer } from "../src/data/types";

export type PinnedBox = {
  x: number;
  y: number;
  width: number;
  stickTop: number;
  releaseAt: number;
  zIndex: number;
};

export function shotScroll(
  box: PinnedBox,
  froms: readonly number[],
  index: number,
  maxScroll: number,
): number {
  const until = (froms[index + 1] ?? maxScroll + 1) - 1;
  const stuck = Math.ceil(box.y - box.stickTop);
  return Math.min(Math.max(froms[index], stuck), until, maxScroll);
}

export function checkScrolls(layer: PinnedLayer, maxScroll: number): number[] {
  const height = layer.states[0].height;
  const sticksAt = Math.max(0, layer.y - layer.stickTop);
  const releasesAt = layer.releaseAt - height - layer.stickTop;
  const probes = [
    0,
    sticksAt - 1,
    sticksAt + 40,
    (sticksAt + releasesAt) / 2,
    releasesAt + 40,
    maxScroll,
  ];
  const onPage = probes.map((value) => Math.round(Math.min(Math.max(value, 0), maxScroll)));
  return [...new Set(onPage)].sort((a, b) => a - b);
}
