import type { PinnedLayer } from "../data/types";

export function pinnedStateIndex(layer: PinnedLayer, scroll: number): number {
  let index = 0;
  for (const [candidate, state] of layer.states.entries()) {
    if (scroll >= state.from) index = candidate;
  }
  return index;
}

export function pinnedTop(layer: PinnedLayer, scroll: number): number {
  const { height } = layer.states[pinnedStateIndex(layer, scroll)];
  return Math.max(layer.y, Math.min(scroll + layer.stickTop, layer.releaseAt - height));
}
