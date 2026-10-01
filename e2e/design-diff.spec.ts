import { expect, test } from "@playwright/test";

test("token cards flip to v2 as they scroll in, and back on a click", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "The system underneath" });
  const typeface = section.getByRole("button", { name: /^Typeface/ });
  await typeface.scrollIntoViewIfNeeded();
  await expect(typeface).toHaveAttribute("aria-pressed", "true");
  await typeface.click();
  await expect(typeface).toHaveAttribute("aria-pressed", "false");
  await expect(section.getByText("Frutiger", { exact: true })).toBeVisible();
  await expect(section.getByText("Hanken Grotesk", { exact: true })).toBeVisible();
});

test("@review the design-system diff", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await page.getByRole("region", { name: "The system underneath" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: ".capture/review/05-design-diff.png" });
});
