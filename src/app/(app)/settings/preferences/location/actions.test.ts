import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { revalidatePath } from "next/cache";
import { LOCATION } from "@/lib/location";
import { SETTINGS } from "@/lib/settings";
import {
  clearProfileLocation,
  loadProfileLocation,
  saveProfileLocation,
  searchProfilePlaces,
} from "./actions";

const USER = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "ada@example.com", name: "Ada" };

function ctx() {
  return {
    user: USER,
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function locationClient({
  row = { location_city: null, location_region: null, location_country: null },
  readError = null,
  updateError = null,
  updated = row,
}: {
  row?: {
    location_city: string | null;
    location_region: string | null;
    location_country: string | null;
  } | null;
  readError?: { message: string } | null;
  updateError?: { message: string } | null;
  updated?: {
    location_city: string | null;
    location_region: string | null;
    location_country: string | null;
  } | null;
} = {}) {
  const readMaybe = vi.fn(async () => ({ data: row, error: readError }));
  const eqSelect = vi.fn(() => ({ maybeSingle: readMaybe }));
  const select = vi.fn(() => ({ eq: eqSelect }));
  const updateMaybe = vi.fn(async () => ({ data: updated, error: updateError }));
  const selectAfter = vi.fn(() => ({ maybeSingle: updateMaybe }));
  const eqUpdate = vi.fn(() => ({ select: selectAfter }));
  const update = vi.fn(() => ({ eq: eqUpdate }));
  const from = vi.fn((table: string) => {
    if (table !== "profiles") throw new Error(`unexpected from(${table})`);
    return { select, update };
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, update, eqUpdate };
}

describe("profile location actions", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("loads the three profile columns", async () => {
    locationClient({
      row: { location_city: "Austin", location_region: "TX", location_country: "US" },
    });
    await expect(loadProfileLocation()).resolves.toEqual({
      city: "Austin",
      region: "TX",
      country: "US",
    });
  });

  it("returns an empty location when the profile row is missing", async () => {
    locationClient({ row: null });
    await expect(loadProfileLocation()).resolves.toEqual({
      city: null,
      region: null,
      country: null,
    });
  });

  it("writes a known place and revalidates Preferences", async () => {
    const client = locationClient({
      updated: { location_city: "Austin", location_region: "TX", location_country: "US" },
    });
    const res = await saveProfileLocation({ city: "Austin", region: "TX", country: "US" });
    expect(res.error).toBeUndefined();
    expect(res.location).toEqual({ city: "Austin", region: "TX", country: "US" });
    expect(client.update).toHaveBeenCalledWith({
      location_city: "Austin",
      location_region: "TX",
      location_country: "US",
    });
    expect(client.eqUpdate).toHaveBeenCalledWith("id", USER.id);
    expect(revalidatePath).toHaveBeenCalledWith(SETTINGS.preferencesHref);
    expect(revalidatePath).toHaveBeenCalledWith(SETTINGS.locationHref);
  });

  it("rejects a place that is not in the list and does not write", async () => {
    const client = locationClient();
    const res = await saveProfileLocation({ city: "Austin", region: "Texas", country: "US" });
    expect(res.error).toBe(LOCATION.invalid);
    expect(client.update).not.toHaveBeenCalled();
  });

  it("clears all three columns together", async () => {
    const client = locationClient({
      updated: { location_city: null, location_region: null, location_country: null },
    });
    const res = await clearProfileLocation();
    expect(res.error).toBeUndefined();
    expect(res.location).toEqual({ city: null, region: null, country: null });
    expect(client.update).toHaveBeenCalledWith({
      location_city: null,
      location_region: null,
      location_country: null,
    });
  });

  it("searches only for a signed-in user", async () => {
    const hits = await searchProfilePlaces("Austin");
    expect(hits).toContainEqual({ city: "Austin", region: "TX", country: "US" });
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(searchProfilePlaces("Austin")).resolves.toEqual([]);
    await expect(saveProfileLocation({ city: "Austin", region: "TX", country: "US" })).resolves.toEqual({
      error: LOCATION.signedOut,
    });
    expect(createClient).not.toHaveBeenCalled();
  });
});
