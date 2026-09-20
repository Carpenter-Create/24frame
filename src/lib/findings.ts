import {
  HOUSE_PHONE_STACK_CLASS,
  HOUSE_PHONE_WRAP_CLASS,
} from "@/lib/house-phone-stack";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { aggregationPath, staffPath } from "@/lib/workspace";

// Findings copy + labels (§19 attention queue). Copy lives in lib/, not JSX.

export const FINDING_SEVERITY_LABEL: Record<"high" | "low", string> = {
  high: "Required",
  low: "Recommended",
};

export const FINDING_ROW_CLASS =
  `${HOUSE_PHONE_STACK_CLASS} gap-1 t-body-sm md:flex-row md:items-center md:justify-between md:gap-3`;

export const FINDING_MESSAGE_CLASS = `${HOUSE_PHONE_WRAP_CLASS} text-ink-2`;

export const FINDING_SEVERITY_CLASS =
  `${HOUSE_PHONE_WRAP_CLASS} t-label text-ink-3 md:shrink-0`;

// Attention = the single client-side findings/health overview.
export const ATTENTION_TITLE = "Attention";
export const ATTENTION_HREF = aggregationPath("attention");
export const CATALOG_HEALTH_TITLE = ATTENTION_TITLE;
export const CATALOG_HEALTH_SUBTITLE = "What needs your attention across your catalog.";
export const CATALOG_HEALTH_EMPTY = "Nothing needs your attention right now.";
export const CATALOG_HEALTH_TRUNCATED = `Showing the first ${UNPAGINATED_MAX} open findings. More exist — this list is not complete.`;

export function catalogHealthCountLabel(n: number): string {
  return n === 1 ? "1 finding" : `${n} findings`;
}

/** Findings resolve on the title — staff stay on the GC title path. */
export function catalogHealthTitleHref(titleId: string, gcWide: boolean): string {
  return gcWide ? staffPath("gc/titles", titleId) : aggregationPath("titles", titleId);
}

// Home Do next lists finding + draft rows; Catalog Health owns the full queue.
export const DASHBOARD_ATTENTION_CLEAR = "Your catalog is in good standing.";
export function dashboardAttentionSummary(titleCount: number): string {
  return titleCount === 1
    ? "1 title needs your attention."
    : `${titleCount} titles need your attention.`;
}
