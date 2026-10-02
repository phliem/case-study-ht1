import { expect, test } from "@playwright/test";
import { PAGES } from "../src/data/pages";
import type { PageId, SectionId } from "../src/data/types";
import { VIEWS } from "../src/data/views";
import { captureOf, scrollForAnchor, scrollToMiddleOf, spanOf } from "./captureData";
import { beforeAnchor, dividerSlider, openStage, scrollAfterTo, stageRegion } from "./stageHelpers";

const MIDDLE: Record<PageId, SectionId> = {
  home: "how",
  article: "guide",
  help: "questions",
  "home-2025": "proof-how",
};

for (const id of VIEWS.main) {
  const after = captureOf(id, "after", "desktop");
  const before = captureOf(id, "before", "desktop");
  const middle = MIDDLE[id];

  test.describe(PAGES[id].name, () => {
    test("the divider follows the arrow keys and a drag", async ({ page }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      const slider = dividerSlider(page, id);
      await expect(slider).toHaveValue("50");
      await slider.focus();
      await page.keyboard.press("ArrowRight");
      await expect(slider).toHaveValue("55");
      await page.keyboard.press("Shift+ArrowLeft");
      await expect(slider).toHaveValue("35");

      const viewport = stage.getByTestId("stage-viewport");
      await viewport.scrollIntoViewIfNeeded();
      const frame = await viewport.boundingBox();
      const handle = await stage.getByTestId("divider-handle").boundingBox();
      if (!frame || !handle) throw new Error("The stage has not laid out");
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect(slider).toHaveValue("25");
    });

    test("scrolling the after page carries the before page to the same section", async ({
      page,
    }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, middle), id);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
      const span = spanOf(before, middle);
      await expect.poll(() => beforeAnchor(page, before, id)).toBeGreaterThanOrEqual(span.start);
      expect(await beforeAnchor(page, before, id)).toBeLessThan(span.end);
    });

    test("resizing the window keeps the frame on the same section", async ({ page }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, middle), id);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
      await page.setViewportSize({ width: 1180, height: 820 });
      await page.waitForTimeout(400);
      await expect(stageRegion(page, id)).toHaveAttribute("data-group", middle);
    });
  });
}

test("the old how-to page holds still while the article scrolls through its questions", async ({
  page,
}) => {
  const after = captureOf("article", "after", "desktop");
  const before = captureOf("article", "before", "desktop");
  const questions = spanOf(after, "questions");
  const held = spanOf(before, "questions").start;
  await page.goto("/");
  await openStage(page, "article");
  await scrollAfterTo(page, scrollForAnchor(after, questions.start + 20), "article");
  await expect(stageRegion(page, "article")).toHaveAttribute("data-group", "questions");
  await expect.poll(() => beforeAnchor(page, before, "article")).toBeCloseTo(held, 0);
  await scrollAfterTo(page, scrollForAnchor(after, questions.end - 20), "article");
  await expect.poll(() => beforeAnchor(page, before, "article")).toBeCloseTo(held, 0);
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const id of ["home", "article"] as const) {
    test(`${PAGES[id].name} opens on the mobile captures without scrolling sideways`, async ({
      page,
    }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
        "src",
        new RegExp(`captures/${id}/after/mobile/`),
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("@review the stage", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await openStage(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/02-stage.png" });
  await scrollAfterTo(page, scrollToMiddleOf(captureOf("home", "after", "desktop"), "how"));
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
  await openStage(page);
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

  for (const id of ["home", "article"] as const) {
    const after = captureOf(id, "after", "desktop");
    const before = captureOf(id, "before", "desktop");

    test(`a scroll still carries the before page along (${PAGES[id].name})`, async ({ page }) => {
      await page.goto("/");
      await openStage(page, id);
      await scrollAfterTo(page, scrollToMiddleOf(after, MIDDLE[id]), id);
      const span = spanOf(before, MIDDLE[id]);
      await expect
        .poll(() => beforeAnchor(page, before, id), { timeout: 1500 })
        .toBeGreaterThanOrEqual(span.start);
    });

    test(`the arrow keys still move the divider (${PAGES[id].name})`, async ({ page }) => {
      await page.goto("/");
      const stage = await openStage(page, id);
      await dividerSlider(page, id).focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => stage.getByTestId("divider-handle").evaluate((element) => element.style.left), {
          timeout: 1500,
        })
        .toBe("55%");
    });
  }
});

test.describe("on a touch phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("scrolling past the end of the frame carries on down the page", async ({ page }) => {
    await page.goto("/");
    const stage = await openStage(page);
    const scroller = stage.getByTestId("after-scroller");
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const box = await scroller.boundingBox();
    if (!box) throw new Error("The frame has not laid out");
    const pageScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.3);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(pageScroll);
  });
});

test("@review the article and help stages", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  for (const [id, file] of [
    ["article", "09-article"],
    ["help", "11-help"],
  ] as const) {
    await openStage(page, id);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `.capture/review/${file}.png` });
    await scrollAfterTo(page, scrollToMiddleOf(captureOf(id, "after", "desktop"), MIDDLE[id]), id);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.capture/review/${file}-middle.png` });
  }
});

test("@review the article and help stages on a phone", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto("/");
  for (const [id, file] of [
    ["article", "10-article-phone"],
    ["help", "12-help-phone"],
  ] as const) {
    await openStage(page, id);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.capture/review/${file}.png` });
  }
  await page.close();
});
