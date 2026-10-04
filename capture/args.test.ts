import { describe, expect, it } from "vitest";
import { parseCaptureArgs } from "./args";

describe("parseCaptureArgs", () => {
  it("captures every page with loops by default", () => {
    expect(parseCaptureArgs([])).toEqual({ pages: ["home", "article", "help"], skipLoops: false });
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
      "--page takes home, article, help, not faq",
    );
    expect(() => parseCaptureArgs(["--page"])).toThrow(
      "--page takes home, article, help, not nothing",
    );
  });

  it("rejects an argument it does not know", () => {
    expect(() => parseCaptureArgs(["--loops"])).toThrow("Unknown argument --loops");
  });
});
