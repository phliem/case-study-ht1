import { describe, expect, it } from "vitest";
import { capturedOn } from "./capturedOn";

describe("capturedOn", () => {
  it("names one day when every capture was taken on it", () => {
    expect(capturedOn(["2026-10-01T09:00:00.000Z", "2026-10-01T18:30:00.000Z"])).toBe(
      "on 1 October 2026",
    );
  });

  it("names the first and last days when the captures span several", () => {
    expect(capturedOn(["2026-10-02T10:00:00.000Z", "2026-10-01T09:00:00.000Z"])).toBe(
      "between 1 October 2026 and 2 October 2026",
    );
  });

  it("counts days in London time", () => {
    expect(capturedOn(["2026-10-01T23:30:00.000Z"])).toBe("on 2 October 2026");
  });

  it("refuses an empty list", () => {
    expect(() => capturedOn([])).toThrow("There are no captures to date");
  });
});
