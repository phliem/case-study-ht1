import { expect, test } from "@playwright/test";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");

test("the rail follows the scroll", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "areas"));
  await expect(page.getByRole("button", { name: "Areas" })).toHaveAttribute("aria-current", "true");
});

test("the rail glides the frame to a section and shows what changed there", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(stageRegion(page)).toHaveAttribute("data-group", "how");
  await expect(
    page.getByText("Icons give way to looping product vignettes for each step."),
  ).toBeVisible();
});

test("switching device keeps the section", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stageRegion(page)).toHaveAttribute("data-group", "faq-about");
  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/home\/after\/mobile\//,
  );
  await expect(stageRegion(page)).toHaveAttribute("data-group", "faq-about");
});

test("@review the mobile frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  await stageRegion(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Mobile" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/04-stage-mobile.png" });
});
