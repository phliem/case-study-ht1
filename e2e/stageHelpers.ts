import { expect, type Page } from "@playwright/test";
import type { Capture } from "../src/data/types";
import { anchorOf } from "./captureData";

export function stageRegion(page: Page) {
  return page.getByRole("region", { name: "Before and after comparison" });
}

export async function stageScale(page: Page): Promise<number> {
  const viewport = page.getByTestId("stage-viewport");
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-scale")))
    .toBeGreaterThan(0);
  return Number(await viewport.getAttribute("data-scale"));
}

export async function scrollAfterTo(page: Page, pagePx: number): Promise<void> {
  const scale = await stageScale(page);
  await page.getByTestId("after-scroller").evaluate((element, top) => {
    element.scrollTop = top;
  }, pagePx * scale);
}

export async function beforeAnchor(page: Page, before: Capture): Promise<number> {
  const scale = await stageScale(page);
  const translateY = await page
    .getByTestId("before-page")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  return anchorOf(before, -translateY / scale);
}
