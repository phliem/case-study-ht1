import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import type { CapturesFile, Device, MeasuredTokens, Version } from "../src/data/types";
import { BUILDS, prepareBuild, type ServedBuild, serveBuild } from "./builds";
import { extractObjectLiteral, paletteGroups } from "./literal";
import { DATA_FILE } from "./paths";
import { DEVICE_PROFILES } from "./profiles";
import { type CaptureResult, capturePage } from "./shoot";

const DEVICES: readonly Device[] = ["desktop", "mobile"];
const skipLoops = process.argv.includes("--skip-loops");

function servedFor(served: readonly ServedBuild[], version: Version): ServedBuild {
  const build = served.find((entry) => entry.version === version);
  if (!build) throw new Error(`The ${version} build is not being served`);
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

async function main() {
  const served: ServedBuild[] = [];
  try {
    for (const build of BUILDS.map(prepareBuild)) served.push(await serveBuild(build));
    const before = servedFor(served, "before");
    const after = servedFor(served, "after");
    const browser = await chromium.launch();
    const results: CaptureResult[] = [];
    try {
      for (const build of [before, after]) {
        for (const device of DEVICES) {
          console.log(`Capturing ${build.version} on ${device}`);
          results.push(
            await capturePage(browser, {
              page: "home",
              version: build.version,
              commit: build.fullCommit,
              url: build.url,
              profile: DEVICE_PROFILES[device],
              withLoops: build.version === "after" && !skipLoops,
              withSpecimen: build.version === "before" && device === "desktop",
            }),
          );
        }
      }
    } finally {
      await browser.close();
    }
    const tokensOf = (version: Version): MeasuredTokens => {
      const found = results.find(
        ({ capture }) => capture.version === version && capture.device === "desktop",
      );
      if (!found) throw new Error(`There is no ${version} desktop capture to take tokens from`);
      return found.tokens;
    };
    const file: CapturesFile = {
      captures: results.map(({ capture }) => capture),
      tokens: { before: tokensOf("before"), after: tokensOf("after") },
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
    writeFileSync(DATA_FILE, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${DATA_FILE}`);
  } finally {
    await Promise.all(served.map((build) => build.stop()));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
