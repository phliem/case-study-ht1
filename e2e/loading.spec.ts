import { expect, test } from "@playwright/test";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

test("the lower comparisons load nothing until the visitor nears them", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(requested.filter((url) => /\/captures\/(article|help)\//.test(url))).toEqual([]);
  await openStage(page, "article");
  await expect.poll(() => requested.some((url) => url.includes("/captures/article/"))).toBe(true);
});

test("a keyboard visitor tabbing into a comparison reaches its divider", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page, "article").getByRole("button", { name: "Title", exact: true }).focus();
  const slider = dividerSlider(page, "article");
  await expect(slider).toHaveCount(1);
  for (let presses = 0; presses < 8; presses++) {
    if (await slider.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(slider).toBeFocused();
});
