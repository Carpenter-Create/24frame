// Client finance visual register. House 8 / 16 / 24 / 48 only.
// Not ledger math. Staff /gc/finance ops stay on their own surface.

export const FINANCE_STACK_CLASS = "flex flex-col gap-[var(--space-12)]";
export const FINANCE_SECTION_CLASS = "flex flex-col gap-[var(--space-6)]";
export const FINANCE_RELATED_CLASS = "flex flex-col gap-[var(--space-2)]";
export const FINANCE_HERO_CLASS =
  "rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-6)] py-[var(--space-6)]";
export const FINANCE_STRIP_CLASS =
  "grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] bg-hairline sm:grid-cols-3 lg:grid-cols-6";
export const FINANCE_STRIP_CELL_CLASS =
  "flex flex-col gap-[var(--space-2)] bg-surface px-[var(--space-4)] py-[var(--space-4)]";
export const FINANCE_CARD_PAD_CLASS = "px-[var(--space-4)] py-[var(--space-4)]";
export const FINANCE_CARD_HOVER_CLASS =
  "shadow-none transition-colors hover:border-accent";
export const FINANCE_METER_TRACK_CLASS = "h-2 w-full overflow-hidden rounded-full bg-surface-muted";
export const FINANCE_METER_FILL_CLASS = "h-full rounded-full bg-accent";
export const FINANCE_METER_PAD_CLASS = "flex flex-col gap-[var(--space-2)] py-[var(--space-4)]";
export const FINANCE_CHART_VIEW_WIDTH = 640;
export const FINANCE_CHART_VIEW_HEIGHT = 148;
export const FINANCE_CHART_CLASS = "block h-[148px] w-full text-accent";
export const FINANCE_STATUS_PILL_CLASS =
  "inline-flex shrink-0 items-center rounded-full border border-hairline bg-surface-muted px-[var(--space-2)] py-[3px] text-[length:var(--text-xs)] font-medium text-ink-2";
export const FINANCE_DOWNLOAD_CLASS =
  "inline-flex items-center justify-center rounded-full bg-accent px-[var(--space-4)] py-[var(--space-2)] t-body-sm font-medium text-accent-contrast";
export const FINANCE_SOURCE_MONEY_CLASS = "t-data text-right text-ink";
