import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BrowserContext, Request } from "@playwright/test";
import type { PageId } from "../src/data/types";
import { ROOT } from "./paths";

export const API_ORIGIN = "https://api.ht1.uk";
const POSTCODES_ORIGIN = "https://api.postcodes.io";

export type ApiFixture = {
  method: string;
  url: string;
  requestBody: string | null;
  status: number;
  contentType: string | null;
  body: { json: unknown } | { base64: string };
};

type ClockFile = { recordedAt: string };

const missing: string[] = [];

export function takeMissingFixtures(): string[] {
  return missing.splice(0);
}

export function fixtureDir(page: PageId): string {
  return join(ROOT, "capture/fixtures/api", page);
}

export function isRead(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

// A write is named without its body, which carries a fresh session id on every page load.
export function fixtureName(method: string, url: string): string {
  const hash = createHash("sha256").update(`${method} ${url}`).digest("hex").slice(0, 16);
  const path = new URL(url).pathname.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-");
  return `${method.toLowerCase()}-${path}-${hash}.json`;
}

export function fixtureBody(contentType: string | null, bytes: Buffer): ApiFixture["body"] {
  if (contentType?.includes("json")) {
    try {
      return { json: JSON.parse(bytes.toString("utf8")) };
    } catch {
      return { base64: bytes.toString("base64") };
    }
  }
  return { base64: bytes.toString("base64") };
}

export function fixtureBytes(body: ApiFixture["body"]): Buffer {
  return "json" in body
    ? Buffer.from(JSON.stringify(body.json))
    : Buffer.from(body.base64, "base64");
}

// Every capture of a page sees the clock its API data was recorded at, so dates the page words
// relative to today ("tomorrow", "Thursday 8 October") read the same on every recapture.
export function recordedAt(page: PageId): Date {
  const file = join(fixtureDir(page), "clock.json");
  if (existsSync(file)) {
    return new Date((JSON.parse(readFileSync(file, "utf8")) as ClockFile).recordedAt);
  }
  const now = new Date();
  mkdirSync(fixtureDir(page), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ recordedAt: now.toISOString() }, null, 2)}\n`);
  return now;
}

// API calls (and postcodes.io lookups) are answered from capture/fixtures/api. A read with no fixture yet is fetched once
// from production and saved, so later captures never reach the API. Writes are never sent: each
// needs a fixture written by hand. The production API only allows CORS from bookable.health, so
// every answer carries headers that let a local build read it.
export function corsHeaders(request: Request): Record<string, string> {
  return {
    "access-control-allow-origin": request.headers().origin ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": request.headers()["access-control-request-headers"] ?? "*",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
}

export async function serveApiFromFixtures(context: BrowserContext, page: PageId): Promise<void> {
  const origins = new RegExp(`^(${API_ORIGIN}|${POSTCODES_ORIGIN})/`);
  await context.route(origins, async (route) => {
    const request = route.request();
    const cors = corsHeaders(request);
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    const requestBody = request.postData();
    const file = join(fixtureDir(page), fixtureName(request.method(), request.url()));
    if (!existsSync(file)) {
      if (process.env.CAPTURE_OFFLINE === "1" || !isRead(request.method())) {
        missing.push(`${request.method()} ${request.url()} -> ${file}`);
        await route.abort();
        return;
      }
      const response = await route.fetch();
      const contentType = response.headers()["content-type"] ?? null;
      const fixture: ApiFixture = {
        method: request.method(),
        url: request.url(),
        requestBody,
        status: response.status(),
        contentType,
        body: fixtureBody(contentType, await response.body()),
      };
      mkdirSync(fixtureDir(page), { recursive: true });
      writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`);
      console.log(`Recorded ${fixture.method} ${fixture.url}`);
    }
    const fixture = JSON.parse(readFileSync(file, "utf8")) as ApiFixture;
    await route.fulfill({
      status: fixture.status,
      headers: {
        ...cors,
        ...(fixture.contentType ? { "content-type": fixture.contentType } : {}),
      },
      body: fixtureBytes(fixture.body),
    });
  });
}
