import type { SectionId } from "./types";

export const SECTION_IDS: readonly SectionId[] = [
  "hero",
  "proof",
  "how",
  "faq-about",
  "areas",
  "footer",
];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  proof: "Social proof",
  how: "How it works",
  "faq-about": "FAQ & About",
  areas: "Areas",
  footer: "Footer",
};
