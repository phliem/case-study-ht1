import { isPageId, PAGE_IDS } from "../src/data/pages";
import type { PageId } from "../src/data/types";

export type CaptureArgs = { pages: PageId[]; skipLoops: boolean };

export function parseCaptureArgs(argv: readonly string[]): CaptureArgs {
  const chosen = new Set<PageId>();
  let skipLoops = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--skip-loops") {
      skipLoops = true;
    } else if (arg === "--page" || arg.startsWith("--page=")) {
      const value: string | undefined =
        arg === "--page" ? argv[++index] : arg.slice("--page=".length);
      if (value === undefined || !isPageId(value)) {
        throw new Error(`--page takes ${PAGE_IDS.join(", ")}, not ${value ?? "nothing"}`);
      }
      chosen.add(value);
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return { pages: PAGE_IDS.filter((page) => chosen.size === 0 || chosen.has(page)), skipLoops };
}
