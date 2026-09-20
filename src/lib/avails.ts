import {
  TITLES_LANDSCAPE_ART_CLASS,
  TITLES_ROW_NAME_CLASS,
  catalogStillSrc,
} from "@/lib/titles-catalog";
import { staffPath } from "@/lib/workspace";

// Staff /avails. Adam lock avails-grid-3 (B): 3-wide landscape tile grid
// on desktop, 1-wide stack of the same tile on phone. Shared Titles
// landscape art + quiet title — no Avails-only card, no
// StatusProgressTrack, no territory matrix. Titles with status = live
// (Approved) only.

export const AVAILS_HREF = staffPath("avails");

export const AVAILS_PAGE = {
  title: "Avails",
  empty: "No Approved titles.",
  truncated: (n: number) =>
    `More than ${n} Approved titles. The first ${n} are shown.`,
} as const;

export const AVAILS_GRID_CLASS =
  "grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3";

export const AVAILS_TILE_CLASS = "flex flex-col gap-[var(--space-2)]";

export const AVAILS_TILE_ART_CLASS =
  `${TITLES_LANDSCAPE_ART_CLASS} rounded-[var(--radius-lg)]`;

export const AVAILS_TILE_TITLE_CLASS = TITLES_ROW_NAME_CLASS;

export const AVAILS_EMPTY_CLASS =
  "overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-4)]";

export type AvailsTile = {
  id: string;
  href: string;
  title: string;
  stillUrl: string | null;
};

export function availsTitleHref(titleId: string): string {
  return staffPath("gc/titles", titleId);
}

export function toAvailsTile(
  title: { id: string; title: string },
  bannerUrl: string | null | undefined,
): AvailsTile {
  return {
    id: title.id,
    href: availsTitleHref(title.id),
    title: title.title,
    stillUrl: catalogStillSrc(bannerUrl),
  };
}
