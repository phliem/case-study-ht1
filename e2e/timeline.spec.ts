import { expect, test } from "@playwright/test";

test("tells how the redesign shipped and credits the captures", async ({ page }) => {
  await page.goto("/");
  const timeline = page.getByRole("region", { name: "Four chunks, one week" });
  await timeline.scrollIntoViewIfNeeded();
  await expect(timeline.getByRole("listitem")).toHaveCount(4);
  await expect(timeline.getByRole("heading", { level: 3 })).toHaveText([
    "Site footer",
    "Site header",
    "Postcode search",
    "Homepage",
  ]);
  await expect(page.getByRole("link", { name: "Live at bookable.health" })).toHaveAttribute(
    "href",
    "https://bookable.health",
  );
  await expect(page.getByRole("contentinfo")).toContainText("Frutiger is licensed to the NHS");
});

test("@review the timeline", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.getByRole("region", { name: "Four chunks, one week" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: ".capture/review/06-timeline.png" });
});
