import { join } from "node:path";
import type { Page } from "@playwright/test";
import type { PinnedLayer, PinnedState } from "../src/data/types";
import { pinnedTop } from "../src/lib/pinned";
import { isolateCss } from "./css";
import {
  markPinnedInPage,
  measurePinnedInPage,
  pinnedShotInPage,
  pinnedSignaturesInPage,
  pinnedTopAtInPage,
  scrollInPage,
} from "./inPage";
import type { PinnedQuery } from "./pages";
import { publicPath } from "./paths";
import { checkScrolls, type PinnedBox, shotScroll } from "./pinnedPlan";

const SCAN_STEP = 24;
const TOLERANCE = 1;

export type PinnedPlan = { id: string; box: PinnedBox; froms: number[] };

function maxScrollOf(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
}

export async function planPinned(
  page: Page,
  queries: readonly PinnedQuery[],
): Promise<PinnedPlan[]> {
  if (queries.length === 0) return [];
  const ids = queries.map((query) => query.id);
  await page.evaluate(
    markPinnedInPage,
    queries.map(({ id, selector }) => ({ id, selector })),
  );
  const boxes: PinnedBox[] = [];
  for (const id of ids) boxes.push(await page.evaluate(measurePinnedInPage, id));
  const maxScroll = await maxScrollOf(page);
  const signaturesAt = (top: number) => page.evaluate(pinnedSignaturesInPage, { ids, top });
  const froms = ids.map(() => [0]);
  let previous = await signaturesAt(0);
  let low = 0;
  while (low < maxScroll) {
    const high = Math.min(low + SCAN_STEP, maxScroll);
    const current = await signaturesAt(high);
    for (const [index, signature] of current.entries()) {
      if (signature === previous[index]) continue;
      let same = low;
      let changed = high;
      while (changed - same > 1) {
        const middle = Math.floor((same + changed) / 2);
        if ((await signaturesAt(middle))[index] === previous[index]) same = middle;
        else changed = middle;
      }
      froms[index].push(changed);
    }
    previous = current;
    low = high;
  }
  await page.evaluate(scrollInPage, 0);
  return ids
    .map((id, index) => ({ id, box: boxes[index], froms: froms[index] }))
    .sort((a, b) => a.box.zIndex - b.box.zIndex);
}

export async function shootPinned(
  page: Page,
  plans: readonly PinnedPlan[],
  outDir: string,
): Promise<PinnedLayer[]> {
  const maxScroll = await maxScrollOf(page);
  const layers: PinnedLayer[] = [];
  for (const plan of plans) {
    const selector = `[data-capture-pinned="${plan.id}"]`;
    await page.evaluate(
      (target) => document.querySelector(target)?.removeAttribute("data-capture-hidden"),
      selector,
    );
    const isolation = await page.addStyleTag({ content: isolateCss(selector) });
    const states: PinnedState[] = [];
    for (const [index, from] of plan.froms.entries()) {
      const top = shotScroll(plan.box, plan.froms, index, maxScroll);
      const shot = await page.evaluate(pinnedShotInPage, { id: plan.id, top });
      const path = join(outDir, `pinned-${plan.id}-${index}.png`);
      await page.screenshot({ path, clip: shot.rect, omitBackground: true, caret: "hide" });
      states.push({
        from,
        src: publicPath(path),
        height: Math.round(shot.rect.height * 100) / 100,
        blur: shot.blur,
      });
    }
    await isolation.evaluate((node) => {
      node.parentNode?.removeChild(node);
    });
    await page.evaluate(
      (target) => document.querySelector(target)?.setAttribute("data-capture-hidden", ""),
      selector,
    );
    const { x, y, width, stickTop, releaseAt } = plan.box;
    layers.push({ id: plan.id, x, y, width, stickTop, releaseAt, states });
  }
  await page.evaluate(scrollInPage, 0);
  return layers;
}

export async function checkPinned(page: Page, layers: readonly PinnedLayer[]): Promise<void> {
  const maxScroll = await maxScrollOf(page);
  for (const layer of layers) {
    for (const scroll of checkScrolls(layer, maxScroll)) {
      const actual = await page.evaluate(pinnedTopAtInPage, { id: layer.id, top: scroll });
      const expected = pinnedTop(layer, scroll);
      if (Math.abs(actual - expected) > TOLERANCE) {
        throw new Error(
          `Pinned ${layer.id} sits at ${actual.toFixed(1)}px at scroll ${scroll}, but the model puts it at ${expected.toFixed(1)}px`,
        );
      }
    }
  }
  await page.evaluate(scrollInPage, 0);
}
