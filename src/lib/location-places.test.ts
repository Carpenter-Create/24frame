import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LOCATION } from "./location";
import { isKnownPlace, searchPlaces } from "./location-places";

describe("location place search", () => {
  it("resolves Austin as city, region, and country", () => {
    const hits = searchPlaces("Austin");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(LOCATION.searchLimit);
    expect(hits).toContainEqual({ city: "Austin", region: "TX", country: "US" });
    expect(isKnownPlace({ city: "Austin", region: "TX", country: "US" })).toBe(true);
  });

  it("matches a full state name against the stored abbreviation", () => {
    const hits = searchPlaces("Austin Texas");
    expect(hits).toContainEqual({ city: "Austin", region: "TX", country: "US" });
  });

  it("refuses short queries, unknown places, and the long state name as a stored region", () => {
    expect(searchPlaces("a")).toEqual([]);
    expect(searchPlaces("   ")).toEqual([]);
    expect(searchPlaces("zzzzqq")).toEqual([]);
    expect(isKnownPlace({ city: "Austin", region: "Texas", country: "US" })).toBe(false);
    expect(isKnownPlace({ city: "Not A City", region: "TX", country: "US" })).toBe(false);
  });

  it("keeps the dataset server-only and off the client search pane", () => {
    const places = readFileSync("src/lib/location-places.ts", "utf8");
    const client = readFileSync("src/components/settings/location-search.tsx", "utf8");
    const copy = readFileSync("src/lib/location.ts", "utf8");
    expect(places).toContain('import "server-only"');
    expect(client).not.toContain("location-places");
    expect(client).not.toContain("truncate");
    expect(copy).not.toContain("location-places");
    expect(copy).not.toContain("MAPBOX");
    expect(places).not.toContain("MAPBOX");
    expect(places).not.toContain("GOOGLE");
  });
});
