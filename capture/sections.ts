import { sectionIds } from "../src/data/pages";
import type { PageId, SectionTop } from "../src/data/types";

export type SectionAnchor =
  | { kind: "page-top" }
  | { kind: "main-child"; index: number }
  | { kind: "main-child-with-heading"; text: string }
  | { kind: "element"; selector: string; text?: string }
  | { kind: "absent" }
  | { kind: "footer-after-main" };

export type FoundSection = { id: string; top: number | null };

export function resolveSections(
  page: PageId,
  found: readonly FoundSection[],
  pageHeight: number,
): SectionTop[] {
  const ids = sectionIds(page);
  const foundIds = found.map((section) => section.id).join(",");
  if (foundIds !== ids.join(",")) throw new Error(`Sections came back as ${foundIds}`);
  const tops: number[] = [];
  for (let index = found.length - 1; index >= 0; index--) {
    tops[index] = found[index].top ?? tops[index + 1] ?? pageHeight;
  }
  for (let index = 1; index < found.length; index++) {
    const sharesAbsentTop = found[index - 1].top === null && tops[index] === tops[index - 1];
    if (tops[index] <= tops[index - 1] && !sharesAbsentTop) {
      throw new Error(
        `${ids[index]} starts at ${tops[index]}px, not below ${ids[index - 1]} at ${tops[index - 1]}px`,
      );
    }
  }
  return ids.map((id, index) => ({ id, top: tops[index] }));
}
