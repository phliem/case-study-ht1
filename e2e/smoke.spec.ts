import { expect, test } from "@playwright/test";
import { PAGE_IDS, PAGES } from "../src/data/pages";
import { dividerSlider, openStage } from "./stageHelpers";

test("loads with its title and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Bookable, before & after");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bookable, before & after");
  expect(errors).toEqual([]);
});

test("introduces the case study", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Front-end engineering")).toBeVisible();
  await expect(page.getByRole("banner").getByText("Sept 2026", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "bookable.health", exact: true })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
});

test("credits the captures", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
  await expect(page.getByRole("contentinfo")).toContainText(/Screens captured (on|between) \d/);
});

test("shows the three comparisons, each under its own names", async ({ page }) => {
  await page.goto("/?page=help");
  for (const id of PAGE_IDS) {
    const { name } = PAGES[id];
    await expect(page.getByRole("region", { name, exact: true })).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: `${name} sections`, exact: true }),
    ).toHaveCount(1);
    await openStage(page, id);
    await expect(dividerSlider(page, id)).toHaveCount(1);
  }
});

test("lines the comparison headings up with the page's other headings", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByTestId("design-diff").scrollIntoViewIfNeeded();
    await expect(page.getByRole("region", { name: "The system underneath" })).toBeVisible();
    const lefts = await page
      .getByRole("heading", { level: 1 })
      .or(page.getByRole("heading", { level: 2 }))
      .evaluateAll((headings) =>
        headings.map((heading) => Math.round(heading.getBoundingClientRect().left)),
      );
    expect(lefts.length).toBeGreaterThanOrEqual(5);
    expect(new Set(lefts).size, `${viewport.width}px: ${lefts.join(", ")}`).toBe(1);
  }
});

test("@review the page top", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/01-top.png" });
});
