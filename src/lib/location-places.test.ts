import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LOCATION } from "./location";
import { isKnownPlace, searchPlaces } from "./location-places";

type PlaceFileRecord = { city: string; region: string; country: string };

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

  it("resolves worldwide places, including a territory", () => {
    expect(searchPlaces("London")).toContainEqual({ city: "London", region: "England", country: "GB" });
    expect(searchPlaces("Tokyo")).toContainEqual({ city: "Tokyo", region: "Tokyo", country: "JP" });
    expect(searchPlaces("São Paulo")).toContainEqual({
      city: "São Paulo",
      region: "São Paulo",
      country: "BR",
    });
    expect(searchPlaces("Sao Paulo")).toContainEqual({
      city: "São Paulo",
      region: "São Paulo",
      country: "BR",
    });
    expect(searchPlaces("San Juan")).toContainEqual({
      city: "San Juan",
      region: "San Juan",
      country: "PR",
    });
    expect(isKnownPlace({ city: "Hong Kong", region: "Hong Kong", country: "HK" })).toBe(true);
    expect(searchPlaces("Hong Kong")[0]).toEqual({
      city: "Hong Kong",
      region: "Hong Kong",
      country: "HK",
    });
  });

  it("covers countries and territories beyond the old Natural Earth subset", () => {
    const records = JSON.parse(readFileSync("src/lib/location-places.json", "utf8")) as PlaceFileRecord[];
    const countries = new Set(records.map((record) => record.country));
    expect(records.length).toBeGreaterThan(50_000);
    expect(countries.size).toBeGreaterThan(230);
    expect(countries.has("GB")).toBe(true);
    expect(countries.has("JP")).toBe(true);
    expect(countries.has("BR")).toBe(true);
    expect(countries.has("PR")).toBe(true);
    expect(countries.has("HK")).toBe(true);
    expect(countries.has("GI")).toBe(true);
  });

  it("keeps the dataset server-only and off the client search pane", () => {
    const places = readFileSync("src/lib/location-places.ts", "utf8");
    const client = readFileSync("src/components/settings/location-search.tsx", "utf8");
    const copy = readFileSync("src/lib/location.ts", "utf8");
    expect(places).toContain('import "server-only"');
    expect(places).toContain("GeoNames");
    expect(places).toContain("cities5000");
    expect(places).toContain("CC BY 4.0");
    expect(client).not.toContain("location-places");
    expect(client).not.toContain("truncate");
    expect(client).not.toContain("Remove location");
    expect(copy).not.toContain("location-places");
    expect(copy).not.toContain("MAPBOX");
    expect(places).not.toContain("MAPBOX");
    expect(places).not.toContain("GOOGLE");
  });
});
