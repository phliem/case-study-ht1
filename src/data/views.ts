import type { PageId } from "./types";

export type ViewId = "main" | "a-year-on";

export const VIEWS = {
  main: ["home", "article", "help"],
  "a-year-on": ["home-2025"],
} as const satisfies Record<ViewId, readonly PageId[]>;
