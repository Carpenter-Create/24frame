// Company-admin Dashboard craft classes. House tokens only — no RL orange,
// no Coinbase brand, no invented px type. Hairline + air; no drop shadow.
// Period menu rematches the Mercury workspace switcher: quiet trigger,
// trailing Sporty Blue check, flush-left labels.

export const DASHBOARD_CARD_CLASS =
  "card-surface dashboard-home-panel flex h-full flex-col overflow-hidden shadow-none";

export const DASHBOARD_MODULE_CARD_CLASS =
  "card-surface overflow-hidden shadow-none";

export const DASHBOARD_CARD_PAD_HERO =
  "px-[var(--space-6)] py-[var(--space-6)] max-md:px-[var(--space-4)] max-md:py-[var(--space-4)]";

export const DASHBOARD_CARD_PAD_LIST = "px-[var(--space-4)] py-[var(--space-4)]";

// Phone (`< md`) only. Desktop #328/#329 locks stay at md+.
export const DASHBOARD_MOBILE_BREAKPOINT_CLASS = "max-md";

export const DASHBOARD_ADMIN_CHROME_CLASS =
  "flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between";

export const DASHBOARD_ADMIN_OVERVIEW_CLASS =
  "grid grid-cols-1 gap-[var(--space-6)] max-md:flex max-md:flex-col lg:grid-cols-5";

export const DASHBOARD_ADMIN_STACK_CLASS =
  "flex flex-col gap-[var(--space-6)] md:gap-[var(--space-12)]";

export const DASHBOARD_STANDARD_STACK_CLASS = "flex flex-col gap-[var(--space-12)]";

export const DASHBOARD_DO_NEXT_SECONDARY_CLASS =
  "max-md:border-transparent max-md:bg-transparent";

export const DASHBOARD_CHART_HEIGHT_MOBILE = 176;
export const DASHBOARD_CHART_HEIGHT_DESKTOP = 200;
export const DASHBOARD_CHART_FRAME_CLASS = "relative h-[176px] w-full md:h-[200px]";

export const DASHBOARD_FIXTURE_BANNER_CLASS =
  "rounded-[var(--radius)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] t-label text-ink-3 shadow-none max-md:sticky max-md:top-[var(--header-height)] max-md:z-20";

export const DASHBOARD_USER_OVERFLOW_CLASS =
  "flex size-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-ink-3 md:hidden";

export const DASHBOARD_USER_FIELD_DESKTOP_CLASS = "relative max-md:hidden";

export const DASHBOARD_USER_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end md:hidden";

export const DASHBOARD_TITLE_MOBILE_CLASS = "md:hidden";
export const DASHBOARD_TITLE_DESKTOP_CLASS = "max-md:hidden";
export const DASHBOARD_ORG_LABEL_CLASS = "t-label text-ink-3 max-md:hidden";

export const DASHBOARD_PERIOD_TRIGGER_CLASS =
  "group flex min-w-[10rem] items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-sm)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink max-md:min-w-0 max-md:flex-1";

export const DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS = "min-w-0 truncate";

export const DASHBOARD_PERIOD_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 transition-opacity";

export const DASHBOARD_PERIOD_PANEL_CLASS =
  "absolute right-0 top-full z-50 mt-[var(--space-2)] flex max-h-80 min-w-[16rem] flex-col overflow-y-auto rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

export const DASHBOARD_PERIOD_GROUP_CLASS =
  "px-[var(--space-4)] pb-[var(--space-1)] pt-[var(--space-2)] t-label text-ink-3";

export const DASHBOARD_PERIOD_OPTION_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm font-normal text-ink";

export const DASHBOARD_PERIOD_OPTION_SELECTED_CLASS = "bg-surface-muted";

export const DASHBOARD_PERIOD_OPTION_LABEL_CLASS = "min-w-0 flex-1 text-left";

export const DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS = "size-4 shrink-0";

export const DASHBOARD_PERIOD_OPTION_CHECK_CLASS = "text-accent";

export function dashboardPeriodOptionClass(selected: boolean): string {
  return selected
    ? `${DASHBOARD_PERIOD_OPTION_CLASS} ${DASHBOARD_PERIOD_OPTION_SELECTED_CLASS}`
    : DASHBOARD_PERIOD_OPTION_CLASS;
}
