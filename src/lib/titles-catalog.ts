import { HOUSE_FILTER_ON_CLASS } from "@/lib/house-shell";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";

// Client `/titles` catalog copy and list helpers. Lives in lib/, not JSX.
// One list, every org-owned title, every existing title.status. Do not invent
// statuses or a second catalog. Landscape-thumb rows in the house shell —
// not the poster 5-up. Status pills stay greyscale ink; Live uses the
// ink-selected fill. Sporty Blue stays on Add Title.

export const TITLES_CATALOG = {
  title: "Titles",
  addTitle: "Add Title",
  searchPlaceholder: "Search titles...",
  statusFilterLabel: "Filter by status",
  statusAll: "All",
  empty: "No titles yet.",
  emptyCatalog: "The catalog is empty.",
  emptyCanOperate: "Add your first title to begin building your catalog.",
  emptyReadOnly: "Titles will appear here once they're added.",
  searchMiss: (q: string) => `No titles match “${q}”.`,
  statusMiss: "No titles match this status.",
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

/**
 * Landscape still only. Banner is the horizontal asset; a poster is not
 * force-cropped into 16:9. Missing banner → muted placeholder, not a fake still.
 */
export function catalogStillSrc(
  bannerUrl: string | null | undefined,
  _posterUrl?: string | null,
): string | null {
  return bannerUrl || null;
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

/**
 * Product-true status lenses. submitted + in_delivery share the founder
 * "Submitted" label, so one chip covers both. No Upcoming / In progress.
 */
export type CatalogStatusFilter =
  | "all"
  | "draft"
  | "submitted"
  | "in_review"
  | "live"
  | "takedown_requested"
  | "taken_down";

export const CATALOG_STATUS_FILTERS: { key: CatalogStatusFilter; label: string }[] = [
  { key: "all", label: TITLES_CATALOG.statusAll },
  { key: "draft", label: TITLE_STATUS_LABELS.draft },
  { key: "submitted", label: TITLE_STATUS_LABELS.submitted },
  { key: "in_review", label: TITLE_STATUS_LABELS.in_review },
  { key: "live", label: TITLE_STATUS_LABELS.live },
  { key: "takedown_requested", label: TITLE_STATUS_LABELS.takedown_requested },
  { key: "taken_down", label: TITLE_STATUS_LABELS.taken_down },
];

export function parseCatalogStatusFilter(v: string | undefined): CatalogStatusFilter {
  return CATALOG_STATUS_FILTERS.some((f) => f.key === v) ? (v as CatalogStatusFilter) : "all";
}

export function filterCatalogByStatus<T extends { status: string }>(
  rows: T[],
  status: CatalogStatusFilter,
): T[] {
  if (status === "all") return rows;
  if (status === "submitted") {
    return rows.filter((r) => r.status === "submitted" || r.status === "in_delivery");
  }
  return rows.filter((r) => r.status === status);
}

export function catalogFilterHref(q: string, status: CatalogStatusFilter): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return qs ? `/titles?${qs}` : "/titles";
}
