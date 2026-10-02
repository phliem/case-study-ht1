import type { PageId } from "./types";

export type ViewId = "main" | "a-year-on";

export const VIEWS = {
  main: ["home", "article", "help"],
  "a-year-on": ["home-2025"],
} as const satisfies Record<ViewId, readonly PageId[]>;

export const VIEW_IDS: readonly ViewId[] = ["main", "a-year-on"];

export function isViewId(value: string | null): value is ViewId {
  return VIEW_IDS.some((id) => id === value);
}

export function viewHref(base: string, view: ViewId): string {
  return view === "main" ? base : `${base}?view=${view}`;
}
