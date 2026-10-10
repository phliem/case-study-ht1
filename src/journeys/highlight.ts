import { edgeKey, type FlowEdge, type Journey } from "./flow";

export type Highlight = {
  screens: ReadonlySet<string>;
  edges: ReadonlySet<string>;
  active: string;
};

export function routeTo(edges: readonly FlowEdge[], id: string): Highlight {
  const screens = new Set<string>();
  const keys = new Set<string>();
  const walk = (target: string) => {
    if (screens.has(target)) return;
    screens.add(target);
    for (const edge of edges) {
      if (edge.to !== target) continue;
      keys.add(edgeKey(edge.from, edge.to));
      walk(edge.from);
    }
  };
  walk(id);
  return { screens, edges: keys, active: id };
}

export function journeySoFar(journey: Journey, step: number): Highlight {
  const path = journey.path.slice(0, step + 1);
  return {
    screens: new Set(path),
    edges: new Set(path.slice(1).map((id, index) => edgeKey(path[index], id))),
    active: path[path.length - 1],
  };
}
