import { describe, expect, it } from "vitest";
import { fixtureBody, fixtureBytes, fixtureName } from "./apiFixtures";

describe("fixtureName", () => {
  it("names a call by its method and path, and tells apart calls that differ in method or query", () => {
    const name = fixtureName("GET", "https://api.ht1.uk/v2/appointments/location_summaries?a=1");
    expect(name).toMatch(/^get-v2-appointments-location-summaries-[0-9a-f]{16}\.json$/);
    expect(
      fixtureName("GET", "https://api.ht1.uk/v2/appointments/location_summaries?a=2"),
    ).not.toBe(name);
    expect(fixtureName("POST", "https://api.ht1.uk/v2/x")).not.toBe(
      fixtureName("GET", "https://api.ht1.uk/v2/x"),
    );
  });
});

describe("fixtureBody", () => {
  it("keeps JSON readable and everything else as base64, and gives back the same bytes", () => {
    const json = Buffer.from('{"count":2}');
    expect(fixtureBody("application/json; charset=utf-8", json)).toEqual({ json: { count: 2 } });
    expect(fixtureBytes(fixtureBody("application/json", json))).toEqual(json);
    const image = Buffer.from([0, 1, 2, 255]);
    expect(fixtureBody("image/png", image)).toEqual({ base64: "AAEC/w==" });
    expect(fixtureBytes(fixtureBody("image/png", image))).toEqual(image);
  });
});
