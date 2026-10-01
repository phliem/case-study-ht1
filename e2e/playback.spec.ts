import { expect, test } from "@playwright/test";
import { stageRegion } from "./stageHelpers";

const SLIDER = { name: "Divider between before and after" };

test("Play runs the tour on its own", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  const slider = page.getByRole("slider", SLIDER);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("any input during Play stops it", async ({ page }) => {
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(600);
  const viewport = await page.getByTestId("stage-viewport").boundingBox();
  if (!viewport) throw new Error("The stage has not laid out");
  await page.mouse.move(viewport.x + viewport.width * 0.7, viewport.y + viewport.height * 0.5);
  await page.mouse.wheel(0, 120);
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  const slider = page.getByRole("slider", SLIDER);
  const held = await slider.inputValue();
  await page.waitForTimeout(500);
  await expect(slider).toHaveValue(held);
});

test("recording mode hides the controls and plays on its own", async ({ page }) => {
  await page.goto("/?record=16x9");
  await expect(page.getByRole("button", { name: /^(Play|Stop)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  const slider = page.getByRole("slider", SLIDER);
  const first = await slider.inputValue();
  await expect.poll(() => slider.inputValue(), { timeout: 3000 }).not.toBe(first);
});

test("with reduced motion the loops stay off and Play cuts instead of sweeping", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("live-loop")).toHaveCount(0);
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("slider", SLIDER)).toHaveValue("0", { timeout: 400 });
});

test("@review the recording frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9");
  await page.waitForTimeout(4500);
  await page.screenshot({ path: ".capture/review/08-record-16x9.png" });
});
