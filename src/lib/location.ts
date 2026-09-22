import { z } from "zod";

// Profile location. Persisted columns are public.profiles
// location_city, location_region, location_country — not a second store.
// Composed label is city, region, country: "Austin, TX, US".
// Clear writes null to all three. Copy lives here, not in JSX.

export const LOCATION = {
  title: "Location",
  helper: "City, region, and country.",
  empty: "Add a location",
  searchLabel: "Search places",
  searchPlaceholder: "Search for a city",
  clear: "Remove location",
  noMatches: "No places match.",
  signedOut: "Sign in to save a location.",
  invalid: "Choose a place from the list.",
  saveFailed: "Location could not be saved.",
  clearFailed: "Location could not be removed.",
  searchMin: 2,
  searchLimit: 8,
} as const;

export const locationPlaceSchema = z.object({
  city: z.string().trim().min(1).max(80),
  region: z.string().trim().min(1).max(80),
  country: z.string().trim().length(2),
});

export type LocationPlace = z.infer<typeof locationPlaceSchema>;

export type ProfileLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

export const EMPTY_PROFILE_LOCATION: ProfileLocation = {
  city: null,
  region: null,
  country: null,
};

export function placeKey(place: Pick<LocationPlace, "city" | "region" | "country">): string {
  return `${place.country}\u001f${place.region}\u001f${place.city}`;
}

/** City, region, country. Empty parts drop out. All empty is "". */
export function composeLocationLabel(
  city: string | null | undefined,
  region: string | null | undefined,
  country: string | null | undefined,
): string {
  return [city, region, country]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(", ");
}
