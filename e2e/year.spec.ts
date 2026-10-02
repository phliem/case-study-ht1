import { expect, test } from "@playwright/test";
import { A_YEAR_ON, CASE_STUDY } from "../src/data/caseStudy";
import { changesFor } from "../src/data/changes";
import { PAGES } from "../src/data/pages";
import { captureOf, scrollForAnchor, scrollToMiddleOf, spanOf } from "./captureData";
import { beforeAnchor, dividerSlider, openStage, scrollAfterTo, stageRegion } from "./stageHelpers";

const YEAR = "/?view=a-year-on";

test("the main page links to the homepage a year on, and the new view links back", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: A_YEAR_ON.link, exact: true }).click();
  await expect(page).toHaveURL(/\/\?view=a-year-on$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(A_YEAR_ON.title);
  await page.getByRole("link", { name: CASE_STUDY.title, exact: true }).click();
  await expect(page).toHaveURL(/:4173\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(CASE_STUDY.title);
});

test("opens with its own title and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(YEAR);
  await expect(page).toHaveTitle(A_YEAR_ON.documentTitle);
  expect(errors).toEqual([]);
});

test("introduces the comparison with both dates", async ({ page }) => {
  await page.goto(YEAR);
  const banner = page.getByRole("banner");
  await expect(banner.getByText(A_YEAR_ON.lede)).toBeVisible();
  await expect(banner.getByText(A_YEAR_ON.before, { exact: true })).toBeVisible();
  await expect(banner.getByText(A_YEAR_ON.after, { exact: true })).toBeVisible();
  await expect(banner.getByRole("link", { name: "bookable.health", exact: true })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
});

test("shows one comparison, named by the header and without an intro of its own", async ({
  page,
}) => {
  await page.goto(YEAR);
  await expect(page.getByRole("region", { name: A_YEAR_ON.title, exact: true })).toHaveCount(1);
  const stage = await openStage(page, "home-2025");
  await expect(
    stage.getByRole("navigation", { name: "Homepage sections", exact: true }).getByRole("button"),
  ).toHaveText(PAGES["home-2025"].sections.map((section) => section.label));
  await expect(dividerSlider(page, "home-2025")).toHaveCount(1);
  await expect(stage.getByText(changesFor("home-2025", "hero")[0])).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
});

test("ignores a page asked for outside recording", async ({ page }) => {
  await page.goto(`${YEAR}&page=article`);
  await expect(stageRegion(page, "home-2025")).toHaveCount(1);
  await expect(stageRegion(page, "article")).toHaveCount(0);
});

test("credits the captures it shows", async ({ page }) => {
  await page.goto(YEAR);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(A_YEAR_ON.title);
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
  await expect(page.getByRole("contentinfo")).toContainText(/Screens captured (on|between) \d/);
});

test("shares the main page header's left edge", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const lefts: number[] = [];
    for (const url of ["/", YEAR]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        url === YEAR ? A_YEAR_ON.title : CASE_STUDY.title,
      );
      lefts.push(
        await page
          .getByRole("heading", { level: 1 })
          .evaluate((heading) => Math.round(heading.getBoundingClientRect().left)),
      );
    }
    expect(lefts[1], `${viewport.width}px`).toBe(lefts[0]);
  }
});

test("names the two sides by date", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await expect(stage.getByText("Sept 2025 · NHS design system", { exact: true })).toBeVisible();
  await expect(stage.getByText("Sept 2026 · v2", { exact: true })).toBeVisible();
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByText("2025", { exact: true })).toBeVisible();
  await expect(stage.getByText("v2", { exact: true })).toBeVisible();
});

test("the 2025 page holds still while v2 scrolls through the areas", async ({ page }) => {
  const after = captureOf("home-2025", "after", "desktop");
  const before = captureOf("home-2025", "before", "desktop");
  const areas = spanOf(after, "areas");
  const held = spanOf(before, "areas").start;
  await page.goto(YEAR);
  await openStage(page, "home-2025");
  await scrollAfterTo(page, scrollForAnchor(after, areas.start + 20), "home-2025");
  await expect(stageRegion(page, "home-2025")).toHaveAttribute("data-group", "areas");
  await expect.poll(() => beforeAnchor(page, before, "home-2025")).toBeCloseTo(held, 0);
  await scrollAfterTo(page, scrollForAnchor(after, areas.end - 20), "home-2025");
  await expect.poll(() => beforeAnchor(page, before, "home-2025")).toBeCloseTo(held, 0);
});

test("switching device keeps the group", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stage).toHaveAttribute("data-group", "faq-about");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("before-page").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/home-2025\/before\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "faq-about");
});

test("Play tours the year-on comparison", async ({ page }) => {
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(stage).toHaveAttribute("data-group", "proof-how", { timeout: 5000 });
});

test("recording mode shows the year-on comparison, asked for by page or by view", async ({
  page,
}) => {
  for (const url of ["/?record=16x9&page=home-2025", `${YEAR}&record=16x9`]) {
    await page.goto(url);
    const stage = page.getByRole("region", { name: PAGES["home-2025"].name, exact: true });
    await expect(stage.getByTestId("before-page").locator("img").first()).toHaveAttribute(
      "src",
      /captures\/home-2025\/before\/desktop\//,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  }
});

test("a keyboard visitor tabs from the back link to the divider", async ({ page }) => {
  await page.goto(YEAR);
  await page.getByRole("link", { name: CASE_STUDY.title, exact: true }).focus();
  const slider = dividerSlider(page, "home-2025");
  for (let presses = 0; presses < 16; presses++) {
    if (await slider.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(slider).toBeFocused();
});

test("with reduced motion Play cuts instead of sweeping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(YEAR);
  const stage = await openStage(page, "home-2025");
  await stage.getByRole("button", { name: "Play", exact: true }).click();
  await expect(dividerSlider(page, "home-2025")).toHaveValue("0", { timeout: 400 });
});

test("@review the homepage a year on", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto(YEAR);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/14-year-top.png" });
  await openStage(page, "home-2025");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/15-year-stage.png" });
  await scrollAfterTo(
    page,
    scrollToMiddleOf(captureOf("home-2025", "after", "desktop"), "proof-how"),
    "home-2025",
  );
  await page.waitForTimeout(900);
  await page.screenshot({ path: ".capture/review/15-year-stage-middle.png" });
});

test("@review the homepage a year on, on a phone", async ({ browser }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto(YEAR);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/16-year-phone-top.png" });
  await openStage(page, "home-2025");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".capture/review/16-year-phone-stage.png" });
  await page.close();
});

test("fits its rail labels in the 16:9 recording frame", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/?record=16x9&page=home-2025");
  const overflowing = await page
    .getByRole("navigation", { name: "Homepage sections", exact: true })
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => button.scrollWidth > button.clientWidth)
        .map((button) => button.textContent),
    );
  expect(overflowing).toEqual([]);
});
