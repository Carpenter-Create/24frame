"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  EMPTY_PROFILE_LOCATION,
  LOCATION,
  locationPlaceSchema,
  type LocationPlace,
  type ProfileLocation,
} from "@/lib/location";
import { isKnownPlace, searchPlaces } from "@/lib/location-places";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

const LOCATION_COLUMNS = "location_city, location_region, location_country";

function rowToLocation(row: {
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
}): ProfileLocation {
  return {
    city: row.location_city,
    region: row.location_region,
    country: row.location_country,
  };
}

function revalidateLocation() {
  revalidatePath(SETTINGS.preferencesHref);
  revalidatePath(SETTINGS.locationHref);
}

export async function loadProfileLocation(): Promise<ProfileLocation> {
  const ctx = await getOrgContext();
  if (!ctx) return { ...EMPTY_PROFILE_LOCATION };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(LOCATION_COLUMNS)
    .eq("id", ctx.user.id)
    .maybeSingle();
  if (error || !data) return { ...EMPTY_PROFILE_LOCATION };
  return rowToLocation(data);
}

/** Authenticated, in-process, capped. No external geo call. */
export async function searchProfilePlaces(query: unknown): Promise<LocationPlace[]> {
  const ctx = await getOrgContext();
  if (!ctx) return [];
  const parsed = z.string().max(80).safeParse(query);
  if (!parsed.success) return [];
  return searchPlaces(parsed.data);
}

export async function saveProfileLocation(
  input: unknown,
): Promise<{ error?: string; location?: ProfileLocation }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: LOCATION.signedOut };

  const parsed = locationPlaceSchema.safeParse(input);
  if (!parsed.success || !isKnownPlace(parsed.data)) return { error: LOCATION.invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      location_city: parsed.data.city,
      location_region: parsed.data.region,
      location_country: parsed.data.country,
    })
    .eq("id", ctx.user.id)
    .select(LOCATION_COLUMNS)
    .maybeSingle();
  if (error || !data) return { error: error?.message || LOCATION.saveFailed };

  revalidateLocation();
  return { location: rowToLocation(data) };
}

export async function clearProfileLocation(): Promise<{ error?: string; location?: ProfileLocation }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: LOCATION.signedOut };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      location_city: null,
      location_region: null,
      location_country: null,
    })
    .eq("id", ctx.user.id)
    .select(LOCATION_COLUMNS)
    .maybeSingle();
  if (error || !data) return { error: error?.message || LOCATION.clearFailed };

  revalidateLocation();
  return { location: rowToLocation(data) };
}
