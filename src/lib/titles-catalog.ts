import {
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
  HOUSE_PERIOD_SELECTED_CLASS,
} from "@/lib/house-shell";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";

// Client `/titles` catalog copy and list helpers. Lives in lib/, not JSX.
// Active catalog by default (Archived excluded). Archived is a first-class
// status filter on the existing title.status model. Soft-deleted titles are
// omitted. Do not invent a second catalog. Landscape stills in the house
// shell — not the poster 5-up. Phone stacks full-width 16:9 art over the
// title. Desktop keeps the horizontal landscape-thumb row. Type matches the
// Dashboard register: Geist, black sentence-case, quiet ink selected.
// Sporty Blue stays on Add Title.

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

// Same steps as Dashboard identity: phone heading, desktop title.
export const TITLES_TITLE_MOBILE_CLASS = "t-heading text-ink md:hidden";
export const TITLES_TITLE_DESKTOP_CLASS = "t-title text-ink max-md:hidden";

// Phone header + — house 44 hit, Sporty Blue fill. Not a list FAB.
export const TITLES_ADD_ICON_CLASS =
  "size-[44px] min-h-[44px] min-w-[44px] px-0 py-0";

export const TITLES_ROW_NAME_CLASS = "t-body font-medium text-ink md:truncate";

// Shared 16:9 landscape art surface. Titles rows constrain it to 160px on
// desktop; Avails tiles keep it full-cell. Do not invent a second crop.
export const TITLES_LANDSCAPE_ART_CLASS =
  "relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center";

export const TITLES_THUMB_CLASS =
  `${TITLES_LANDSCAPE_ART_CLASS} md:w-[160px] md:rounded-[var(--radius-lg)]`;

export const TITLES_LIST_CLASS =
  "titles-catalog-list flex flex-col gap-[var(--space-4)] md:gap-0 md:overflow-hidden md:rounded-[var(--radius-lg)] md:border md:border-hairline md:bg-surface";

export const TITLES_LIST_ROW_CLASS =
  "flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface md:flex-row md:items-center md:gap-[var(--space-4)] md:rounded-none md:border-0 md:border-b md:px-[var(--space-4)] md:py-[var(--space-4)] md:last:border-b-0";

export const TITLES_ROW_META_CLASS =
  "flex flex-col gap-[var(--space-1)] px-[var(--space-4)] py-[var(--space-4)] md:min-w-0 md:flex-1 md:flex-row md:items-center md:justify-between md:gap-[var(--space-4)] md:p-0";

export const TITLES_ROW_COPY_CLASS = "flex min-w-0 flex-col gap-[var(--space-1)]";

// Staff /queue columns on the same row shell. Quiet meta — not a second list.
export const TITLES_ROW_STAFF_CLASS =
  "flex flex-col gap-[var(--space-1)] t-body-sm text-ink-3 md:flex-row md:items-center md:gap-[var(--space-6)]";

export const TITLES_ROW_STAFF_CELL_CLASS =
  "t-body-sm text-ink-3 md:w-[9.5rem] md:shrink-0 md:truncate";

// Dashboard top-pill grammar on desktop. Phone is the compact period trigger —
// not a wrapping ALL-CAPS chip wall.
export const TITLES_FILTER_PILL_CLASS =
  "rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";
export const TITLES_FILTER_PILL_ON_CLASS = HOUSE_FILTER_ON_CLASS;
export const TITLES_FILTER_PILL_OFF_CLASS = HOUSE_FILTER_OFF_CLASS;
export const TITLES_FILTER_DESKTOP_CLUSTER_CLASS =
  "hidden flex-wrap items-center gap-[var(--space-2)] md:flex";

export const TITLES_FILTER_PHONE_HOST_CLASS = "relative md:hidden";
export const TITLES_FILTER_PHONE_TRIGGER_CLASS =
  "flex cursor-pointer list-none items-center justify-between gap-[var(--space-2)] t-body-sm text-ink [&::-webkit-details-marker]:hidden";
export const TITLES_FILTER_PHONE_CHEVRON_CLASS = "size-4 shrink-0 text-ink-3";
export const TITLES_FILTER_PHONE_PANEL_CLASS =
  "absolute left-0 top-full z-20 mt-[var(--space-2)] flex min-w-[16rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";
export const TITLES_FILTER_PHONE_OPTION_CLASS =
  "flex w-full items-center px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink";
export const TITLES_FILTER_PHONE_OPTION_ON_CLASS = HOUSE_PERIOD_SELECTED_CLASS;

export function titlesFilterPhoneOptionClass(selected: boolean): string {
  return selected
    ? `${TITLES_FILTER_PHONE_OPTION_CLASS} ${TITLES_FILTER_PHONE_OPTION_ON_CLASS}`
    : TITLES_FILTER_PHONE_OPTION_CLASS;
}

export function titlesFilterPillClass(selected: boolean): string {
  return selected
    ? `${TITLES_FILTER_PILL_CLASS} ${TITLES_FILTER_PILL_ON_CLASS}`
    : `${TITLES_FILTER_PILL_CLASS} ${TITLES_FILTER_PILL_OFF_CLASS}`;
}

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
  "archived",
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
  | "taken_down"
  | "archived";

export const CATALOG_STATUS_FILTERS: { key: CatalogStatusFilter; label: string }[] = [
  { key: "all", label: TITLES_CATALOG.statusAll },
  { key: "draft", label: TITLE_STATUS_LABELS.draft },
  { key: "submitted", label: TITLE_STATUS_LABELS.submitted },
  { key: "in_review", label: TITLE_STATUS_LABELS.in_review },
  { key: "live", label: TITLE_STATUS_LABELS.live },
  { key: "takedown_requested", label: TITLE_STATUS_LABELS.takedown_requested },
  { key: "taken_down", label: TITLE_STATUS_LABELS.taken_down },
  { key: "archived", label: TITLE_STATUS_LABELS.archived },
];

export function parseCatalogStatusFilter(v: string | undefined): CatalogStatusFilter {
  return CATALOG_STATUS_FILTERS.some((f) => f.key === v) ? (v as CatalogStatusFilter) : "all";
}

export function catalogStatusFilterLabel(status: CatalogStatusFilter): string {
  return CATALOG_STATUS_FILTERS.find((f) => f.key === status)?.label ?? TITLES_CATALOG.statusAll;
}

export function filterCatalogByStatus<T extends { status: string }>(
  rows: T[],
  status: CatalogStatusFilter,
): T[] {
  if (status === "all") {
    return rows.filter((r) => r.status !== "archived");
  }
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
