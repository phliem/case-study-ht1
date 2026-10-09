import { type Browser, chromium } from "@playwright/test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { settleInPage } from "./inPage";

const PIXEL = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';

describe("settleInPage", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("waits for shown images but not for lazy ones the page never shows", async () => {
    const page = await browser.newPage();
    const requested: string[] = [];
    await page.route("https://capture.test/**", async (route) => {
      requested.push(new URL(route.request().url()).pathname);
      await route.fulfill({ contentType: "image/svg+xml", body: PIXEL });
    });
    await page.setContent(
      '<img src="https://capture.test/shown.svg"><details><summary>See more</summary><img loading="lazy" src="https://capture.test/folded.svg"></details>',
    );
    await page.evaluate("globalThis.__name = (target) => target");

    await page.evaluate(settleInPage);

    expect(requested).toEqual(["/shown.svg"]);
    expect(
      await page
        .locator("img")
        .first()
        .evaluate((image: HTMLImageElement) => image.complete),
    ).toBe(true);
  }, 10_000);
});
