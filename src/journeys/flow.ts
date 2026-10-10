export type FlowScreen = {
  id: string;
  column: number;
  title: string;
  description: string;
  branch?: boolean;
  end?: boolean;
  screenshot?: string;
};

export type FlowEdge = { from: string; to: string; label: string };

export type Journey = { id: string; label: string; path: readonly string[] };

export type Flow = {
  screens: readonly FlowScreen[];
  edges: readonly FlowEdge[];
  journeys: readonly Journey[];
};

export function screenOf(flow: Flow, id: string): FlowScreen {
  const screen = flow.screens.find((candidate) => candidate.id === id);
  if (!screen) throw new Error(`The flow has no screen "${id}"`);
  return screen;
}

export function edgeKey(from: string, to: string): string {
  return `${from}-${to}`;
}
