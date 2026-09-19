import { HOUSE_MODULE_CLASS, HOUSE_SECTION_AIR_CLASS } from "@/lib/house-shell";
import { aggregationPath } from "@/lib/workspace";

// Team Channels card + detail — Filmhub IA (plate · tags · name · meta;
// story + meta rail) on house Aggregation tokens. White page, grey plates,
// hairline cards. No Filmhub dark, purple, or orange map.

export const CHANNELS_HREF = aggregationPath("channels");

export const CHANNEL_CARD_CLASS =
  "flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-hairline bg-surface p-[var(--space-4)] shadow-none transition-colors hover:bg-surface-muted/60";

export const CHANNEL_PLATE_CLASS =
  "flex aspect-[3/2] w-full items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted t-title text-ink-2";

export const CHANNEL_TAGS_CLASS = "flex flex-wrap gap-[var(--space-2)]";

export const CHANNEL_NAME_CLASS = "t-heading text-ink";

export const CHANNEL_META_CLASS = "t-body-sm text-ink-3 line-clamp-3";

export const CHANNEL_GRID_CLASS =
  "grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export const CHANNEL_DETAIL_STACK_CLASS = `flex flex-col ${HOUSE_SECTION_AIR_CLASS}`;

export const CHANNEL_DETAIL_LAYOUT_CLASS =
  "flex flex-col gap-[var(--space-8)] lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-[var(--space-10)]";

export const CHANNEL_DETAIL_STORY_CLASS = "flex min-w-0 flex-col gap-[var(--space-6)]";

export const CHANNEL_DETAIL_RAIL_CLASS = `${HOUSE_MODULE_CLASS} flex flex-col gap-[var(--space-6)] p-[var(--space-4)]`;

export const CHANNEL_DETAIL_RAIL_PLATE_CLASS =
  "flex aspect-[3/2] w-full items-center justify-center rounded-[var(--radius-lg)] bg-surface t-title text-ink-2";

export const CHANNEL_DETAIL_SECTION_TITLE_CLASS = "t-body font-medium text-ink";

export const CHANNEL_DETAIL_META_CLASS = "t-body-sm text-ink-3";
