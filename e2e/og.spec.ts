import { test } from "@playwright/test";

test("@og writes the link-preview image", async ({ page }) => {
  test.skip(!process.env.OG, "Run with pnpm og");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto("/");
  await page
    .getByRole("region", { name: "Before and after comparison" })
    .evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "public/og.png" });
});
