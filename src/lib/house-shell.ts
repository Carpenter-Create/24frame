// House app-shell chrome — one grammar for Aggregation · Social · Education.
// Tokens stay in tokens.css. Do not fork workspace-scoped token files.
// Page canvas is --bg (white). Grey modules are --surface-muted (#F4F4F6)
// r16 only when a module is needed — never a page wash. Cards that stay
// white use hairline. No shadow. One rounded register house-wide: dest
// rail is an r16 panel (not a sharp strip), search and nav are pills,
// icon hits are circles, top-bar controls are pills. Active rail is
// Sporty Blue tint wash + accent type. Header Search is a quiet muted
// pill. Status badges stay ink. Exclusive choice menus use
// SegmentedTrack (white on accent thumb). Standalone dest and news
// source lenses are already SegmentedTrack. Period chips stay muted.
// Sporty Blue fill is reserved for the primary CTA, the selected rail
// pill, dest/news selected pills, and links. Stay on the social/fun chrome lane
// — do not flatten toward a professional register.

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
  "relative flex items-center rounded-full t-body leading-4 t-rail transition-colors";

// Active = wash + accent. Idle inherits body 420. t-rail is tracking only
// (A4). No font-normal (400). Differentiate by color only; do not bold
// the rail (Coinbase-pop A2).
export const HOUSE_RAIL_ACTIVE_CLASS = "bg-accent-wash text-accent";

export const HOUSE_RAIL_IDLE_CLASS = "text-ink hover:bg-surface-muted";

export const HOUSE_SEARCH_PILL_CLASS = "rounded-full border-0 bg-surface-muted";

export const HOUSE_FILTER_ON_CLASS = "bg-ink text-surface";

export const HOUSE_FILTER_OFF_CLASS = "bg-surface-muted text-ink";

// Standalone selected pill: accent fill + white label/icon.
// Same selected grammar as HOUSE_SEGMENTED_THUMB + HOUSE_SEGMENTED_ITEM_ON.
// Phone dest chips and news source lens use SegmentedTrack, not this
// fill. HOUSE_FILTER_ON_CLASS (ink) is status / display chips only.
// Exclusive choice menus are SegmentedTrack. Adam lock 2026-09-19.
export const HOUSE_PILL_SELECTED_CLASS = "bg-accent text-white";

// Gapped HOUSE_FILTER_PILL_* is not for choice menus. Choice menus
// use SegmentedTrack (HOUSE_SEGMENTED_* + SEGMENTED_TRACK_PERSIST).
// These tokens stay for status / display chips only (Titles status
// lens is HousePageSelect; catalogStatusPillClass stays a badge).
export const HOUSE_FILTER_PILL_CLASS =
  "rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";

export const HOUSE_FILTER_PILL_CLUSTER_CLASS =
  "flex items-center gap-[var(--space-2)]";

export const HOUSE_PERIOD_SELECTED_CLASS = "bg-surface-muted";

// Segmented track — one continuous muted bar with a sliding solid accent thumb.
// Shared grammar for workspace pills and Top Performing Titles|Platforms|Territories.
// No track padding: first/last items sit flush to the track edges so the thumb
// reaches the full pill radius when the first or last segment is selected.
// Slide is left/width, not opacity: 320ms ease into rest. Remount
// persistence lives in SegmentedTrack. Selected ink (ITEM_ON / ITEM_OFF)
// follows the same visualIndex as the thumb and snaps — never
// transition-colors. Color-easing ON from ink-2 → white paints dark
// type on the accent thumb for the whole glide. Do not fork a second
// workspace chrome or a host-local pending selection.
export const HOUSE_SEGMENTED_THUMB_DURATION_MS = 320;

export const HOUSE_SEGMENTED_THUMB_EASE = [0.22, 1, 0.36, 1] as const;

export const HOUSE_SEGMENTED_TRACK_CLASS =
  "relative flex shrink-0 items-center rounded-full bg-surface-muted";

// Scroll-rail host. Overflow is sideways scroll, never wrap or
// ellipsis. May hold one chip row or a stacked two-row track that
// scrolls as one. Intentional gospel exception for chip rails.
// News sources and the house chip rail consume this — do not fork
// a workspace-local lookalike.
export const HOUSE_SCROLL_ROW_CLASS = "no-scrollbar w-full overflow-x-auto";

// Scroll-row track: at least the host width, grows with shrink-0 items
// so bg-surface-muted covers every segment inside overflow-x-auto.
// Short tracks keep HOUSE_SEGMENTED_TRACK_CLASS (workspace switcher,
// period presets, phone dests). Do not fork a news-only lookalike.
export const HOUSE_SEGMENTED_TRACK_SCROLL_CLASS = `${HOUSE_SEGMENTED_TRACK_CLASS} w-max min-w-full`;

export const HOUSE_SEGMENTED_THUMB_CLASS =
  "pointer-events-none absolute inset-y-0 rounded-full bg-accent transition-[left,width] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export const HOUSE_SEGMENTED_ITEM_BASE_CLASS =
  "relative z-10 shrink-0 cursor-pointer select-none whitespace-nowrap rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";

export const HOUSE_SEGMENTED_ITEM_ON_CLASS = "text-white";

// Idle = muted secondary; active = white on accent thumb. Snap both
// ways — leaving may snap; never reintroduce dark-on-blue on ON.
export const HOUSE_SEGMENTED_ITEM_OFF_CLASS = "text-ink-2";

/** Hide the accent thumb when no segment is selected (activeIndex < 0). */
export function houseSegmentedThumbHidden(activeIndex: number): boolean {
  return activeIndex < 0;
}
