import { expect, test } from "@playwright/test";
import { pinnedStateIndex, pinnedTop } from "../src/lib/pinned";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { afterScroll, openStage, pinnedOffset, scrollAfterTo } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");
const ARTICLE = captureOf("article", "after", "desktop");

function articleLayer(id: string) {
  const layer = ARTICLE.pinned.find((entry) => entry.id === id);
  if (!layer) throw new Error(`The article capture has no ${id} layer`);
  return layer;
}

test("the v2 header lies clear over the hero and turns solid once the page moves", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page);
  const solid = stage.getByTestId("pinned-header-1");
  await expect(solid).toHaveCSS("opacity", "0");
  await scrollAfterTo(page, 120);
  await expect(solid).toHaveCSS("opacity", "1");
  await scrollAfterTo(page, 0);
  await expect(solid).toHaveCSS("opacity", "0");
});

test("plays the captured loops on the after page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(AFTER.loops.length);
  await openStage(page);
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
  const stage = await openStage(page);
  await page.waitForTimeout(4000);
  const opacities = await page
    .getByTestId("live-loop")
    .evaluateAll((videos) => videos.map((video) => getComputedStyle(video).opacity));
  expect(opacities).toEqual(AFTER.loops.map(() => "0"));
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toBeVisible();
});

test("mid-guide the article's breadcrumb bar sits under its header and the sidebar marks the section", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await scrollAfterTo(page, scrollToMiddleOf(ARTICLE, "guide"), "article");
  const scroll = await afterScroll(page, "article");
  const breadcrumbs = articleLayer("breadcrumbs");
  expect(pinnedTop(breadcrumbs, scroll) - scroll).toBeCloseTo(breadcrumbs.stickTop, 1);
  for (const layer of ARTICLE.pinned) {
    await expect
      .poll(() => pinnedOffset(page, layer.id, "article"))
      .toBeCloseTo(pinnedTop(layer, scroll) - scroll, 0);
    await expect(stage.getByTestId(`pinned-${layer.id}`).first()).toHaveAttribute(
      "data-state",
      String(pinnedStateIndex(layer, scroll)),
    );
  }
});

test("the article's sidebar lets go once the article ends", async ({ page }) => {
  await page.goto("/");
  await openStage(page, "article");
  const contents = articleLayer("contents");
  expect(contents.states.length).toBeGreaterThan(1);
  await scrollAfterTo(page, scrollToMiddleOf(ARTICLE, "footer"), "article");
  const scroll = await afterScroll(page, "article");
  expect(pinnedTop(contents, scroll)).toBeLessThan(scroll + contents.stickTop);
  await expect
    .poll(() => pinnedOffset(page, "contents", "article"))
    .toBeCloseTo(pinnedTop(contents, scroll) - scroll, 0);
});

test("@review the solid header", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await openStage(page);
  await scrollAfterTo(page, 400);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/03b-header-solid.png" });
});
