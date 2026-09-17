// House app-shell chrome — one grammar for Aggregation · Social · Education.
// Tokens stay in tokens.css. Do not fork workspace-scoped token files.
// Page canvas is --bg (#FAFAFB). Cards are r16 · pad 16 · section 24 ·
// related 8 · edge 48 · hairline only. Active rail is Sporty Blue tint
// wash + accent type. Header Search is a quiet muted pill. Content-filter
// selected is ink; period chips stay muted. Sporty Blue fill is reserved
// for the primary CTA, the active rail wash, and links.

export const HOUSE_CARD_PAD = "px-[var(--space-4)] py-[var(--space-4)]";

export const HOUSE_RELATED_GAP_CLASS = "gap-[var(--space-2)]";

export const HOUSE_SECTION_AIR_CLASS = "gap-[var(--space-6)]";

export const HOUSE_RAIL_ITEM_CLASS =
  "relative flex items-center rounded-full t-body-sm leading-4 transition-colors";

export const HOUSE_RAIL_ACTIVE_CLASS = "bg-accent-wash font-medium text-accent";

export const HOUSE_RAIL_IDLE_CLASS = "font-normal text-ink hover:bg-surface-muted";

export const HOUSE_SEARCH_PILL_CLASS = "rounded-full border-0 bg-surface-muted";

export const HOUSE_FILTER_ON_CLASS = "bg-ink text-surface";

export const HOUSE_FILTER_OFF_CLASS = "bg-surface-muted text-ink";

export const HOUSE_PERIOD_SELECTED_CLASS = "bg-surface-muted";
