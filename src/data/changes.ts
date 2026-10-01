import type { SectionId } from "./types";

export const CHANGES: Record<SectionId, readonly string[]> = {
  hero: [
    "The postcode search becomes the hero's single control, lifted further here than anywhere else it appears.",
    "A reel of appointment cards scrolls beside the search on desktop.",
    "The header lies clear over the hero and turns solid as soon as the page moves.",
  ],
  proof: [
    "Stats, a top-rated surgeries list and reviews, three NHS-styled blocks, merge into one testimonials section.",
    "Headline figures sit under the quotes they back up.",
  ],
  how: [
    "Icons give way to looping product vignettes for each step.",
    "Steps are numbered with tracked microlabels: Step 1, Step 2, Step 3.",
  ],
  "faq-about": [
    "The FAQ moves above About.",
    'Its title changes from "Common questions about finding an NHS GP in England" to "Questions before you start".',
  ],
  areas: [
    'The "Looking for a GP in a specific city?" tag list becomes a call to action: "Find an NHS GP surgery in your area".',
    "The areas where Bookable is live sit underneath, ready to browse.",
  ],
  footer: [
    "The NHS three-column footer becomes one site-wide footer: brand, inline nav, the 111/999 disclaimer and legal links.",
    "On phones the nav becomes 56px full-width rows and the legal links a two-column grid.",
  ],
};
