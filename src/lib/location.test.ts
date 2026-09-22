import { describe, expect, it } from "vitest";

import {
  composeLocationLabel,
  EMPTY_PROFILE_LOCATION,
  LOCATION,
  locationPlaceSchema,
  placeKey,
} from "./location";

describe("profile location label", () => {
  it("composes city, region, and country", () => {
    expect(composeLocationLabel("Austin", "TX", "US")).toBe("Austin, TX, US");
    expect(composeLocationLabel("  Austin ", " TX ", " US ")).toBe("Austin, TX, US");
  });

  it("drops empty parts and is blank when nothing is set", () => {
    expect(composeLocationLabel("Austin", null, "US")).toBe("Austin, US");
    expect(composeLocationLabel(null, null, null)).toBe("");
    expect(composeLocationLabel("", "  ", undefined)).toBe("");
    expect(EMPTY_PROFILE_LOCATION).toEqual({ city: null, region: null, country: null });
  });

  it("keys a place by country, region, and city", () => {
    expect(placeKey({ city: "Austin", region: "TX", country: "US" })).toBe("US\u001fTX\u001fAustin");
  });

  it("accepts a resolved place and rejects a partial one", () => {
    expect(locationPlaceSchema.safeParse({ city: "Austin", region: "TX", country: "US" }).success).toBe(true);
    expect(locationPlaceSchema.safeParse({ city: "Austin", region: "TX", country: "USA" }).success).toBe(false);
    expect(locationPlaceSchema.safeParse({ city: "", region: "TX", country: "US" }).success).toBe(false);
    expect(LOCATION.title).toBe("Location");
    expect(LOCATION.empty).toBe("Add a location");
    expect(LOCATION.clear).toBe("Remove location");
  });
});
