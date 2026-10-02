import { expect, test } from "@playwright/test";
import { captureOf } from "./captureData";
import { scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");

test("the v2 header lies clear over the hero and turns solid once the page moves", async ({
  page,
}) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  const solid = page.getByTestId("pinned-header-1");
  await expect(solid).toHaveCSS("opacity", "0");
  await scrollAfterTo(page, 120);
  await expect(solid).toHaveCSS("opacity", "1");
  await scrollAfterTo(page, 0);
  await expect(solid).toHaveCSS("opacity", "0");
});

test("plays the captured loops on the after page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(AFTER.loops.length);
  await stageRegion(page).scrollIntoViewIfNeeded();
  await expect
    .poll(
      () =>
        page
          .getByTestId("live-loop")
          .first()
          .evaluate((video: HTMLVideoElement) => !video.paused && video.readyState >= 2),
      { timeout: 10_000 },
    )
    .toBe(true);
});

test("failed loop videos leave the stills showing", async ({ page }) => {
  await page.route(/\.(mp4|webm)$/, (route) => route.abort());
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  const opacities = await page
    .getByTestId("live-loop")
    .evaluateAll((videos) => videos.map((video) => getComputedStyle(video).opacity));
  expect(opacities).toEqual(AFTER.loops.map(() => "0"));
  await expect(page.getByTestId("after-scroller").locator("img").first()).toBeVisible();
});

test("@review the solid header", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await scrollAfterTo(page, 400);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/03b-header-solid.png" });
});
