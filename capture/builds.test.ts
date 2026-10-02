import { describe, expect, it } from "vitest";
import { BUILDS, commitSource } from "./builds";

const FULL = "d914fbe7db53acc671025f4c8f67f6e4ae38587f";

describe("commitSource", () => {
  it("exports a commit the sanny clone has from the clone", () => {
    expect(commitSource("0a143c6820", true)).toBe("clone");
    expect(commitSource("1e021d8370^", true)).toBe("clone");
    expect(commitSource(FULL, true)).toBe("clone");
  });

  it("fetches a commit the clone lacks when it is pinned by full SHA", () => {
    expect(commitSource(FULL, false)).toBe("fetch");
  });

  it("stops on a short or relative ref the clone lacks", () => {
    expect(() => commitSource("d914fbe7db", false)).toThrow(
      "d914fbe7db is not in the sanny clone at",
    );
    expect(() => commitSource("1e021d8370^", false)).toThrow(
      "only a full 40-character SHA can be fetched",
    );
  });
});

describe("BUILDS", () => {
  it("pins the 2025 homepage by full SHA, the only form a fetch can ask for", () => {
    expect(BUILDS["home-2025"]).toEqual({ name: "home-2025", commit: FULL, port: 3065 });
  });
});
