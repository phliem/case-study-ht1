import { expect, test } from "@playwright/test";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

test("Play runs the tour on its own", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  const slider = dividerSlider(page);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("any input during Play stops it", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(600);
  const viewport = await stage.getByTestId("stage-viewport").boundingBox();
  if (!viewport) throw new Error("The stage has not laid out");
  await page.mouse.move(viewport.x + viewport.width * 0.7, viewport.y + viewport.height * 0.5);
  await page.mouse.wheel(0, 120);
  await expect(stage.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  const slider = dividerSlider(page);
  const held = await slider.inputValue();
  await page.waitForTimeout(500);
  await expect(slider).toHaveValue(held);
});

test("Play on the help centre tours the help centre", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page, "help");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage).toHaveAttribute("data-group", "questions", { timeout: 5000 });
});

test("recording mode hides the controls and plays on its own", async ({ page }) => {
  await page.goto("/?record=16x9");
  await expect(page.getByRole("button", { name: /^(Play|Stop)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(stageRegion(page)).toBeVisible();
  const slider = dividerSlider(page);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("recording mode shows the page it is asked for", async ({ page }) => {
  await page.goto("/?record=16x9&page=help");
  await expect(stageRegion(page, "help")).toBeVisible();
  await expect(stageRegion(page, "home")).toHaveCount(0);
  const slider = dividerSlider(page, "help");
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("recording mode falls back to the homepage for a page it does not know", async ({ page }) => {
  await page.goto("/?record=16x9&page=nope");
  await expect(stageRegion(page, "home")).toBeVisible();
});

test("with reduced motion the loops stay off and Play cuts instead of sweeping", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(0);
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(dividerSlider(page)).toHaveValue("0", { timeout: 400 });
});

test("@review the recording frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: ".capture/review/08-record-16x9.png" });
});
