import { UNPAGINATED_MAX } from "@/lib/list-bounds";

// Findings copy + labels (§19 attention queue). Copy lives in lib/, not JSX.

export const FINDING_SEVERITY_LABEL: Record<"high" | "low", string> = {
  high: "Required",
  low: "Recommended",
};

// Attention = the single client-side findings/health overview.
// Former Catalog Health route `/catalog-health` redirects here.
export const ATTENTION_TITLE = "Attention";
export const ATTENTION_HREF = "/attention";
export const CATALOG_HEALTH_HREF = "/catalog-health";
export const CATALOG_HEALTH_TITLE = ATTENTION_TITLE;
export const CATALOG_HEALTH_SUBTITLE = "What needs your attention across your catalog.";
export const CATALOG_HEALTH_EMPTY = "Nothing needs your attention right now.";
export const CATALOG_HEALTH_TRUNCATED = `Showing the first ${UNPAGINATED_MAX} open findings. More exist — this list is not complete.`;

export function catalogHealthCountLabel(n: number): string {
  return n === 1 ? "1 finding" : `${n} findings`;
}

/** Findings resolve on the title — staff stay on the GC title path. */
export function catalogHealthTitleHref(titleId: string, gcWide: boolean): string {
  return gcWide ? `/gc/titles/${titleId}` : `/titles/${titleId}`;
}

// Home Do next lists finding + draft rows; Catalog Health owns the full queue.
export const DASHBOARD_ATTENTION_CLEAR = "Your catalog is in good standing.";
export function dashboardAttentionSummary(titleCount: number): string {
  return titleCount === 1
    ? "1 title needs your attention."
    : `${titleCount} titles need your attention.`;
}
