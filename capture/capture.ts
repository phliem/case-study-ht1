import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import type { CapturesFile, Device, MeasuredTokens, Version } from "../src/data/types";
import { parseCaptureArgs } from "./args";
import { BUILDS, type BuildName, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { extractObjectLiteral, paletteGroups } from "./literal";
import { type HomeExtras, mergeCaptures } from "./merge";
import { anchorList, buildsFor, HOME_TOKEN_SELECTORS, PAGE_SOURCES } from "./pages";
import { DATA_FILE } from "./paths";
import { DEVICE_PROFILES } from "./profiles";
import { type CaptureResult, capturePage } from "./shoot";

const VERSIONS: readonly Version[] = ["before", "after"];
const DEVICES: readonly Device[] = ["desktop", "mobile"];

function servedFor(served: ReadonlyMap<BuildName, ServedBuild>, name: BuildName): ServedBuild {
  const build = served.get(name);
  if (!build) throw new Error(`The ${name} build is not being served`);
  return build;
}

function sourceIn(build: ServedBuild, path: string): string {
  return readFileSync(join(build.dir, path), "utf8");
}

function radiusScale(source: string): string[] {
  const radii = extractObjectLiteral(source, "UI_RADII");
  if (typeof radii !== "object" || radii === null) throw new Error("UI_RADII is not an object");
  return Object.values(radii).map(String);
}

function homeTokens(results: readonly CaptureResult[], version: Version): MeasuredTokens {
  const tokens = results.find(
    ({ capture }) =>
      capture.page === "home" && capture.version === version && capture.device === "desktop",
  )?.tokens;
  if (!tokens) throw new Error(`The homepage ${version} desktop capture measured no tokens`);
  return tokens;
}

function homeExtras(
  results: readonly CaptureResult[],
  served: ReadonlyMap<BuildName, ServedBuild>,
): HomeExtras {
  const before = servedFor(served, "home-before");
  const after = servedFor(served, "after");
  return {
    tokens: { before: homeTokens(results, "before"), after: homeTokens(results, "after") },
    palettes: {
      before: paletteGroups(
        extractObjectLiteral(
          sourceIn(before, "packages/bookable/tailwind.config.ts"),
          "NHS_COLORS",
        ),
      ),
      after: paletteGroups(
        extractObjectLiteral(
          sourceIn(after, "packages/bookable/app/_ui/tokens.colors.ts"),
          "UI_COLORS",
        ),
      ),
    },
    radiusScale: radiusScale(sourceIn(after, "packages/bookable/app/_ui/tokens.ts")),
    specimens: { frutiger: "captures/specimen-frutiger.png" },
  };
}

async function main() {
  const { pages, skipLoops } = parseCaptureArgs(process.argv.slice(2));
  const served = new Map<BuildName, ServedBuild>();
  try {
    for (const name of buildsFor(pages)) {
      served.set(name, await serveBuild(prepareBuild(BUILDS[name])));
    }
    const browser = await chromium.launch();
    const results: CaptureResult[] = [];
    try {
      for (const page of pages) {
        for (const version of VERSIONS) {
          const side = PAGE_SOURCES[page][version];
          const build = servedFor(served, side.build);
          for (const device of DEVICES) {
            console.log(`Capturing the ${page} ${version} page on ${device}`);
            results.push(
              await capturePage(browser, {
                page,
                version,
                commit: build.fullCommit,
                url: `${build.url}${side.path}`,
                profile: DEVICE_PROFILES[device],
                anchors: anchorList(page, version),
                tokens: page === "home" ? HOME_TOKEN_SELECTORS[version] : null,
                withLoops: page === "home" && version === "after" && !skipLoops,
                withSpecimen: page === "home" && version === "before" && device === "desktop",
              }),
            );
          }
        }
      }
    } finally {
      await browser.close();
    }
    const existing = existsSync(DATA_FILE)
      ? (JSON.parse(readFileSync(DATA_FILE, "utf8")) as CapturesFile)
      : null;
    const file = mergeCaptures(
      existing,
      results.map(({ capture }) => capture),
      pages.includes("home") ? homeExtras(results, served) : null,
    );
    writeFileSync(DATA_FILE, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${DATA_FILE}`);
  } finally {
    await Promise.all([...served.values()].map((build) => build.stop()));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
