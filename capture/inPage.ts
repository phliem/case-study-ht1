import type { MeasuredTokens, Rect } from "../src/data/types";
import type { PinnedBox } from "./pinnedPlan";
import type { SectionAnchor } from "./sections";

export type TokenSelectors = { headline: string; heroGround: string; search: string; card: string };

export async function settleInPage(): Promise<void> {
  await document.fonts.ready;
  const step = Math.max(200, Math.round(window.innerHeight * 0.6));
  for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
    window.scrollTo({ top, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  await Promise.all(
    Array.from(document.images, (image) =>
      image.complete
        ? undefined
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
    ),
  );
  for (const animation of document.getAnimations()) {
    if (animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      animation.finish();
  }
}

export async function pauseInfiniteAnimationsInPage(): Promise<void> {
  const infinite = () =>
    document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      );
  const waiting = () =>
    infinite().some(
      (animation) =>
        Number(animation.currentTime ?? 0) <
        Number(animation.effect?.getComputedTiming().delay ?? 0),
    );
  const deadline = performance.now() + 20_000;
  while (waiting()) {
    if (performance.now() > deadline)
      throw new Error("Animations were still in their delays after 20s");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  for (const animation of infinite()) animation.pause();
}

export async function scrollInPage(top: number): Promise<void> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export function sectionTopsInPage(
  anchors: [string, SectionAnchor][],
): { id: string; top: number | null }[] {
  const main = document.querySelector("main");
  if (!main) throw new Error("The page has no <main>");
  const children = Array.from(main.children);
  const pageTop = (element: Element) =>
    Math.round(element.getBoundingClientRect().top + window.scrollY);
  const textOf = (element: Element) => (element.textContent ?? "").replace(/\s+/g, " ").trim();
  return anchors.map(([id, anchor]) => {
    switch (anchor.kind) {
      case "page-top":
        return { id, top: 0 };
      case "main-child": {
        const child = children[anchor.index - 1];
        if (!child) throw new Error(`${id}: <main> has no child ${anchor.index}`);
        return { id, top: pageTop(child) };
      }
      case "main-child-with-heading": {
        const matches = children.filter((child) =>
          Array.from(child.querySelectorAll("h1, h2, h3")).some(
            (heading) => textOf(heading) === anchor.text,
          ),
        );
        if (matches.length !== 1) {
          throw new Error(
            `${id}: ${matches.length} children of <main> have the heading "${anchor.text}"`,
          );
        }
        return { id, top: pageTop(matches[0]) };
      }
      case "absent":
        return { id, top: null };
      case "element": {
        const matches = Array.from(document.querySelectorAll(anchor.selector)).filter(
          (element) => anchor.text === undefined || textOf(element) === anchor.text,
        );
        if (matches.length !== 1) {
          const wanted =
            anchor.text === undefined
              ? anchor.selector
              : `${anchor.selector} reading "${anchor.text}"`;
          throw new Error(`${id}: ${matches.length} elements match ${wanted}`);
        }
        return { id, top: pageTop(matches[0]) };
      }
      default: {
        const footer = Array.from(document.querySelectorAll("footer")).find(
          (candidate) =>
            !main.contains(candidate) &&
            Boolean(main.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
        );
        if (!footer) throw new Error(`${id}: no <footer> follows <main>`);
        return { id, top: pageTop(footer) };
      }
    }
  });
}

export function floatingElementsInPage(): string[] {
  const describe = (element: Element) => {
    const classes =
      typeof element.className === "string" && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
        : "";
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classes}`;
  };
  return Array.from(document.querySelectorAll("body *"))
    .filter((element) => {
      if (element.closest("[data-capture-hidden]")) return false;
      const style = getComputedStyle(element);
      if (style.position !== "fixed" && style.position !== "sticky") return false;
      const box = element.getBoundingClientRect();
      const onScreen =
        box.bottom > 0 &&
        box.right > 0 &&
        box.top < window.innerHeight &&
        box.left < window.innerWidth;
      return (
        onScreen &&
        box.width > 0 &&
        box.height > 0 &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0
      );
    })
    .map(describe);
}

export function measureTokensInPage(selectors: TokenSelectors): MeasuredTokens {
  const styleOf = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Nothing on the page matches ${selector}`);
    return getComputedStyle(element);
  };
  const headline = styleOf(selectors.headline);
  const hero = styleOf(selectors.heroGround);
  const search = styleOf(selectors.search);
  const card = styleOf(selectors.card);
  return {
    headline: {
      fontFamily: headline.fontFamily,
      fontSize: headline.fontSize,
      lineHeight: headline.lineHeight,
      letterSpacing: headline.letterSpacing,
      fontWeight: headline.fontWeight,
    },
    heroGround: hero.backgroundImage !== "none" ? hero.backgroundImage : hero.backgroundColor,
    search: { borderRadius: search.borderRadius, boxShadow: search.boxShadow },
    card: { borderRadius: card.borderRadius, boxShadow: card.boxShadow },
  };
}

export async function addSpecimenInPage(): Promise<void> {
  const specimen = document.createElement("div");
  specimen.id = "capture-specimen";
  specimen.style.cssText =
    "position:absolute;left:0;top:0;padding:12px 20px;font-family:var(--font-frutiger);color:#F0F4F5;white-space:nowrap";
  specimen.innerHTML = [
    '<div style="font-size:96px;line-height:1;font-weight:400">Aa</div>',
    '<div style="margin-top:16px;font-size:28px;line-height:1.25;font-weight:400">Register and book with an NHS GP</div>',
    '<div style="font-size:28px;line-height:1.25;font-weight:600">Register and book with an NHS GP</div>',
  ].join("");
  document.body.append(specimen);
  window.scrollTo({ top: 0, behavior: "instant" });
  await document.fonts.ready;
}

export type LoopRegionQuery = {
  id: string;
  scopeHeading: string | null;
  selector: string;
  index: number;
  radius: "self" | "parent-top";
};

type LoopWindow = Window & { __loop?: { animation: Animation; start: number }[] };

export function markLoopRegionInPage(region: LoopRegionQuery): {
  rect: { x: number; y: number; width: number; height: number };
  radius: [number, number, number, number];
  periods: number[];
} {
  const textOf = (element: Element) => (element.textContent ?? "").replace(/\s+/g, " ").trim();
  const scope: ParentNode | undefined =
    region.scopeHeading === null
      ? document
      : Array.from(document.querySelectorAll("main > *")).find((child) =>
          Array.from(child.querySelectorAll("h1, h2, h3")).some(
            (heading) => textOf(heading) === region.scopeHeading,
          ),
        );
  const element = scope?.querySelectorAll(region.selector)[region.index];
  if (!element) throw new Error(`Loop region ${region.id} is not on the page`);

  const box = element.getBoundingClientRect();
  const x = Math.floor(box.left + window.scrollX);
  const y = Math.floor(box.top + window.scrollY);
  const rect = {
    x,
    y,
    width: Math.ceil(box.right + window.scrollX) - x,
    height: Math.ceil(box.bottom + window.scrollY) - y,
  };

  const corners = (source: Element) => {
    const style = getComputedStyle(source);
    return [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].map((value) => Number.parseFloat(value) || 0);
  };
  const own = corners(element);
  const parent = element.parentElement ? corners(element.parentElement) : [0, 0, 0, 0];
  const radius: [number, number, number, number] =
    region.radius === "self" ? [own[0], own[1], own[2], own[3]] : [parent[0], parent[1], 0, 0];

  const animations = document.getAnimations().filter((animation) => {
    const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
    return (
      target !== null &&
      element.contains(target) &&
      animation.effect?.getComputedTiming().iterations === Infinity
    );
  });
  if (animations.length === 0)
    throw new Error(`Loop region ${region.id} has no running animations`);
  (window as LoopWindow).__loop = animations.map((animation) => ({
    animation,
    start: Number(animation.currentTime ?? 0),
  }));
  return {
    rect,
    radius,
    periods: animations.map(
      (animation) => Number(animation.effect?.getComputedTiming().duration ?? 0) / 1000,
    ),
  };
}

export async function scrollRegionIntoViewInPage(rect: {
  y: number;
  height: number;
}): Promise<number> {
  if (rect.height > window.innerHeight) {
    throw new Error(
      `A ${rect.height}px loop region is taller than the ${window.innerHeight}px viewport`,
    );
  }
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const top = Math.min(
    maxScroll,
    Math.max(0, Math.round(rect.y - (window.innerHeight - rect.height) / 2)),
  );
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return rect.y - window.scrollY;
}

export async function seekLoopInPage({
  seconds,
  rates,
}: {
  seconds: number;
  rates: number[];
}): Promise<void> {
  const loop = (window as LoopWindow).__loop;
  if (!loop) throw new Error("No loop region is marked");
  for (const [index, entry] of loop.entries()) {
    entry.animation.currentTime = entry.start + seconds * 1000 * (rates[index] ?? 1);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export function markPinnedInPage(queries: { id: string; selector: string }[]): void {
  for (const query of queries) {
    const matches = document.querySelectorAll(query.selector);
    if (matches.length !== 1) {
      throw new Error(`Pinned ${query.id}: ${matches.length} elements match ${query.selector}`);
    }
    const position = getComputedStyle(matches[0]).position;
    if (position !== "sticky") {
      throw new Error(`Pinned ${query.id} is position: ${position}, not sticky`);
    }
    matches[0].setAttribute("data-capture-pinned", query.id);
  }
}

export function hidePinnedInPage(): void {
  for (const element of document.querySelectorAll("[data-capture-pinned]")) {
    element.setAttribute("data-capture-hidden", "");
  }
}

export async function measurePinnedInPage(id: string): Promise<PinnedBox> {
  const element = document.querySelector<HTMLElement>(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  const frames = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const round = (value: number) => Math.round(value * 100) / 100;
  window.scrollTo({ top: 0, behavior: "instant" });
  await frames();
  const style = getComputedStyle(element);
  const stickTop = Number.parseFloat(style.top) || 0;
  const zIndex = Number.parseInt(style.zIndex, 10) || 0;
  const inline = element.getAttribute("style");
  element.style.setProperty("position", "static", "important");
  const natural = element.getBoundingClientRect();
  if (inline === null) element.removeAttribute("style");
  else element.setAttribute("style", inline);
  const pageHeight = document.documentElement.scrollHeight;
  const maxScroll = pageHeight - window.innerHeight;
  window.scrollTo({ top: maxScroll, behavior: "instant" });
  await frames();
  const end = element.getBoundingClientRect();
  const endTop = end.top + window.scrollY;
  window.scrollTo({ top: 0, behavior: "instant" });
  await frames();
  const stuckToTheEnd = endTop >= maxScroll + stickTop - 0.5;
  return {
    x: round(natural.left),
    y: round(natural.top),
    width: round(natural.width),
    stickTop,
    releaseAt: round(
      stuckToTheEnd ? Math.max(pageHeight, maxScroll + stickTop + end.height) : endTop + end.height,
    ),
    zIndex,
  };
}

export async function pinnedSignaturesInPage({
  ids,
  top,
}: {
  ids: string[];
  top: number;
}): Promise<string[]> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 60));
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  return ids.map((id) => {
    const element = document.querySelector(`[data-capture-pinned="${id}"]`);
    if (!element) throw new Error(`Pinned ${id} is not marked`);
    const style = getComputedStyle(element);
    return [
      element.outerHTML,
      style.backgroundColor,
      style.borderBottomColor,
      style.boxShadow,
      style.backdropFilter,
    ].join("|");
  });
}

export async function pinnedShotInPage({
  id,
  top,
}: {
  id: string;
  top: number;
}): Promise<{ rect: Rect; blur: number | null }> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 60));
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  const element = document.querySelector(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  const box = element.getBoundingClientRect();
  if (
    box.top < 0 ||
    box.left < 0 ||
    box.bottom > window.innerHeight ||
    box.right > window.innerWidth
  ) {
    throw new Error(`Pinned ${id} is not wholly in view at scroll ${top}`);
  }
  const blur = /blur\(([\d.]+)px\)/.exec(getComputedStyle(element).backdropFilter);
  return {
    rect: { x: box.left, y: box.top, width: box.width, height: box.height },
    blur: blur ? Number(blur[1]) : null,
  };
}

export async function pinnedTopAtInPage({ id, top }: { id: string; top: number }): Promise<number> {
  window.scrollTo({ top, behavior: "instant" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const element = document.querySelector(`[data-capture-pinned="${id}"]`);
  if (!element) throw new Error(`Pinned ${id} is not marked`);
  return element.getBoundingClientRect().top + window.scrollY;
}
