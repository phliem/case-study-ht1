import { describe, expect, it } from "vitest";
import { parseCaptureArgs } from "./args";

describe("parseCaptureArgs", () => {
  it("captures every page with loops by default", () => {
    expect(parseCaptureArgs([])).toEqual({
      pages: ["home", "article", "help", "home-2025"],
      skipLoops: false,
    });
  });

  it("captures only the pages asked for, in page order", () => {
    expect(parseCaptureArgs(["--page", "help", "--page=article"]).pages).toEqual([
      "article",
      "help",
    ]);
  });

  it("skips the loops when asked", () => {
    expect(parseCaptureArgs(["--skip-loops"]).skipLoops).toBe(true);
  });

  it("rejects a page it does not know, or none", () => {
    expect(() => parseCaptureArgs(["--page", "faq"])).toThrow(
      "--page takes home, article, help, home-2025, not faq",
    );
    expect(() => parseCaptureArgs(["--page"])).toThrow(
      "--page takes home, article, help, home-2025, not nothing",
    );
  });

  it("captures the 2025 homepage on its own", () => {
    expect(parseCaptureArgs(["--page", "home-2025"]).pages).toEqual(["home-2025"]);
  });

  it("rejects an argument it does not know", () => {
    expect(() => parseCaptureArgs(["--loops"])).toThrow("Unknown argument --loops");
  });
});
