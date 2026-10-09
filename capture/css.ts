// Surgery and clinician pages dock a booking bar to the window once the booking card scrolls away
// (main > .fixed.inset-x-0 today, div.fixed.right-0.bottom-0 in January); a still capture has no
// scroll, so it would cover the page.
const CHROME_SELECTORS = [".phone-help-bubble", ".cookie-banner-ssr"];

export const HIDDEN_SELECTORS = [
  ...CHROME_SELECTORS,
  "main > .fixed.inset-x-0",
  "div.fixed.right-0.bottom-0",
];

export const CAPTURE_CSS = [
  `${HIDDEN_SELECTORS.join(", ")} { display: none !important; }`,
  "[data-capture-hidden] { visibility: hidden !important; }",
  "* { caret-color: transparent !important; }",
].join("\n");

// A journey's screenshots keep the docked bars: they hold the step's button, and nothing scrolls
// past them.
export const FLOW_CAPTURE_CSS = [
  `${CHROME_SELECTORS.join(", ")} { display: none !important; }`,
  "* { caret-color: transparent !important; }",
].join("\n");

export function isolateCss(selector: string): string {
  return [
    "html, body { background: transparent !important; }",
    "body * { visibility: hidden !important; }",
    `${selector}, ${selector} * { visibility: visible !important; }`,
  ].join("\n");
}
