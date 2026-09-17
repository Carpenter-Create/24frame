// Company-admin Dashboard craft classes. House tokens only — no RL orange,
// no Coinbase brand, no invented px type. Hairline + air; no drop shadow.
// Period menu rematches the Mercury workspace switcher: quiet trigger,
// trailing Sporty Blue check, flush-left labels.
// Fidelity density × Coinbase quiet-play: one Period control, kickers,
// dense rows, related gap 8 · card pad 16 · section air 24.
// Overview structure rematch — 24Frame nouns only. No Dashboard-only tokens.
// Period chrome (phone + desktop): unlabeled value + chevron on the org row.
// Period is chrome, not H1. Dominant read stays the $.

export const DASHBOARD_CARD_CLASS =
  "card-surface dashboard-home-panel flex h-full flex-col overflow-hidden shadow-none";

export const DASHBOARD_MODULE_CARD_CLASS =
  "card-surface overflow-hidden shadow-none";

export const DASHBOARD_CARD_PAD =
  "px-[var(--space-4)] py-[var(--space-4)]";

export const DASHBOARD_CARD_PAD_HERO = DASHBOARD_CARD_PAD;

export const DASHBOARD_CARD_PAD_LIST = DASHBOARD_CARD_PAD;

export const DASHBOARD_KICKER_CLASS = "t-label text-ink-3";

export const DASHBOARD_RELATED_GAP_CLASS = "gap-[var(--space-2)]";

export const DASHBOARD_SECTION_AIR_CLASS = "gap-[var(--space-6)]";

export const DASHBOARD_ROW_CLASS =
  "flex min-h-10 items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]";

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

export const DASHBOARD_ADMIN_OVERVIEW_CLASS =
  "flex flex-col gap-[var(--space-6)]";

export const DASHBOARD_ADMIN_PAIR_CLASS =
  "grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2";

export const DASHBOARD_VIEW_ALT_CLUSTER_CLASS =
  "flex items-center overflow-hidden rounded-[var(--radius-sm)] border border-hairline";

export const DASHBOARD_VIEW_ALT_BUTTON_CLASS =
  "flex size-8 items-center justify-center";

export const DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS = "bg-surface-muted text-accent";

export const DASHBOARD_VIEW_ALL_CLASS =
  "inline-flex items-center gap-[var(--space-2)] t-body-sm text-accent";

export const DASHBOARD_MAP_FRAME_CLASS = "relative h-[220px] w-full";

export const DASHBOARD_LEGEND_CLASS =
  "flex items-center gap-[var(--space-2)] t-label text-ink-3";

export const DASHBOARD_ADMIN_STACK_CLASS =
  "flex flex-col gap-[var(--space-6)]";

export const DASHBOARD_STANDARD_STACK_CLASS = "flex flex-col gap-[var(--space-12)]";

export const DASHBOARD_DO_NEXT_SECONDARY_CLASS =
  "max-md:border-transparent max-md:bg-transparent";

export const DASHBOARD_CHART_HEIGHT_MOBILE = 176;
export const DASHBOARD_CHART_HEIGHT_DESKTOP = 200;
export const DASHBOARD_CHART_FRAME_CLASS = "relative h-[176px] w-full md:h-[200px]";

// Named metric-block → chart gap (16). Empty well is page-48 compact — not 176 theater.
export const DASHBOARD_HERO_TO_CHART_GAP_CLASS = "pt-[var(--space-4)]";
export const DASHBOARD_CHART_EMPTY_CLASS =
  "relative flex h-[var(--space-12)] w-full items-center px-[var(--space-4)]";

export const DASHBOARD_FIXTURE_BANNER_CLASS =
  "rounded-[var(--radius)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] t-label text-ink-3 shadow-none max-md:sticky max-md:top-[var(--header-height)] max-md:z-20";

export const DASHBOARD_PERIOD_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end md:hidden";

export const DASHBOARD_PERIOD_MENU_DESKTOP_CLASS = "max-md:hidden";

export const DASHBOARD_ORG_NAME_MOBILE_CLASS = "t-body-sm text-ink-2 md:hidden";
export const DASHBOARD_TITLE_MOBILE_CLASS = DASHBOARD_ORG_NAME_MOBILE_CLASS;
export const DASHBOARD_ORG_LABEL_CLASS = "t-label text-ink-3 max-md:hidden";
export const DASHBOARD_TITLE_DESKTOP_CLASS = DASHBOARD_ORG_LABEL_CLASS;

export const DASHBOARD_PERIOD_TRIGGER_CLASS =
  "group flex min-w-[10rem] items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-sm)] border border-hairline bg-surface-muted px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink max-md:min-w-0 max-md:flex-none max-md:justify-end max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-0";

export const DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS = "min-w-0 truncate";

export const DASHBOARD_PERIOD_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 transition-opacity";

export const DASHBOARD_PERIOD_PANEL_CLASS =
  "absolute right-0 top-full z-50 mt-[var(--space-2)] flex max-h-80 min-w-[16rem] flex-col overflow-y-auto rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

export const DASHBOARD_PERIOD_GROUP_CLASS =
  "px-[var(--space-4)] pb-[var(--space-1)] pt-[var(--space-2)] t-label text-ink-3";

export const DASHBOARD_PERIOD_OPTION_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink";

export const DASHBOARD_PERIOD_OPTION_SELECTED_CLASS = "bg-surface-muted";

export const DASHBOARD_PERIOD_OPTION_LABEL_CLASS = "min-w-0 flex-1 text-left";

export const DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS = "size-4 shrink-0";

export const DASHBOARD_PERIOD_OPTION_CHECK_CLASS = "text-accent";

export function dashboardPeriodOptionClass(selected: boolean): string {
  return selected
    ? `${DASHBOARD_PERIOD_OPTION_CLASS} ${DASHBOARD_PERIOD_OPTION_SELECTED_CLASS}`
    : DASHBOARD_PERIOD_OPTION_CLASS;
}
