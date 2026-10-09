import { describe, expect, it } from "vitest";
import { parseCaptureArgs } from "./args";

describe("parseCaptureArgs", () => {
  it("captures every page with loops by default", () => {
    expect(parseCaptureArgs([])).toEqual({
      pages: ["home", "article", "help", "carenav", "search", "gp", "booking", "clinician"],
      versions: ["before", "after"],
      skipLoops: false,
    });
  });

  it("captures only the pages asked for, in page order", () => {
    expect(parseCaptureArgs(["--page", "help", "--page=article"]).pages).toEqual([
      "article",
      "help",
    ]);
  });

  it("captures only the versions asked for, in version order", () => {
    expect(parseCaptureArgs(["--version", "after"]).versions).toEqual(["after"]);
    expect(parseCaptureArgs(["--version=after", "--version", "before"]).versions).toEqual([
      "before",
      "after",
    ]);
  });

  it("rejects a version it does not know, or none", () => {
    expect(() => parseCaptureArgs(["--version", "v2"])).toThrow(
      "--version takes before, after, not v2",
    );
    expect(() => parseCaptureArgs(["--version"])).toThrow(
      "--version takes before, after, not nothing",
    );
  });

  it("skips the loops when asked", () => {
    expect(parseCaptureArgs(["--skip-loops"]).skipLoops).toBe(true);
  });

  it("rejects a page it does not know, or none", () => {
    expect(() => parseCaptureArgs(["--page", "faq"])).toThrow(
      "--page takes home, article, help, carenav, search, gp, booking, clinician, not faq",
    );
    expect(() => parseCaptureArgs(["--page"])).toThrow(
      "--page takes home, article, help, carenav, search, gp, booking, clinician, not nothing",
    );
  });

  it("rejects an argument it does not know", () => {
    expect(() => parseCaptureArgs(["--loops"])).toThrow("Unknown argument --loops");
  });
});
