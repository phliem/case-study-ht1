import { readFileSync } from "node:fs";
import type { Capture, CapturesFile, Device, SectionId, Version } from "../src/data/types";

const FILE = JSON.parse(
  readFileSync(new URL("../src/data/captures.json", import.meta.url), "utf8"),
) as CapturesFile;

export function captureOf(version: Version, device: Device): Capture {
  const capture = FILE.captures.find(
    (entry) => entry.version === version && entry.device === device,
  );
  if (!capture) throw new Error(`No ${version} capture for ${device}`);
  return capture;
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

export function scrollToMiddleOf(capture: Capture, id: SectionId): number {
  const span = spanOf(capture, id);
  return ((span.start + span.end) / 2 / capture.pageHeight) * maxScrollOf(capture);
}
