// Company-admin Dashboard craft classes. House tokens only — no RL orange,
// no invented px type. Hairline + air; no drop shadow.
// Period menu rematches the Mercury workspace switcher: quiet trigger,
// trailing Sporty Blue check, flush-left labels.
// House shell air: related gap 8 · card pad 16 · section air 24 · card 16.
// Shared with Social + Education via house-shell — no Dashboard-only tokens.
// Overview structure rematch — 24Frame nouns only.
// Period chrome (phone + desktop): unlabeled value + chevron on the org row.
// Period is chrome, not H1. Dominant read stays the $.
// Page title is black sentence-case. Section titles are t-heading ink.
// View-alt selected is Sporty Blue glyph weight, not a filled chip.
// Content-filter selected is ink #14171A + white type — not Sporty Blue fill.

import {
  HOUSE_CARD_PAD,
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
  HOUSE_MODULE_CLASS,
  HOUSE_RELATED_GAP_CLASS,
  HOUSE_SECTION_AIR_CLASS,
} from "@/lib/house-shell";

import {
  HOUSE_PAGE_SELECT_CHEVRON_CLASS,
  HOUSE_PAGE_SELECT_GROUP_CLASS,
  HOUSE_PAGE_SELECT_MENU_DESKTOP_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CLASS,
  HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS,
  HOUSE_PAGE_SELECT_OPTION_SELECTED_CLASS,
  HOUSE_PAGE_SELECT_PANEL_CLASS,
  HOUSE_PAGE_SELECT_SHEET_HOST_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS,
  housePageSelectOptionClass,
} from "@/lib/house-page-select";

// Shared card fill for paired rows (Net | Recent activity) and other modules.
// h-full + flex-col: stretch the surface; content stays top-aligned.
export const DASHBOARD_CARD_CLASS =
  `${HOUSE_MODULE_CLASS} dashboard-home-panel flex h-full flex-col overflow-hidden shadow-none`;

export const DASHBOARD_MODULE_CARD_CLASS = `${HOUSE_MODULE_CLASS} overflow-hidden shadow-none`;

export const DASHBOARD_CARD_PAD = HOUSE_CARD_PAD;

export const DASHBOARD_CARD_PAD_HERO = DASHBOARD_CARD_PAD;

export const DASHBOARD_CARD_PAD_LIST = DASHBOARD_CARD_PAD;

export const DASHBOARD_KICKER_CLASS = "t-label text-ink-3";

// RL Overview section titles: near-ink, heading weight, sentence case.
// Not a grey tracked ALL CAPS kicker. Meta/subcopy stays t-body-sm text-ink-3.
export const DASHBOARD_SECTION_TITLE_CLASS = "t-heading text-ink";

export const DASHBOARD_RELATED_GAP_CLASS = HOUSE_RELATED_GAP_CLASS;

export const DASHBOARD_SECTION_AIR_CLASS = HOUSE_SECTION_AIR_CLASS;

export const DASHBOARD_ROW_CLASS =
  "flex min-h-10 items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]";

// House ranked-row grade: circular mark · bold name · quiet meta · right $.
// Bars view-alt keeps the share track. List does not.
export const DASHBOARD_RANKED_TABLE_ROW_CLASS =
  "flex min-h-10 items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]";

export const DASHBOARD_RANKED_GRADE_ROW_CLASS = DASHBOARD_RANKED_TABLE_ROW_CLASS;

export const DASHBOARD_RANKED_MARK_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted t-data t-body-sm font-medium text-ink";

export const DASHBOARD_RANKED_NAME_CLASS = "t-body-sm font-medium text-ink";

export const DASHBOARD_RANKED_META_CLASS = "t-body-sm text-ink-3";

export const DASHBOARD_RANKED_SHARE_TRACK_CLASS =
  "h-2 min-w-16 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted";

export const DASHBOARD_ROW_LIST_CLASS = "divide-y divide-hairline border-t border-hairline";

export const DASHBOARD_RANKED_LIST_CLASS =
  "flex flex-col gap-[var(--space-2)] border-t border-hairline px-[var(--space-4)] py-[var(--space-4)]";

export const DASHBOARD_MONEY_CLASS = "t-data t-body-sm shrink-0 text-right text-ink";

export const DASHBOARD_HERO_VALUE_CLASS = "t-display t-data text-ink";

export const DASHBOARD_HERO_DELTA_CLASS = "t-body-sm text-ink-3";

export const DASHBOARD_HERO_ASOF_CLASS = "t-body-sm text-ink-3";

// Phone (`< md`) only. Desktop #328/#329 locks stay at md+.
export const DASHBOARD_MOBILE_BREAKPOINT_CLASS = "max-md";

export const DASHBOARD_ADMIN_CHROME_CLASS =
  "flex flex-row items-center justify-between gap-[var(--space-2)] md:flex-row md:items-start md:justify-between md:gap-[var(--space-6)]";

// Desktop: taller Net revenue left (3) · Recent activity glance right (2).
// One height pair — lg stretch + shared cell/card h-full. Phone (`< md`)
// stacks Revenue then Recent activity and stretches to the content column.
// items-start on a max-md flex-col is the cross-axis (width) and
// shrink-wraps tiles, leaving a right gutter. max-md:items-stretch
// fills the house page inset; heights stay content-sized (no equal
// height pair below lg). md grid keeps items-start; lg stretches.
// Licensing status is full-width under this pair, then Top performing.
export const DASHBOARD_ADMIN_OVERVIEW_CLASS =
  "grid w-full grid-cols-1 items-start gap-[var(--space-6)] max-md:flex max-md:w-full max-md:flex-col max-md:items-stretch lg:grid-cols-5 lg:items-stretch";

export const DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS = "h-full min-h-0 w-full";

export const DASHBOARD_ADMIN_HERO_REVENUE_CLASS =
  `${DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS} lg:col-span-3`;

export const DASHBOARD_ADMIN_HERO_ATTENTION_CLASS =
  `${DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS} lg:col-span-2`;

export const DASHBOARD_LICENSING_THUMB_CLASS =
  "relative aspect-[16/9] w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center";

// News media plate — full card width, 16:9 crop. Stacked above copy.
// Not the licensing side thumb (w-16). Card overflow clips the top radius.
export const DASHBOARD_NEWS_THUMB_CLASS =
  "relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center";

export const DASHBOARD_LICENSING_NEST_CLASS =
  "px-[var(--space-4)] py-[var(--space-3)]";

export const DASHBOARD_ACTIVITY_ROW_CLASS =
  "flex min-h-10 items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]";

export const DASHBOARD_ACTIVITY_AVATAR_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted t-body-sm text-ink-3";

export const DASHBOARD_ADMIN_PAIR_CLASS =
  "grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2";

// /news desktop: same stacked cards on the house pair grid. Home rail stays one column.
export const DASHBOARD_NEWS_HISTORY_LIST_CLASS = DASHBOARD_ADMIN_PAIR_CLASS;

export const DASHBOARD_VIEW_ALT_CLUSTER_CLASS =
  "flex items-center divide-x divide-hairline border border-hairline";

export const DASHBOARD_VIEW_ALT_BUTTON_CLASS =
  "flex size-8 items-center justify-center bg-transparent";

export const DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS = "text-accent";

export const DASHBOARD_VIEW_ALL_CLASS =
  "inline-flex items-center gap-[var(--space-2)] t-body-sm text-accent";

// Top performing pills — house separate rounded pills with gap.
// Active: ink fill + canvas label. Idle: muted fill + ink label.
// Not a segmented strip. Sporty Blue stays on View all / view-alt glyphs only.
export const DASHBOARD_TOP_PILL_CLUSTER_CLASS =
  "flex items-center gap-[var(--space-2)]";

export const DASHBOARD_TOP_PILL_BUTTON_CLASS =
  "rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";

export const DASHBOARD_TOP_PILL_BUTTON_ON_CLASS = HOUSE_FILTER_ON_CLASS;

export const DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS = HOUSE_FILTER_OFF_CLASS;

// Map unmount is taller than Titles/Platforms lists. Do not let the
// departing map become the scroll anchor (html scroll-behavior: smooth
// would ease /dashboard to top). Keep the pane ≥ Territories map frame
// (DASHBOARD_MAP_FRAME min-h-[340px] + pad) so map↔list does not collapse
// document height. Sitewide smooth scroll stays; only the swap helper
// suppresses it.
export const DASHBOARD_RANKED_PANE_MIN_HEIGHT_CLASS =
  "min-h-[calc(340px+2*var(--space-6))]";

export const DASHBOARD_RANKED_PANE_CLASS =
  `[overflow-anchor:none] ${DASHBOARD_RANKED_PANE_MIN_HEIGHT_CLASS}`;

// RL TerritoryMap Overview frame: Mercator 700×340 inside p-6. Not a mini stub.
export const DASHBOARD_MAP_FRAME_CLASS = "relative w-full min-h-[340px]";

export const DASHBOARD_MAP_PAD_CLASS = "p-[var(--space-6)]";

export const DASHBOARD_LEGEND_CLASS =
  "flex items-center gap-[var(--space-2)] t-label text-ink-3";

export const DASHBOARD_CHOROPLETH_SWATCH_CLASS = "h-2 w-5 rounded-[var(--radius-sm)]";

// Shared admin column (hero + Licensing / Top performing / activity).
// w-full: phone tiles fill the house page inset — same left+right as
// the org title row. Do not add items-start; that collapses width.
export const DASHBOARD_ADMIN_STACK_CLASS =
  "flex w-full flex-col gap-[var(--space-6)]";

export const DASHBOARD_STANDARD_STACK_CLASS = "flex flex-col gap-[var(--space-12)]";

export const DASHBOARD_DO_NEXT_SECONDARY_CLASS =
  "max-md:border-transparent max-md:bg-transparent";

export const DASHBOARD_CHART_HEIGHT_MOBILE = 176;
export const DASHBOARD_CHART_HEIGHT_DESKTOP = 240;
export const DASHBOARD_CHART_FRAME_CLASS = "relative h-[176px] w-full md:h-[240px]";

// Named metric-block → chart gap (16). Empty well is page-48 compact — not 176 theater.
export const DASHBOARD_HERO_TO_CHART_GAP_CLASS = "pt-[var(--space-4)]";
export const DASHBOARD_CHART_EMPTY_CLASS =
  "relative flex h-[var(--space-12)] w-full items-center px-[var(--space-4)]";

export const DASHBOARD_FIXTURE_BANNER_CLASS =
  "rounded-[var(--radius)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] t-label text-ink-3 shadow-none max-md:sticky max-md:top-0 max-md:z-20";

export const DASHBOARD_PERIOD_SHEET_HOST_CLASS = HOUSE_PAGE_SELECT_SHEET_HOST_CLASS;

export const DASHBOARD_PERIOD_MENU_DESKTOP_CLASS = HOUSE_PAGE_SELECT_MENU_DESKTOP_CLASS;

export const DASHBOARD_ORG_NAME_MOBILE_CLASS = "t-heading text-ink md:hidden";
export const DASHBOARD_TITLE_MOBILE_CLASS = DASHBOARD_ORG_NAME_MOBILE_CLASS;
export const DASHBOARD_ORG_LABEL_CLASS = "t-title text-ink max-md:hidden";
export const DASHBOARD_TITLE_DESKTOP_CLASS = DASHBOARD_ORG_LABEL_CLASS;

export const DASHBOARD_PERIOD_TRIGGER_CLASS = HOUSE_PAGE_SELECT_TRIGGER_CLASS;

export const DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS = HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS;

export const DASHBOARD_PERIOD_CHEVRON_CLASS = HOUSE_PAGE_SELECT_CHEVRON_CLASS;

export const DASHBOARD_PERIOD_PANEL_CLASS = HOUSE_PAGE_SELECT_PANEL_CLASS;

export const DASHBOARD_PERIOD_GROUP_CLASS = HOUSE_PAGE_SELECT_GROUP_CLASS;

export const DASHBOARD_PERIOD_OPTION_CLASS = HOUSE_PAGE_SELECT_OPTION_CLASS;

export const DASHBOARD_PERIOD_OPTION_SELECTED_CLASS = HOUSE_PAGE_SELECT_OPTION_SELECTED_CLASS;

export const DASHBOARD_PERIOD_OPTION_LABEL_CLASS = HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS;

export const DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS = HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS;

export const DASHBOARD_PERIOD_OPTION_CHECK_CLASS = HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS;

export function dashboardPeriodOptionClass(selected: boolean): string {
  return housePageSelectOptionClass(selected);
}
