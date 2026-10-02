import { expect, test } from "@playwright/test";
import { changesFor } from "../src/data/changes";
import { captureOf, scrollToMiddleOf } from "./captureData";
import { openStage, scrollAfterTo, stageRegion } from "./stageHelpers";

const AFTER = captureOf("home", "after", "desktop");

test("the rail follows the scroll", async ({ page }) => {
  await page.goto("/");
  await scrollAfterTo(page, scrollToMiddleOf(AFTER, "areas"));
  await expect(stageRegion(page).getByRole("button", { name: "Areas" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("the rail glides the frame to a section and shows what changed there", async ({ page }) => {
  await page.goto("/");
  const stage = stageRegion(page);
  await stage.getByRole("button", { name: "How it works" }).click();
  await expect(stage).toHaveAttribute("data-group", "how");
  await expect(stage.getByText(changesFor("home", "how")[0])).toBeVisible();
});

test("the article rail glides to its next steps and shows what changed there", async ({ page }) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await stage.getByRole("button", { name: "Next steps" }).click();
  await expect(stage).toHaveAttribute("data-group", "next");
  await expect(stage.getByText(changesFor("article", "next")[0])).toBeVisible();
});

test("switching device keeps the section", async ({ page }) => {
  await page.goto("/");
  const stage = stageRegion(page);
  await stage.getByRole("button", { name: "FAQ & About" }).click();
  await expect(stage).toHaveAttribute("data-group", "faq-about");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/home\/after\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "faq-about");
});

test("switching device on the article keeps it on the questions the old page lacks", async ({
  page,
}) => {
  await page.goto("/");
  const stage = await openStage(page, "article");
  await stage.getByRole("button", { name: "Common questions" }).click();
  await expect(stage).toHaveAttribute("data-group", "questions");
  await stage.getByRole("button", { name: "Mobile" }).click();
  await expect(stage.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/article\/after\/mobile\//,
  );
  await expect(stage).toHaveAttribute("data-group", "questions");
});

test("each comparison keeps its own device", async ({ page }) => {
  await page.goto("/");
  const article = await openStage(page, "article");
  await article.getByRole("button", { name: "Mobile" }).click();
  await expect(article.getByTestId("after-scroller").locator("img").first()).toHaveAttribute(
    "src",
    /captures\/article\/after\/mobile\//,
  );
  await expect(
    stageRegion(page).getByTestId("after-scroller").locator("img").first(),
  ).toHaveAttribute("src", /captures\/home\/after\/desktop\//);
});

test("@review the mobile frame", async ({ page }) => {
  test.skip(!process.env.REVIEW, "Run with pnpm review");
  await page.goto("/");
  const stage = await openStage(page);
  await stage.getByRole("button", { name: "Mobile" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".capture/review/04-stage-mobile.png" });
});
