import { SOCIAL } from "@/lib/social";

// IMDb Phase 1: claim a person URL / nm id. No scrape, no licensed import.

export const SOCIAL_IMDB_NAME_HOST = "https://www.imdb.com/name";

const IMDB_ID = /\bnm\d{7,}\b/i;
const IMDB_PATH = /imdb\.com\/name\/(nm\d{7,})\b/i;

export function socialImdbNameId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const fromPath = text.match(IMDB_PATH)?.[1];
  const id = (fromPath ?? text.match(IMDB_ID)?.[0] ?? "").toLowerCase();
  return id || null;
}

export function socialImdbNameUrl(nameId: string): string {
  return `${SOCIAL_IMDB_NAME_HOST}/${nameId}/`;
}

export function parseSocialImdbInput(raw: string): {
  nameId: string | null;
  url: string | null;
  error: string | null;
} {
  const text = raw.trim();
  if (!text) return { nameId: null, url: null, error: null };
  const nameId = socialImdbNameId(text);
  if (!nameId) return { nameId: null, url: null, error: "invalid" };
  return { nameId, url: socialImdbNameUrl(nameId), error: null };
}

export function socialProfileImdbRowSummary(raw: string): string {
  const parsed = parseSocialImdbInput(raw);
  if (parsed.nameId) return parsed.nameId;
  const text = raw.trim();
  return text || SOCIAL.profile.imdbAdd;
}
