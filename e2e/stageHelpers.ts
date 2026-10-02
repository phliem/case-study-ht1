import { expect, type Locator, type Page } from "@playwright/test";
import { A_YEAR_ON } from "../src/data/caseStudy";
import { PAGES } from "../src/data/pages";
import type { Capture, PageId } from "../src/data/types";
import { anchorOf } from "./captureData";

const NAMED_BY_VIEW: Partial<Record<PageId, string>> = { "home-2025": A_YEAR_ON.title };

export function stageName(id: PageId): string {
  return NAMED_BY_VIEW[id] ?? PAGES[id].name;
}

export function stageRegion(page: Page, id: PageId = "home"): Locator {
  return page.getByRole("region", { name: stageName(id), exact: true });
}

export function dividerSlider(page: Page, id: PageId = "home"): Locator {
  return page.getByRole("slider", { name: `${PAGES[id].name}: divider between before and after` });
}

export async function stageScale(page: Page, id: PageId = "home"): Promise<number> {
  const viewport = stageRegion(page, id).getByTestId("stage-viewport");
  await expect
    .poll(async () => Number(await viewport.getAttribute("data-scale")))
    .toBeGreaterThan(0);
  return Number(await viewport.getAttribute("data-scale"));
}

export async function openStage(page: Page, id: PageId = "home"): Promise<Locator> {
  const stage = stageRegion(page, id);
  await stage.getByTestId("stage-grid").scrollIntoViewIfNeeded();
  await stageScale(page, id);
  return stage;
}

export async function scrollAfterTo(page: Page, pagePx: number, id: PageId = "home") {
  const scale = await stageScale(page, id);
  await stageRegion(page, id)
    .getByTestId("after-scroller")
    .evaluate((element, top) => {
      element.scrollTop = top;
    }, pagePx * scale);
}

export async function afterScroll(page: Page, id: PageId = "home"): Promise<number> {
  const scale = await stageScale(page, id);
  return stageRegion(page, id)
    .getByTestId("after-scroller")
    .evaluate((element, by) => element.scrollTop / by, scale);
}

export async function beforeAnchor(page: Page, before: Capture, id: PageId = "home") {
  const scale = await stageScale(page, id);
  const translateY = await stageRegion(page, id)
    .getByTestId("before-page")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  return anchorOf(before, -translateY / scale);
}

export async function pinnedOffset(page: Page, layerId: string, id: PageId = "home") {
  return stageRegion(page, id)
    .getByTestId(`pinned-${layerId}`)
    .first()
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
}
