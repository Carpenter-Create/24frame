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

/** Phone header right air — avatar is not flush to the viewport. */
export const HOUSE_PHONE_TRAILING_GUTTER_CLASS = "max-md:pr-[var(--chrome-gutter)]";

export const HOUSE_CANVAS_X_CLASS = "px-[var(--chrome-gutter)]";

/** Access rail measure. Aggregation uses --sidebar-width; this stays 220. */
export const HOUSE_ACCESS_RAIL_WIDTH = "var(--access-rail-width)";

/** Home canvas at 1440: 48 left + 16 right + 1376 column. */
export const HOUSE_HOME_CONTENT_WIDTH = "var(--home-content-width)";

/** Home modules: content-inset left · chrome-gutter right. Lead stays full-bleed. */
export const HOUSE_HOME_RAIL_COLUMN_CLASS =
  "w-full md:ml-[var(--content-inset)] md:mr-[var(--chrome-gutter)] md:w-[calc(100%-var(--content-inset)-var(--chrome-gutter))]";

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
// the compact under-nav search; do not invent a desktop mid-bar.
export const HOUSE_HEADER_SEARCH_GAP_CLASS = "gap-[var(--space-4)]";

export const HOUSE_RAIL_TITLE_CLASS = "px-2 pb-1 t-label text-ink-3";

export const HOUSE_RAIL_ITEM_CLASS =
  "relative flex items-center rounded-full t-body-sm leading-4 transition-colors";

export const HOUSE_RAIL_ACTIVE_CLASS = "bg-accent-wash font-medium text-accent";

export const HOUSE_RAIL_IDLE_CLASS = "font-normal text-ink hover:bg-surface-muted";

export const HOUSE_SEARCH_PILL_CLASS = "rounded-full border-0 bg-surface-muted";

export const HOUSE_FILTER_ON_CLASS = "bg-ink text-surface";

export const HOUSE_FILTER_OFF_CLASS = "bg-surface-muted text-ink";

// Standalone filter pill base — individual rounded pills with gap between.
// Used by news source chips, titles catalog filters, and other non-track pill rows.
export const HOUSE_FILTER_PILL_CLASS =
  "rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";

export const HOUSE_FILTER_PILL_CLUSTER_CLASS =
  "flex items-center gap-[var(--space-2)]";

export const HOUSE_PERIOD_SELECTED_CLASS = "bg-surface-muted";

// Segmented track — one continuous muted bar with a sliding solid accent thumb.
// Shared grammar for workspace pills and Top Performing Titles|Platforms|Territories.
// No track padding: first/last items sit flush to the track edges so the thumb
// reaches the full pill radius when the first or last segment is selected.
export const HOUSE_SEGMENTED_TRACK_CLASS =
  "relative flex shrink-0 items-center rounded-full bg-surface-muted";

export const HOUSE_SEGMENTED_THUMB_CLASS =
  "pointer-events-none absolute inset-y-0 rounded-full bg-accent transition-[left,width] duration-200 ease-out motion-reduce:transition-none";

export const HOUSE_SEGMENTED_ITEM_BASE_CLASS =
  "relative z-10 shrink-0 cursor-pointer select-none whitespace-nowrap rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm transition-colors duration-200 motion-reduce:transition-none";

export const HOUSE_SEGMENTED_ITEM_ON_CLASS = "text-white";

export const HOUSE_SEGMENTED_ITEM_OFF_CLASS = "text-ink";
