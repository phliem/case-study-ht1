import { sectionIds } from "./pages";
import type {
  Capture,
  CapturesFile,
  Device,
  PageId,
  SectionId,
  SectionIdOf,
  SectionTop,
  Version,
} from "./types";

export type Reuse = { from: PageId; starts: Partial<Record<SectionId, SectionId>> };

const HOME_2025_STARTS: Record<SectionIdOf["home-2025"], SectionIdOf["home"]> = {
  hero: "hero",
  "proof-how": "proof",
  "faq-about": "faq-about",
  areas: "areas",
  footer: "footer",
};

export const REUSED_AFTER = {
  "home-2025": { from: "home", starts: HOME_2025_STARTS },
} as const;

export type ReusedPage = keyof typeof REUSED_AFTER;

const REUSES: Partial<Record<PageId, Reuse>> = REUSED_AFTER;

export function reusedAfter(page: PageId): Reuse | null {
  return REUSES[page] ?? null;
}

export function isReused(page: PageId, version: Version): boolean {
  return version === "after" && reusedAfter(page) !== null;
}

export function regroup(
  source: Capture,
  page: PageId,
  starts: Partial<Record<SectionId, SectionId>>,
): Capture {
  const sections = sectionIds(page).map((id): SectionTop => {
    const from = starts[id];
    if (from === undefined) throw new Error(`${id} has no start group in the ${page} regrouping`);
    const start = source.sections.find((section) => section.id === from);
    if (!start) {
      throw new Error(
        `The ${source.page} ${source.version} ${source.device} capture has no ${from} group`,
      );
    }
    return { id, top: start.top };
  });
  for (let index = 1; index < sections.length; index++) {
    const previous = sections[index - 1];
    const section = sections[index];
    if (section.top <= previous.top) {
      throw new Error(
        `${section.id} would start at ${section.top}px, not below ${previous.id} at ${previous.top}px`,
      );
    }
  }
  return { ...source, page, sections };
}

export function findCapture(
  file: CapturesFile,
  page: PageId,
  version: Version,
  device: Device,
): Capture {
  const reuse = version === "after" ? reusedAfter(page) : null;
  if (reuse) return regroup(findCapture(file, reuse.from, version, device), page, reuse.starts);
  const capture = file.captures.find(
    (entry) => entry.page === page && entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`There is no ${page} ${version} capture for ${device}`);
  return capture;
}
