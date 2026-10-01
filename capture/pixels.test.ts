import { describe, expect, it } from "vitest";
import { meanAbsoluteDifference } from "./pixels";

describe("meanAbsoluteDifference", () => {
  it("is 0 for identical images", () => {
    const image = Uint8Array.from([10, 20, 30, 40]);
    expect(meanAbsoluteDifference(image, image.slice())).toBe(0);
  });

  it("averages the per-byte difference", () => {
    expect(meanAbsoluteDifference(Uint8Array.from([0, 10]), Uint8Array.from([4, 4]))).toBe(5);
  });

  it("refuses images of different sizes", () => {
    expect(() => meanAbsoluteDifference(new Uint8Array(4), new Uint8Array(8))).toThrow(
      "Images differ in size",
    );
  });
});
