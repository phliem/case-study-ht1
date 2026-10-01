import type { SectionId, SectionTop } from "../data/types";
import { clamp } from "./math";

export type PageLayout = { sections: readonly SectionTop[]; pageHeight: number };

export type SectionMap = {
  mapScroll: (scrollA: number) => number;
  groupAt: (scrollA: number) => SectionId;
  scrollForGroup: (id: SectionId) => number;
  maxScrollA: number;
  maxScrollB: number;
};

type Span = { id: SectionId; start: number; end: number };

function spansOf(page: PageLayout): Span[] {
  return page.sections.map((section, index) => ({
    id: section.id,
    start: section.top,
    end: page.sections[index + 1]?.top ?? page.pageHeight,
  }));
}

function spanIndexAt(anchor: number, spans: readonly Span[]): number {
  const index = spans.findIndex((span) => anchor < span.end);
  return index === -1 ? spans.length - 1 : index;
}

export function createSectionMap(
  after: PageLayout,
  before: PageLayout,
  viewportHeight: number,
): SectionMap {
  const spansA = spansOf(after);
  const spansB = spansOf(before);
  const idsA = spansA.map((span) => span.id).join(",");
  const idsB = spansB.map((span) => span.id).join(",");
  if (idsA !== idsB) throw new Error(`Section groups differ: ${idsA} vs ${idsB}`);

  const maxScrollA = Math.max(0, after.pageHeight - viewportHeight);
  const maxScrollB = Math.max(0, before.pageHeight - viewportHeight);

  const anchorA = (scrollA: number) =>
    maxScrollA === 0 ? 0 : (clamp(scrollA, 0, maxScrollA) / maxScrollA) * after.pageHeight;

  return {
    maxScrollA,
    maxScrollB,
    mapScroll(scrollA) {
      if (maxScrollB === 0) return 0;
      const anchor = anchorA(scrollA);
      const index = spanIndexAt(anchor, spansA);
      const spanA = spansA[index];
      const spanB = spansB[index];
      const t = spanA.end === spanA.start ? 0 : (anchor - spanA.start) / (spanA.end - spanA.start);
      const anchorB = spanB.start + t * (spanB.end - spanB.start);
      return clamp((anchorB / before.pageHeight) * maxScrollB, 0, maxScrollB);
    },
    groupAt(scrollA) {
      return spansA[spanIndexAt(anchorA(scrollA), spansA)].id;
    },
    scrollForGroup(id) {
      const index = spansA.findIndex((span) => span.id === id);
      if (index <= 0) return 0;
      if (index === spansA.length - 1) return maxScrollA;
      const span = spansA[index];
      return clamp(((span.start + span.end) / 2 / after.pageHeight) * maxScrollA, 0, maxScrollA);
    },
  };
}
