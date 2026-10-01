import { expect, test } from "@playwright/test";
import { captureOf, scrollToMiddleOf, spanOf } from "./captureData";
import { beforeAnchor, scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("after", "desktop");
const BEFORE = captureOf("before", "desktop");

test("the divider follows the arrow keys and a drag", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByRole("slider", { name: "Divider between before and after" });
  await expect(slider).toHaveValue("50");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("55");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(slider).toHaveValue("35");

  const viewport = page.getByTestId("stage-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const frame = await viewport.boundingBox();
  const handle = await page.getByTestId("divider-handle").boundingBox();
  if (!frame || !handle) throw new Error("The stage has not laid out");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue("25");
});

test("scrolling the after page carries the before page to the same section", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  const how = spanOf(BEFORE, "how");
  await expect.poll(() => beforeAnchor(page, BEFORE)).toBeGreaterThanOrEqual(how.start);
  expect(await beforeAnchor(page, BEFORE)).toBeLessThan(how.end);
});

test("resizing the window keeps the frame on the same section", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.waitForTimeout(400);
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens on the mobile captures without scrolling sideways", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
      "src",
      /captures\/after\/mobile\//,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("@review the stage", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/02-stage.png" });
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/03-stage-how.png" });
});

test("@review a phone visitor", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/07-phone-top.png" });
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".capture/review/07-phone-stage.png" });
  await page.close();
});

test.describe("before the animation code has loaded", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/motionFeatures-.*\.js$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
  });

  test("a scroll still carries the before page along", async ({ page }) => {
    await page.goto("/");
    await scrollAfterTo(page, scrollToMiddleOf(AFTER, "how"));
    const how = spanOf(BEFORE, "how");
    await expect
      .poll(() => beforeAnchor(page, BEFORE), { timeout: 1500 })
      .toBeGreaterThanOrEqual(how.start);
  });

  test("the arrow keys still move the divider", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("slider", { name: "Divider between before and after" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => page.getByTestId("divider-handle").evaluate((element) => element.style.left), {
        timeout: 1500,
      })
      .toBe("55%");
  });
});
