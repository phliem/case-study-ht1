import { expect, test } from "@playwright/test";
import { A_YEAR_ON, CASE_STUDY } from "../src/data/caseStudy";
import { changesFor } from "../src/data/changes";
import { PAGES } from "../src/data/pages";
import { dividerSlider, openStage, stageRegion } from "./stageHelpers";

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
