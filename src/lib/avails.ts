import { catalogStillSrc } from "@/lib/titles-catalog";

// Staff /avails. Layout B: 3-wide desktop grid of Approved titles
// (`status = live`). Shared Titles landscape art + quiet title. No
// progress track, no territory matrix, no Avails-only card chrome.

export const AVAILS_HREF = "/avails";

export const AVAILS_PAGE = {
  title: "Avails",
  empty: "No approved titles yet.",
  truncated: (n: string) => `More than ${n} approved titles. The first ${n} are shown.`,
} as const;

// Phone 1-wide · desktop 3-wide. House 16 between tiles.
export const AVAILS_GRID_CLASS = "grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3";

export type AvailsTile = {
  id: string;
  href: string;
  title: string;
  stillUrl: string | null;
};

export function availsTitleHref(titleId: string): string {
  return `/gc/titles/${titleId}`;
}

export function availsTilesFromRows(
  rows: { id: string; title: string; bannerUrl?: string | null }[],
): AvailsTile[] {
  return rows.map((row) => ({
    id: row.id,
    href: availsTitleHref(row.id),
    title: row.title,
    stillUrl: catalogStillSrc(row.bannerUrl),
  }));
}
