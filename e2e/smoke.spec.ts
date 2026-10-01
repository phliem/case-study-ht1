import { expect, test } from "@playwright/test";

test("loads with its title and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Bookable homepage, before & after");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bookable homepage, before & after",
  );
  expect(errors).toEqual([]);
});
