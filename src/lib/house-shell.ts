// House app-shell chrome — one grammar for Aggregation · Social · Education.
// Tokens stay in tokens.css. Do not fork workspace-scoped token files.
// Page canvas is --bg (white). Grey modules are --surface-muted (#F4F4F6)
// r16 only when a module is needed — never a page wash. Cards that stay
// white use hairline. No shadow. One rounded register house-wide: dest
// rail is an r16 panel (not a sharp strip), search and nav are pills,
// icon hits are circles, top-bar controls are pills. Active rail is
// Sporty Blue tint wash + accent type. Header Search is a quiet muted
// pill. Content-filter selected is ink; period chips stay muted.
// Sporty Blue fill is reserved for the primary CTA, the selected rail
// pill, and links. Stay on the social/fun chrome lane — do not flatten
// toward a professional register.

export const HOUSE_PAGE_CANVAS_CLASS = "bg-bg";

/** Desktop chrome gutter. Lead logo / rail / trailing / canvas share this. */
export const HOUSE_CHROME_GUTTER = "var(--chrome-gutter)";

export const HOUSE_CHROME_GUTTER_X_CLASS = "md:px-[var(--chrome-gutter)]";

export const HOUSE_CANVAS_X_CLASS = "px-[var(--chrome-gutter)]";

/** Access rail measure. Home content uses this while --sidebar-width is 0. */
export const HOUSE_ACCESS_RAIL_WIDTH = "var(--access-rail-width)";

/** Figma Home / Activity main column at 1440 (220 + 1220). */
export const HOUSE_HOME_CONTENT_WIDTH = "var(--home-content-width)";

/** Home modules sit in the Activity-main column. Lead chrome stays full-bleed. */
export const HOUSE_HOME_RAIL_COLUMN_CLASS =
  "ml-[var(--access-rail-width)] w-[calc(100%-var(--access-rail-width))]";

export const HOUSE_RAIL_FLOAT_CLASS =
  "fixed left-[var(--chrome-gutter)] top-[calc(var(--header-height)+var(--chrome-gutter))] z-30 hidden h-[calc(100dvh-var(--header-height)-calc(var(--chrome-gutter)*2))] flex-col md:flex";

export const HOUSE_MODULE_CLASS =
  "rounded-[var(--radius-lg)] bg-surface-muted shadow-none";

export const HOUSE_RAIL_PANEL_CLASS =
  "rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-none";

export const HOUSE_ICON_BUTTON_CLASS = "rounded-full";

export const HOUSE_CONTROL_PILL_CLASS = "rounded-full";

export const HOUSE_CARD_PAD = "px-[var(--space-4)] py-[var(--space-4)]";

export const HOUSE_RELATED_GAP_CLASS = "gap-[var(--space-2)]";

export const HOUSE_SECTION_AIR_CLASS = "gap-[var(--space-6)]";

// Logo → search air on Social + Education top bars. 16 related
// (house --space-4). Not flush, not mid-bar. Phone Education keeps
// the compact leading search; do not invent a desktop mid-bar.
export const HOUSE_HEADER_SEARCH_GAP_CLASS = "gap-[var(--space-4)]";

export const HOUSE_RAIL_ITEM_CLASS =
  "relative flex items-center rounded-full t-body-sm leading-4 transition-colors";

export const HOUSE_RAIL_ACTIVE_CLASS = "bg-accent-wash font-medium text-accent";

export const HOUSE_RAIL_IDLE_CLASS = "font-normal text-ink hover:bg-surface-muted";

export const HOUSE_SEARCH_PILL_CLASS = "rounded-full border-0 bg-surface-muted";

export const HOUSE_FILTER_ON_CLASS = "bg-ink text-surface";

export const HOUSE_FILTER_OFF_CLASS = "bg-surface-muted text-ink";

export const HOUSE_PERIOD_SELECTED_CLASS = "bg-surface-muted";
