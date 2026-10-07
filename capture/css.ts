// The surgery and clinician pages dock a booking bar to the top or bottom of the window once the
// booking card scrolls away; a still capture has no scroll, so it would cover the page.
export const HIDDEN_SELECTORS = [
  ".phone-help-bubble",
  ".cookie-banner-ssr",
  "main > .fixed.inset-x-0",
];

export const CAPTURE_CSS = [
  `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
  "[data-capture-hidden] { visibility: hidden !important; }",
  "* { caret-color: transparent !important; }",
].join("\n");

export function isolateCss(selector: string): string {
  return [
    "html, body { background: transparent !important; }",
    "body * { visibility: hidden !important; }",
    `${selector}, ${selector} * { visibility: visible !important; }`,
  ].join("\n");
}
