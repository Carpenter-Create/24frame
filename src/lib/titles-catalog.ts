import { HOUSE_FILTER_ON_CLASS } from "@/lib/house-shell";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";

// Client `/titles` catalog copy and list helpers. Lives in lib/, not JSX.
// One list, every org-owned title, every existing title.status. Do not invent
// statuses or a second catalog. Desktop is the 5-up still grid; phone is a
// hairline list. Status pills stay greyscale ink; Live uses the ink-selected fill.

export const TITLES_CATALOG = {
  title: "Titles",
  addTitle: "Add Title",
  searchPlaceholder: "Search titles...",
  empty: "No titles yet.",
  emptyCatalog: "The catalog is empty.",
  emptyCanOperate: "Add your first title to begin building your catalog.",
  emptyReadOnly: "Titles will appear here once they're added.",
  searchMiss: (q: string) => `No titles match “${q}”.`,
  searchMissHint: "Try a different search.",
  inCatalog: (n: string) => `${n} in catalog`,
} as const;

export const TITLE_STATUS_PILL_IDLE_CLASS = "border border-hairline text-ink-2";

export const TITLE_STATUS_PILL_LIVE_CLASS = HOUSE_FILTER_ON_CLASS;

/** Greyscale ink pill. Live is the ink-selected fill — no accent, no loud packs. */
export function catalogStatusPillClass(status: TitleStatus | string): string {
  return status === "live" ? TITLE_STATUS_PILL_LIVE_CLASS : TITLE_STATUS_PILL_IDLE_CLASS;
}

/**
 * Catalog size chrome. A truncated read is a floor, not a total — same honesty
 * as dashboardCatalogValue ("500+"): never invent the missing remainder.
 */
export function catalogCountValue(count: number, isPartial: boolean): string {
  return isPartial ? `${count}+` : String(count);
}

export function catalogCountLabel(count: number, isPartial: boolean): string {
  return TITLES_CATALOG.inCatalog(catalogCountValue(count, isPartial));
}

/** Existing title.status values, in lifecycle order. Not a new vocabulary. */
export const CATALOG_LIFECYCLE_STATES = [
  "draft",
  "submitted",
  "in_review",
  "in_delivery",
  "live",
  "takedown_requested",
  "taken_down",
] as const satisfies readonly TitleStatus[];

export function catalogStatusMark(status: TitleStatus): string {
  return TITLE_STATUS_LABELS[status];
}

/** Real promotional art only. Poster first (portrait); else banner; else nothing. */
export function catalogStillSrc(
  bannerUrl: string | null | undefined,
  posterUrl: string | null | undefined,
): string | null {
  return posterUrl || bannerUrl || null;
}

/**
 * Calendar year from titles.release_date (YYYY-MM-DD).
 * Null when unset or not a calendar date — never invent, never fall back to created_at.
 */
export function catalogReleaseYear(
  releaseDate: string | null | undefined,
): string | null {
  if (!releaseDate) return null;
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(releaseDate);
  return match?.[1] ?? null;
}
