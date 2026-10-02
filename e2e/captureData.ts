import { readFileSync } from "node:fs";
import { findCapture } from "../src/data/reuse";
import type { Capture, CapturesFile, Device, PageId, SectionId, Version } from "../src/data/types";

const FILE = JSON.parse(
  readFileSync(new URL("../src/data/captures.json", import.meta.url), "utf8"),
) as CapturesFile;

export function captureOf(page: PageId, version: Version, device: Device): Capture {
  return findCapture(FILE, page, version, device);
}

export function spanOf(capture: Capture, id: SectionId): { start: number; end: number } {
  const index = capture.sections.findIndex((section) => section.id === id);
  if (index === -1) throw new Error(`${id} is not a section of the ${capture.version} capture`);
  return {
    start: capture.sections[index].top,
    end: capture.sections[index + 1]?.top ?? capture.pageHeight,
  };
}

export function maxScrollOf(capture: Capture): number {
  return capture.pageHeight - capture.viewport.height;
}

export function anchorOf(capture: Capture, scroll: number): number {
  return (scroll / maxScrollOf(capture)) * capture.pageHeight;
}

export function scrollForAnchor(capture: Capture, anchor: number): number {
  return (anchor / capture.pageHeight) * maxScrollOf(capture);
}

export function scrollToMiddleOf(capture: Capture, id: SectionId): number {
  const span = spanOf(capture, id);
  return scrollForAnchor(capture, (span.start + span.end) / 2);
}
