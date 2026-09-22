import "server-only";

import placeRecords from "@/lib/location-places.json";
import { LOCATION, placeKey, type LocationPlace } from "@/lib/location";

// One place list. Natural Earth public-domain 10m populated places:
// name, adm1name, iso_a2, pop_max. Rows without a region or a
// two-letter ISO country are omitted. US adm1name is stored as the
// postal abbreviation (Texas → TX) so the label reads "Austin, TX, US".
// regionName keeps the full admin name for search only.
// No Mapbox, Google, or API key. Search is in-process.

type PlaceRecord = LocationPlace & {
  pop: number;
  regionName?: string;
};

const PLACES = placeRecords as PlaceRecord[];

const BY_KEY = new Map<string, PlaceRecord>();
for (const place of PLACES) {
  BY_KEY.set(placeKey(place), place);
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function collapse(value: string): string {
  return fold(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function haystack(place: PlaceRecord): string {
  return collapse([place.city, place.region, place.regionName, place.country].filter(Boolean).join(" "));
}

export function isKnownPlace(place: LocationPlace): boolean {
  return BY_KEY.has(placeKey(place));
}

/** In-process typeahead. Short queries and oversized input return nothing. */
export function searchPlaces(query: string, limit = LOCATION.searchLimit): LocationPlace[] {
  const q = collapse(query);
  if (q.length < LOCATION.searchMin || q.length > 80) return [];
  const cap = Math.max(1, Math.min(limit, LOCATION.searchLimit));
  const hits: { place: PlaceRecord; score: number }[] = [];
  for (const place of PLACES) {
    const city = collapse(place.city);
    const stack = haystack(place);
    let score = 0;
    if (city === q) score = 100;
    else if (city.startsWith(q)) score = 80;
    else if (city.includes(q)) score = 60;
    else if (stack.includes(q)) score = 40;
    else {
      const tokens = q.split(" ").filter((token) => token.length > 0);
      if (tokens.length > 1 && tokens.every((token) => stack.includes(token))) {
        score = city.startsWith(tokens[0] ?? "") ? 50 : 30;
      }
    }
    if (score === 0) continue;
    hits.push({ place, score });
  }
  hits.sort((a, b) => b.score - a.score || b.place.pop - a.place.pop || a.place.city.localeCompare(b.place.city));
  return hits.slice(0, cap).map(({ place }) => ({
    city: place.city,
    region: place.region,
    country: place.country,
  }));
}
