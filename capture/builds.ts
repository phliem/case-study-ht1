import { type ChildProcess, execFileSync, execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Version } from "../src/data/types";
import { WORK_DIR } from "./paths";

export type BuildSpec = { version: Version; commit: string; port: number };
export type PreparedBuild = BuildSpec & { dir: string; fullCommit: string };
export type ServedBuild = PreparedBuild & { url: string; stop: () => Promise<void> };

export const BUILDS: readonly BuildSpec[] = [
  { version: "before", commit: "0a143c6820", port: 3061 },
  { version: "after", commit: "c016453be7", port: 3062 },
];

export const SANNY_REPO = process.env.SANNY_REPO ?? join(homedir(), "Desktop/repos/sanny");

const PRODUCTION_API = "https://api.ht1.uk/v2";
const WEGLOT_KEY = "NEXT_PUBLIC_WEGLOT_API_KEY_BOOKABLE";

function run(command: string, args: readonly string[], cwd: string) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" },
  });
}

function weglotLine(): string | null {
  const envFile = join(SANNY_REPO, "packages/bookable/.env.local");
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, "utf8")
    .split("\n")
    .find((entry) => entry.startsWith(`${WEGLOT_KEY}=`));
  return line ?? null;
}

export function prepareBuild(spec: BuildSpec): PreparedBuild {
  const fullCommit = execFileSync(
    "git",
    ["-C", SANNY_REPO, "rev-parse", `${spec.commit}^{commit}`],
    {
      encoding: "utf8",
    },
  ).trim();
  const dir = join(WORK_DIR, spec.version);
  const marker = join(dir, ".capture-commit");
  const built = existsSync(join(dir, "packages/bookable/.next/BUILD_ID"));
  if (built && existsSync(marker) && readFileSync(marker, "utf8").trim() === fullCommit) {
    console.log(`Reusing the ${spec.version} build at ${dir}`);
    return { ...spec, dir, fullCommit };
  }

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execSync(
    `git -C ${JSON.stringify(SANNY_REPO)} archive ${fullCommit} | tar -x -C ${JSON.stringify(dir)}`,
    {
      stdio: "inherit",
    },
  );
  run("pnpm", ["install", "--frozen-lockfile", "--filter", "bookable..."], dir);
  run("pnpm", ["--filter", "bookable^...", "run", "build"], dir);
  const env = [`NEXT_PUBLIC_WEBAPI_BASE_URL=${PRODUCTION_API}`, weglotLine()].filter(
    (line): line is string => line !== null,
  );
  writeFileSync(join(dir, "packages/bookable/.env.local"), `${env.join("\n")}\n`);
  run("pnpm", ["--filter", "bookable", "run", "build"], dir);
  writeFileSync(marker, `${fullCommit}\n`);
  return { ...spec, dir, fullCommit };
}

async function answers(url: string): Promise<boolean> {
  return fetch(url).then(
    (response) => response.ok,
    () => false,
  );
}

async function waitForHttp(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await answers(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${url} did not answer within ${timeoutMs / 1000}s`);
}

function stopProcess(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.pid === undefined) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    process.kill(-child.pid, "SIGTERM");
  });
}

export async function serveBuild(build: PreparedBuild): Promise<ServedBuild> {
  const url = `http://localhost:${build.port}`;
  if (await answers(url)) {
    throw new Error(`Something already answers on ${url}; stop it before capturing`);
  }
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(build.port)], {
    cwd: join(build.dir, "packages/bookable"),
    stdio: ["ignore", "inherit", "inherit"],
    detached: true,
  });
  try {
    await waitForHttp(url, 90_000);
  } catch (error) {
    await stopProcess(child);
    throw error;
  }
  return { ...build, url, stop: () => stopProcess(child) };
}
