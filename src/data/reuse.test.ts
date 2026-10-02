import { describe, expect, it } from "vitest";
import { CAPTURES } from "./captures";
import { PAGE_IDS } from "./pages";
import { findCapture, isReused, REUSED_AFTER, regroup, reusedAfter } from "./reuse";
import type { Capture, Device, SectionId } from "./types";

const DEVICES: readonly Device[] = ["desktop", "mobile"];
const STARTS = REUSED_AFTER["home-2025"].starts;

function homeAfter(device: Device): Capture {
  const capture = CAPTURES.captures.find(
    (entry) => entry.page === "home" && entry.version === "after" && entry.device === device,
  );
  if (!capture) throw new Error(`There is no home after capture for ${device}`);
  return capture;
}

function topOf(capture: Capture, id: SectionId): number {
  const section = capture.sections.find((entry) => entry.id === id);
  if (!section) throw new Error(`${id} is not a group of the capture`);
  return section.top;
}

describe("findCapture", () => {
  it("gives the 2025 comparison the homepage's v2 capture, regrouped", () => {
    for (const device of DEVICES) {
      const home = homeAfter(device);
      expect(findCapture(CAPTURES, "home-2025", "after", device)).toEqual({
        ...home,
        page: "home-2025",
        sections: [
          { id: "hero", top: topOf(home, "hero") },
          { id: "proof-how", top: topOf(home, "proof") },
          { id: "faq-about", top: topOf(home, "faq-about") },
          { id: "areas", top: topOf(home, "areas") },
          { id: "footer", top: topOf(home, "footer") },
        ],
      });
    }
  });

  it("returns a stored capture as the file holds it", () => {
    expect(findCapture(CAPTURES, "home", "after", "desktop")).toBe(homeAfter("desktop"));
  });

  it("names a capture the file lacks", () => {
    expect(() => findCapture({ ...CAPTURES, captures: [] }, "help", "before", "mobile")).toThrow(
      "There is no help before capture for mobile",
    );
  });
});

describe("regroup", () => {
  it("throws when a group has no start", () => {
    const starts = {
      hero: "hero",
      "proof-how": "proof",
      "faq-about": "faq-about",
      footer: "footer",
    } as const;
    expect(() => regroup(homeAfter("desktop"), "home-2025", starts)).toThrow(
      "areas has no start group in the home-2025 regrouping",
    );
  });

  it("throws when the capture lacks a start group", () => {
    const home = homeAfter("desktop");
    const withoutProof = {
      ...home,
      sections: home.sections.filter((section) => section.id !== "proof"),
    };
    expect(() => regroup(withoutProof, "home-2025", STARTS)).toThrow(
      "The home after desktop capture has no proof group",
    );
  });

  it("throws when the starts are out of order", () => {
    expect(() =>
      regroup(homeAfter("desktop"), "home-2025", {
        ...STARTS,
        "proof-how": "how",
        "faq-about": "proof",
      }),
    ).toThrow("faq-about would start at");
  });
});

describe("isReused", () => {
  it("reuses only the 2025 comparison's after side, from the homepage", () => {
    const reused = PAGE_IDS.flatMap((page) =>
      (["before", "after"] as const)
        .filter((version) => isReused(page, version))
        .map((version) => `${page} ${version}`),
    );
    expect(reused).toEqual(["home-2025 after"]);
    expect(reusedAfter("home-2025")?.from).toBe("home");
    expect(reusedAfter("home")).toBeNull();
  });
});
