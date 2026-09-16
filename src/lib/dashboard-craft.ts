// Company-admin Dashboard craft classes. House tokens only — no RL orange,
// no Coinbase brand, no invented px type. Hairline + air; no drop shadow.
// Period menu rematches the Mercury workspace switcher: quiet trigger,
// trailing Sporty Blue check, flush-left labels.

export const DASHBOARD_CARD_CLASS =
  "card-surface dashboard-home-panel flex h-full flex-col overflow-hidden shadow-none";

export const DASHBOARD_MODULE_CARD_CLASS =
  "card-surface overflow-hidden shadow-none";

export const DASHBOARD_CARD_PAD_HERO = "px-[var(--space-6)] py-[var(--space-6)]";

export const DASHBOARD_CARD_PAD_LIST = "px-[var(--space-4)] py-[var(--space-4)]";

export const DASHBOARD_PERIOD_TRIGGER_CLASS =
  "group flex min-w-[10rem] items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-sm)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink";

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
