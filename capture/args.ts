import { isPageId, PAGE_IDS } from "../src/data/pages";
import type { PageId, Version } from "../src/data/types";

export type CaptureArgs = { pages: PageId[]; versions: Version[]; skipLoops: boolean };

const VERSIONS: readonly Version[] = ["before", "after"];

function isVersion(value: string): value is Version {
  return (VERSIONS as readonly string[]).includes(value);
}

export function parseCaptureArgs(argv: readonly string[]): CaptureArgs {
  const chosenPages = new Set<PageId>();
  const chosenVersions = new Set<Version>();
  let skipLoops = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const flagValue = (flag: string): string | undefined =>
      arg === flag ? argv[++index] : arg.slice(`${flag}=`.length);
    if (arg === "--skip-loops") {
      skipLoops = true;
    } else if (arg === "--page" || arg.startsWith("--page=")) {
      const value = flagValue("--page");
      if (value === undefined || !isPageId(value)) {
        throw new Error(`--page takes ${PAGE_IDS.join(", ")}, not ${value ?? "nothing"}`);
      }
      chosenPages.add(value);
    } else if (arg === "--version" || arg.startsWith("--version=")) {
      const value = flagValue("--version");
      if (value === undefined || !isVersion(value)) {
        throw new Error(`--version takes ${VERSIONS.join(", ")}, not ${value ?? "nothing"}`);
      }
      chosenVersions.add(value);
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return {
    pages: PAGE_IDS.filter((page) => chosenPages.size === 0 || chosenPages.has(page)),
    versions: VERSIONS.filter(
      (version) => chosenVersions.size === 0 || chosenVersions.has(version),
    ),
    skipLoops,
  };
}
