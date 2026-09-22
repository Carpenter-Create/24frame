// Social measured chrome. Tokens only — no hex.
// Desktop Home Circle-primary: Figma 176:1085 / 176:1346.
// Prior desktop: 169:964 / 169:1281 (164:1136 / 164:1360 still in place).
// Mobile Home: Figma 169:1519 Stories then Topics then Following wall.
// Pill hide stays 160:1129.
// Profile ship: Figma 129:215 / 129:415 / 129:615.
// Profile share sheet: Figma 155:194 / 155:372.
// Create ship: Figma 135:585 / 135:1037 / 135:1214.
// Stories ship: Figma 138:163 / 138:889 / 138:943.
// Stories studio: Figma 146:230 / 146:1050 / 146:1072 / 146:1099
//   desktop 146:1125 / 146:1147 / 146:1173 / 147:251.
// Stories picker: Figma 144:1218 / 144:1444.
// No glass, no drop shadow. App-shell chrome (search, rail, filters) uses
// house-shell. Feed / stories / create measured IA stays here.

import {
  HOUSE_CHIP_RAIL_CHIP_CLASS,
  HOUSE_CHIP_RAIL_CLASS,
  HOUSE_CHIP_RAIL_ROW_CLASS,
  HOUSE_CHIP_RAIL_STACK_CLASS,
} from "@/lib/house-chip-rail";
import {
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
  HOUSE_MODULE_CLASS,
  HOUSE_PILL_ITEM_CLASS,
  HOUSE_PILL_SELECTED_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
  HOUSE_SCROLL_ROW_CLASS,
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
} from "@/lib/house-shell";
import { HOUSE_VOICE_FOCUS_HOST_CLASS } from "@/lib/form-control";
import {
  SETTINGS_DIALOG_ERROR_CLASS,
  SETTINGS_DIALOG_HELP_CLASS,
  SETTINGS_DIALOG_LABEL_CLASS,
} from "@/lib/settings";

export const SOCIAL_FIGMA_HOME = "176:1085";
export const SOCIAL_FIGMA_HOME_EMPTY = "176:1346";
export const SOCIAL_FIGMA_HOME_MOBILE = "169:1519";
export const SOCIAL_FIGMA_HOME_MOBILE_SCROLL = "160:1129";
export const SOCIAL_FIGMA_HOME_DESKTOP_PRIOR = ["169:964", "169:1281", "164:1136", "164:1360"] as const;

// Desktop Social Home measure. Recent chats column is retired; its 200 +
// gutter 16 is reclaimed by the middle column (composer / stories / Topics / wall).
// dest 200 | gutter 16 | center 892 | gutter 16 | For you 300 | padR 16 = 1440.
export const SOCIAL_DESKTOP_MEASURE = {
  dest: 200,
  gutter: 16,
  center: 892,
  right: 300,
  padR: 16,
} as const;
export const SOCIAL_FIGMA_PROFILE = ["129:215", "129:415", "129:615"] as const;
export const SOCIAL_FIGMA_PROFILE_OWN = ["181:230", "181:2000"] as const;
export const SOCIAL_FIGMA_PROFILE_EDIT = ["180:206", "180:1946", "181:2184"] as const;
export const SOCIAL_FIGMA_PROFILE_BIO = ["180:2004", "180:2026"] as const;
export const SOCIAL_FIGMA_PROFILE_SHARE = ["155:194", "155:372"] as const;
export const SOCIAL_FIGMA_CREATE = ["135:585", "135:1037", "135:1214"] as const;
export const SOCIAL_FIGMA_STORIES = ["138:163", "138:889", "138:943"] as const;
export const SOCIAL_FIGMA_STORY_STUDIO = [
  "146:230",
  "146:1050",
  "146:1072",
  "146:1099",
  "146:1125",
  "146:1147",
  "146:1173",
  "147:251",
] as const;
export const SOCIAL_FIGMA_STORY_PICKER = ["144:1218", "144:1444"] as const;

// Dest column stays 200 (measure). Panel insets 16 so the r16
// corner reads — same float as Aggregation / Education. Not a
// flush-left strip.
export const SOCIAL_RAIL_WIDTH_CLASS = "w-[calc(200px-var(--chrome-gutter))]";
export const SOCIAL_RAIL_MAIN_OFFSET_CLASS = "md:ml-[200px]";
export const SOCIAL_RAIL_PANEL_CLASS = HOUSE_RAIL_PANEL_CLASS;
export const SOCIAL_FOR_YOU_WIDTH_CLASS = "w-[300px]";
export const SOCIAL_CENTER_WIDTH_CLASS = "w-full min-w-0 lg:max-w-[892px]";
export const SOCIAL_DESKTOP_FRAME_PAD_CLASS = "w-full px-[var(--chrome-gutter)] py-4";

export const SOCIAL_PAGE_CLASS =
  "flex flex-col gap-[var(--space-4)] pb-[var(--space-12)]";

export const SOCIAL_HOME_LAYOUT_CLASS = "flex items-start gap-[16px]";

export const SOCIAL_HOME_CENTER_CLASS =
  "flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[892px]";

// Profile desktop column. One centered stack on the Home 892 measure
// (SOCIAL_DESKTOP_MEASURE.center). Side air is the mx-auto gutter —
// the column does not run edge to edge across the Social canvas.
// Not a 935 fork. No flex-1 (that stretch is Home + For You only).
// md+ focuses; phone stays full width of the phone canvas.
// Own + public profile only. No For You rail on these pages.
export const SOCIAL_PROFILE_CENTER_CLASS =
  "mx-auto flex w-full min-w-0 flex-col gap-2 md:max-w-[892px]";

// 40px face. Export name stays so search, home, and overview share one SoT.
export const SOCIAL_AVATAR_32_CLASS =
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body-sm font-medium text-ink-2";

export const SOCIAL_SURFACE_RADIUS_CLASS = "rounded-[var(--radius-lg)]";

export const SOCIAL_FOR_YOU_RAIL_CLASS =
  `hidden w-[300px] shrink-0 flex-col gap-4 ${SOCIAL_SURFACE_RADIUS_CLASS} border border-hairline bg-surface p-4 lg:flex`;

export const SOCIAL_CARD_CLASS =
  "flex flex-col gap-[var(--space-3)] rounded-[8px] border border-hairline bg-surface p-[var(--space-4)]";

export const SOCIAL_CARD_MUTED_CLASS =
  "flex flex-col gap-[var(--space-3)] rounded-[8px] bg-surface-muted p-[var(--space-4)]";

export const SOCIAL_EMPTY_PANEL_CLASS =
  `flex flex-col items-center justify-center gap-[var(--space-4)] ${SOCIAL_SURFACE_RADIUS_CLASS} bg-surface-muted px-[var(--space-6)] py-[var(--space-12)] text-center`;

// Profile Posts empty — own + public one SoT. Quiet: no tall muted
// well, no second Edit. Title is the one short line.
export const SOCIAL_PROFILE_POSTS_EMPTY_CLASS =
  "flex flex-col items-center justify-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-4)] text-center";

export const SOCIAL_EMPTY_ACTION_CLASS =
  "inline-flex items-center justify-center rounded-[8px] bg-accent px-[var(--space-4)] py-[10px] t-body-sm font-medium text-accent-contrast";

export const SOCIAL_CHECKLIST_CLASS =
  "flex flex-col gap-[var(--space-2)] rounded-[8px] border border-hairline bg-surface p-[var(--space-4)]";

export const SOCIAL_CHECKLIST_TRACK_CLASS =
  "h-1 w-full overflow-hidden rounded-full bg-surface-muted";

export const SOCIAL_CHECKLIST_TRACK_NESTED_CLASS =
  "h-1 w-full overflow-hidden rounded-full bg-surface";

export const SOCIAL_CHECKLIST_ROW_CLASS = "border-b border-hairline py-[var(--space-3)]";

export const SOCIAL_CHECKLIST_ROW_LAST_CLASS = "py-[var(--space-3)]";

export const SOCIAL_PILL_CLASS =
  "rounded-full px-[14px] py-[var(--space-2)] t-body-sm whitespace-nowrap";

export const SOCIAL_PILL_ACTIVE_CLASS = HOUSE_FILTER_ON_CLASS;

export const SOCIAL_PILL_IDLE_CLASS = HOUSE_FILTER_OFF_CLASS;

export const SOCIAL_ACTION_CLASS =
  "inline-flex items-center justify-center rounded-[8px] bg-accent px-[var(--space-6)] py-[var(--space-2)] t-body-sm font-medium text-accent-contrast";

export const SOCIAL_ACTION_SECONDARY_CLASS =
  "inline-flex items-center justify-center rounded-[8px] border border-hairline bg-surface px-[var(--space-6)] py-[var(--space-2)] t-body-sm font-medium text-ink";

export const SOCIAL_ACTION_QUIET_CLASS =
  "inline-flex items-center justify-center rounded-[8px] bg-surface-muted px-[var(--space-3)] py-[6px] t-body-sm font-medium text-ink";

export const SOCIAL_STORY_CARD_CLASS =
  "flex h-[144px] w-[96px] shrink-0 items-center justify-center rounded-[12px] p-[3px]";

export const SOCIAL_STORY_FACE_CLASS =
  "flex size-full flex-col items-center justify-center gap-[var(--space-2)] rounded-[9px] px-[var(--space-2)] py-[var(--space-4)]";

export const SOCIAL_STORY_MEDIA_CLASS =
  "relative size-full overflow-hidden rounded-[9px] bg-surface-muted";

// Home tall FB-style cards — 160:482 / 160:964. Circular rings superseded.
export const SOCIAL_HOME_STORY_CARD_CLASS =
  `relative h-[192px] w-[108px] shrink-0 overflow-hidden ${SOCIAL_SURFACE_RADIUS_CLASS} border border-hairline bg-surface md:h-[200px] md:w-[112px]`;

export const SOCIAL_HOME_STORY_CREATE_FACE_CLASS =
  "absolute inset-x-0 top-0 flex h-[114px] items-center justify-center overflow-hidden bg-surface-muted md:h-[120px]";

// Accent circle + white plus glyph. Not a white-fill well (Plus fill
// knockout reads as white disc / blue +). border-surface is the seam
// ring only — not the well fill. Phone + desktop share this class.
export const SOCIAL_HOME_STORY_PLUS_CLASS =
  "absolute left-1/2 top-[96px] z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-surface bg-accent text-accent-contrast md:top-[100px] md:size-10";

// Adam 2026-09-20 — Create Story is Social chrome, not an eyebrow.
// t-label uppercase + 0.12em track stacked CREATE / STORY as a
// leftover specialty face. Same token as Topics / Write something /
// Create sheet tiles. One SoT for phone + desktop — no device fork.
export const SOCIAL_STORY_CREATE_LABEL_TYPE_CLASS =
  "t-body-sm font-medium text-ink";

export const SOCIAL_HOME_STORY_CREATE_LABEL_CLASS =
  `absolute inset-x-0 bottom-0 flex h-[78px] items-center justify-center bg-surface px-2 text-center ${SOCIAL_STORY_CREATE_LABEL_TYPE_CLASS} md:h-20`;

export const SOCIAL_HOME_STORY_FACE_RING_CLASS =
  "absolute left-2 top-2 z-10 flex size-8 items-center justify-center overflow-hidden rounded-full border-2 bg-surface p-[2px] md:left-[9px] md:top-[9px] md:size-9";

export const SOCIAL_HOME_STORY_FACE_CLASS =
  "flex size-full items-center justify-center overflow-hidden rounded-full bg-surface t-label font-semibold text-ink";

export const SOCIAL_HOME_STORY_NAME_CLASS =
  "absolute inset-x-0 bottom-0 flex h-10 items-center bg-band/55 px-2 t-label font-medium text-band-ink md:h-12 md:px-2.5";

export const SOCIAL_STORIES_CARD_CLASS =
  `flex h-[168px] w-[112px] shrink-0 items-center justify-center ${SOCIAL_SURFACE_RADIUS_CLASS} p-[3px]`;

export const SOCIAL_STORIES_FACE_CLASS =
  "flex size-full flex-col items-center justify-center gap-[var(--space-2)] rounded-[13px] px-[var(--space-2)] py-[var(--space-4)]";

export const SOCIAL_STORIES_MEDIA_CLASS =
  "relative size-full overflow-hidden rounded-[13px] bg-surface-muted";

// Same plus SoT as SOCIAL_HOME_STORY_PLUS_CLASS: accent well, white glyph.
export const SOCIAL_STORIES_PLUS_WELL_CLASS =
  "flex size-9 items-center justify-center rounded-full bg-accent text-accent-contrast";

export const SOCIAL_STORIES_EMPTY_ACTION_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-[var(--space-4)] py-[10px] t-body-sm font-medium text-accent-contrast";

export const SOCIAL_STORY_VIEWER_CLASS =
  "mx-auto flex w-full max-w-[420px] flex-col gap-[var(--space-4)] rounded-[16px] border border-hairline bg-surface p-[var(--space-4)] md:max-w-[420px]";

export const SOCIAL_STORY_PROGRESS_BAR_CLASS = "h-[3px] flex-1 rounded-full";

export const SOCIAL_STORY_CARET_CLASS =
  "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-ink-2";

// Home composer — airy FB register. Adam 2026-09-20
// lock_airy_topics_under_cut_phone_composer. Avatar + prompt on the
// canvas, no gray liner / boxed form. Desktop only (`hidden md:flex`).
// The row opens the Create sheet SoT. Phone Create is the dock dest.
// Photo · Video · Write · Go live stay on that sheet — never a second
// chooser strip on Home.
export const SOCIAL_COMPOSER_CLASS =
  "hidden md:flex h-20 w-full items-center gap-3 border-none bg-transparent p-0 text-left";

export const SOCIAL_COMPOSER_FIELD_CLASS =
  "flex h-11 min-w-0 flex-1 items-center t-body text-ink-2";

export const SOCIAL_COMPOSER_MEDIA_CLASS =
  "relative flex size-9 shrink-0 cursor-pointer items-center justify-center text-ink-2";

export const SOCIAL_FOLLOW_COMPACT_CLASS =
  "inline-flex items-center rounded-[8px] bg-accent px-[var(--space-3)] py-[var(--space-2)] t-body-sm font-semibold text-accent-contrast";

export const SOCIAL_FOLLOW_COMPACT_IDLE_CLASS =
  "inline-flex items-center rounded-[8px] border border-hairline bg-surface px-[var(--space-3)] py-[var(--space-2)] t-body-sm font-semibold text-ink";

export const SOCIAL_FOR_YOU_CARD_CLASS =
  `${HOUSE_MODULE_CLASS} flex w-full flex-col gap-2 p-4`;

export const SOCIAL_FEED_ROW_CLASS =
  `flex flex-col gap-2 ${SOCIAL_SURFACE_RADIUS_CLASS} border border-hairline bg-surface p-[var(--space-4)]`;

// Founder lock 2026-09-21: muted FB `15h` register. Never `t-label`
// (uppercase + 0.12em track turns `10h` into `10 H`).
export const SOCIAL_POST_TIME_CLASS =
  "text-[length:var(--text-xs)] font-normal leading-none tracking-normal text-ink-2";

// Facebook gray gutter — muted canvas frames every surface post.
// Light --bg and --surface are both white; surface-muted (#f4f4f6)
// is the visible band. ~8px house space-2. Stack gap between cards
// plus py so the first and last cards are framed — never per-card
// margin that doubles the band.
export const SOCIAL_FEED_GUTTER_CLASS =
  "flex flex-col gap-[var(--space-2)] bg-surface-muted py-[var(--space-2)]";

// Comment thread — house app-sheet rise. Same host/scrim as Create.
// Composer stays at the bottom. Do not fork a second sheet grammar.
export const SOCIAL_COMMENT_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end";

export const SOCIAL_COMMENT_SHEET_SURFACE_CLASS =
  "relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-[16px] bg-surface app-sheet-rise md:mx-auto md:max-w-[480px] md:rounded-[16px] md:border md:border-hairline";

export const SOCIAL_COMMENT_SHEET_SCRIM_CLASS =
  "absolute inset-0 bg-ink/40 app-sheet-scrim-fade";

export const SOCIAL_COMMENT_COMPOSER_CLASS =
  "flex items-end gap-2 border-t border-hairline bg-surface px-4 py-3";

export const SOCIAL_ACTIVITY_PILLS_CLASS = HOUSE_SCROLL_ROW_CLASS;

export const SOCIAL_ACTIVITY_COMMENT_SNIPPET_CLASS =
  "break-words whitespace-pre-wrap t-body-sm text-ink";

export const SOCIAL_CREATE_CTA_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-accent px-4 py-3 t-body font-semibold text-accent-contrast";

export const SOCIAL_HOME_TAB_CLASS =
  "flex flex-1 flex-col items-center gap-2.5 px-4 pt-3 t-body";

// Topic/Profession chip measure — house fat pill SoT (same height as
// SegmentedTrack). Width hugs the label. Display stays surface fill.
// Edit select composes idle outline + HOUSE_PILL_SELECTED_CLASS.
export const SOCIAL_TOPIC_CHIP_MEASURE_CLASS = `w-fit ${HOUSE_PILL_ITEM_CLASS}`;

export const SOCIAL_TOPIC_CHIP_CLASS =
  `${SOCIAL_TOPIC_CHIP_MEASURE_CLASS} ${HOUSE_FILTER_OFF_CLASS}`;

export const SOCIAL_TOPIC_CHIP_SELECT_IDLE_CLASS =
  `${SOCIAL_TOPIC_CHIP_MEASURE_CLASS} max-w-full border border-hairline bg-surface text-ink`;

export const SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS =
  `${SOCIAL_TOPIC_CHIP_MEASURE_CLASS} max-w-full ${HOUSE_PILL_SELECTED_CLASS}`;

export const SOCIAL_TOPIC_CHIP_BANK_CLASS = "flex flex-wrap gap-2";

// Shared Professions / Topics select face. Selected band + count →
// helper → search → grouped banks with section air. Sentence-case
// group labels — never t-label ALL-CAPS. Roles and Topics consume
// this grammar; do not fork a lookalike.
export const SOCIAL_PROFILE_CHIP_FACE_CLASS = "flex flex-col gap-[var(--space-6)]";
export const SOCIAL_PROFILE_CHIP_BAND_CLASS = "flex flex-col gap-[var(--space-3)]";
export const SOCIAL_PROFILE_CHIP_COUNT_CLASS = "t-body-sm text-ink-2";
export const SOCIAL_PROFILE_CHIP_HELP_CLASS = SETTINGS_DIALOG_HELP_CLASS;
export const SOCIAL_PROFILE_CHIP_GROUPS_CLASS = "flex flex-col gap-[var(--space-6)]";
export const SOCIAL_PROFILE_CHIP_GROUP_CLASS = "flex flex-col gap-[var(--space-3)]";
export const SOCIAL_PROFILE_CHIP_GROUP_LABEL_CLASS =
  "t-body-sm font-medium normal-case tracking-normal text-ink-2";

export function socialTopicChipSelectClass(selected: boolean): string {
  return selected ? SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS : SOCIAL_TOPIC_CHIP_SELECT_IDLE_CLASS;
}

// Profile cover — quiet media band on the 892 column. 4:1. Phone 112px,
// desktop 224px. Owner with no photo keeps the accent wash so Add cover
// stays on the band. Visitors omit the band when no photo exists
// (socialProfileRendersCoverBand). Avatar may lip under the band while
// it is present. The lip is the face only — name and counts stay on
// the page. Upload master 1784×446 is crop math and is never painted.
export const SOCIAL_PROFILE_COVER_CLASS =
  "relative w-full h-[112px] shrink-0 overflow-hidden md:h-[224px]";

export const SOCIAL_PROFILE_COVER_EMPTY_CLASS = "bg-accent-wash";

export const SOCIAL_PROFILE_COVER_IMAGE_CLASS = "absolute inset-0 size-full object-cover";

export const SOCIAL_PROFILE_COVER_EDIT_CLASS =
  "absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-hairline bg-surface/90 text-ink";

export const SOCIAL_PROFILE_COVER_PILL_CLASS =
  "flex items-center gap-1.5 rounded-[8px] border border-hairline bg-surface/90 px-3 py-[6px] t-body-sm font-medium text-ink";

// Add / Edit cover sits in the top corner of the band so it does not
// meet the avatar lip.
export const SOCIAL_PROFILE_COVER_PILL_ANCHOR_CLASS = "absolute right-3 top-3 z-20";

export const SOCIAL_PROFILE_COVER_MENU_CLASS =
  "absolute right-0 top-[calc(100%+4px)] z-20 flex min-w-[200px] flex-col rounded-[8px] border border-hairline bg-surface py-1";

export const SOCIAL_PROFILE_COVER_MENU_ITEM_CLASS =
  "flex w-full items-center gap-3 px-3 py-2 text-left t-body-sm text-ink hover:bg-surface-muted";

export const SOCIAL_PROFILE_COVER_REPOSITION_BAR_CLASS =
  "absolute inset-x-0 top-0 z-30 flex h-10 items-center justify-between bg-ink/70 px-3";

export const SOCIAL_PROFILE_COVER_DRAG_HINT_CLASS =
  "pointer-events-none absolute inset-0 z-10 flex items-center justify-center";

export const SOCIAL_PROFILE_COVER_REPOSITION_CLASS =
  "relative w-full h-[112px] shrink-0 overflow-hidden md:h-[224px] cursor-grab active:cursor-grabbing";

export const SOCIAL_PROFILE_COVER_STACK_CLASS = "flex flex-col";

export const SOCIAL_PROFILE_HEAD_OVERLAP_CLASS =
  "relative z-10 -mt-[29px] md:-mt-[35px]";

export const SOCIAL_PROFILE_AVATAR_ON_COVER_CLASS =
  "border-2 border-surface";

export const SOCIAL_PROFILE_AVATAR_EDIT_CLASS =
  "absolute bottom-0 right-0 z-10 flex size-8 items-center justify-center rounded-full border border-hairline bg-surface text-ink";

// Public profile head. One SoT for own /social/profile and public
// /social/u/[handle]. Cover is a quiet media band. The avatar may lip
// under it. Name, counts, bio, role pills, links, and actions stack
// in the column. Counts are a metric row — strong tabular numbers,
// quiet labels — not a side column beside the avatar. Topic chips
// follow the actions. Mutuals are last and omit when empty. Handle
// stays in chrome. Name and labels wrap; never truncate.
export const SOCIAL_PROFILE_IDENTITY_CLASS = "flex flex-col gap-[var(--space-3)]";

// Shared inset. Cover stays full bleed of the column; the avatar and
// the type stack share one left edge.
export const SOCIAL_PROFILE_INSET_CLASS = "px-[var(--space-4)] md:px-[var(--space-6)]";

export const SOCIAL_PROFILE_HEAD_CLASS =
  "flex min-w-0 items-end gap-[var(--space-4)]";

// House metric row. Three counts, left clustered, hairline under
// the row. flex-wrap so a narrow phone stacks a cell instead of
// truncating the label. Not a stretched 3-column dashboard grid.
export const SOCIAL_PROFILE_STATS_CLASS = "w-full min-w-0";

export const SOCIAL_PROFILE_STATS_GRID_CLASS =
  "flex w-full min-w-0 flex-wrap items-start gap-x-[var(--space-8)] gap-y-[var(--space-3)] border-b border-hairline pb-[var(--space-3)]";

export const SOCIAL_PROFILE_STAT_CLASS =
  "flex min-w-0 max-w-full flex-col items-start gap-[var(--space-1)] text-left";

export const SOCIAL_PROFILE_STAT_VALUE_CLASS = "t-heading t-data text-ink";

export const SOCIAL_PROFILE_STAT_LABEL_CLASS =
  "break-words text-[length:var(--text-xs)] font-normal leading-snug tracking-normal text-ink-3";

export const SOCIAL_PROFILE_FACE_CLASS =
  `flex w-full min-w-0 flex-col gap-[var(--space-4)] pb-[var(--space-2)] ${SOCIAL_PROFILE_INSET_CLASS}`;

export const SOCIAL_PROFILE_NAME_CLASS = "min-w-0 flex-1 break-words t-title text-ink";

// Pause before the primary CTA (Edit or Follow) and the quiet
// icon-only Share. Same class for own + public. Share does not
// stretch. Labels wrap; the icon hit stays ≥44px.
export const SOCIAL_PROFILE_ACTIONS_CLASS =
  "mt-[var(--space-3)] flex w-full min-w-0 items-center gap-2";

export const SOCIAL_PROFILE_BIO_CLASS = "break-words t-body text-ink whitespace-pre-wrap";

// Adam 2026-09-22: quiet icon rail. Not chips, not brand color.
// Horizontal, wraps on a narrow phone — never truncate. Same class for
// own + public. Max 2 face links; +N is the overflow control.
export const SOCIAL_PROFILE_LINKS_CLASS =
  "flex min-w-0 flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-2)]";
export const SOCIAL_PROFILE_LINK_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center text-ink-2 hover:text-ink";
export const SOCIAL_PROFILE_LINKS_MORE_CLASS =
  "inline-flex h-9 shrink-0 items-center t-body-sm text-ink-2 hover:text-ink";

// Links sheet keeps readable host labels in a column. Not the face rail.
export const SOCIAL_PROFILE_LINKS_SHEET_CLASS =
  "flex min-w-0 flex-col items-start gap-[var(--space-3)]";
export const SOCIAL_PROFILE_LINKS_SHEET_LINK_CLASS =
  "min-w-0 break-words t-body-sm text-ink-2 hover:text-ink";

// Public Professions: one-row house chip rail (same primitive as Topics).
// Phone: nowrap + overflow-x auto + no-scrollbar. Desktop: same one-row
// scroll — every selected Role as its own chip; do not wrap, do not +N.
// Each Role is its own muted HOUSE_PILL. Omit the rail when empty.
export const SOCIAL_PROFILE_ROLES_RAIL_ROWS = 1;
export const SOCIAL_PROFILE_ROLES_ROW_CLASS = HOUSE_CHIP_RAIL_CLASS;

export const SOCIAL_PROFILE_ROLE_PILL_CLASS =
  `w-fit ${HOUSE_PILL_ITEM_CLASS} ${HOUSE_FILTER_OFF_CLASS}`;

// Home Topics aliases the house chip rail. Not SegmentedTrack: lenses
// stay discrete chips (All first). Selected uses HOUSE_PILL_SELECTED_CLASS
// (accent fill + white). Idle stays HOUSE_CHIP_RAIL_CHIP_CLASS.
// Adam 2026-09-20: one horizontal chip row. Phone: same one-row scroll
// (never truncate — scroll). HOUSE_CHIP_RAIL_ROWS stays 2 for every
// other chip-rail consumer.
export const SOCIAL_TOPIC_RAIL_ROWS = 1;
export const SOCIAL_TOPIC_RAIL_CLASS = HOUSE_CHIP_RAIL_CLASS;
export const SOCIAL_TOPIC_RAIL_STACK_CLASS = HOUSE_CHIP_RAIL_STACK_CLASS;
export const SOCIAL_TOPIC_CHIP_ROW_CLASS = HOUSE_CHIP_RAIL_ROW_CLASS;
export const SOCIAL_TOPIC_RAIL_CHIP_CLASS = HOUSE_CHIP_RAIL_CHIP_CLASS;
export const SOCIAL_TOPIC_RAIL_CHIP_SELECTED_CLASS =
  `${HOUSE_SEGMENTED_ITEM_BASE_CLASS} ${HOUSE_PILL_SELECTED_CLASS}`;

export function socialTopicRailChipClass(selected: boolean): string {
  return selected ? SOCIAL_TOPIC_RAIL_CHIP_SELECTED_CLASS : SOCIAL_TOPIC_RAIL_CHIP_CLASS;
}

export const SOCIAL_FIRST_WIN_CLASS =
  "flex flex-col items-center justify-center gap-2.5 rounded-[8px] border border-hairline bg-surface px-5 pb-4 pt-5 text-center";

export const SOCIAL_AVATAR_SM_CLASS =
  "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body-sm font-medium text-ink-2";

// Person row and create-author stack. Primary is body; secondary is
// body-sm. Wrap. Never an 11px crumb.
export const SOCIAL_PERSON_PRIMARY_CLASS = "block break-words t-body font-semibold text-ink";

export const SOCIAL_PERSON_SECONDARY_CLASS = "block break-words t-body-sm text-ink-2";

export const SOCIAL_AVATAR_LG_CLASS =
  "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[length:var(--text-title)] font-semibold text-ink-2";

export const SOCIAL_AVATAR_PROFILE_CLASS =
  "flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[18px] font-semibold text-ink-2 md:size-[88px] md:text-[28px]";

export const SOCIAL_HANDLE_PILL_CLASS =
  "inline-flex items-center rounded-[8px] bg-surface-muted px-[10px] py-[6px] t-body-sm font-medium text-ink-2";

export const SOCIAL_PROFILE_TAB_CLASS =
  "flex shrink-0 flex-col items-center gap-2 whitespace-nowrap px-4 py-2.5 t-body md:gap-2 md:px-4";

export const SOCIAL_PROFILE_GRID_CLASS =
  "grid grid-cols-3 gap-px";

export const SOCIAL_PROFILE_TILE_CLASS =
  "relative aspect-square w-full overflow-hidden bg-surface-muted";

export const SOCIAL_PROFILE_PLAY_CLASS =
  "pointer-events-none absolute right-1.5 top-1.5 z-10 text-band-ink";

export const SOCIAL_HIGHLIGHT_RING_CLASS =
  "rounded-full border-2 border-accent p-[2px]";

// Quiet icon-only Share beside the primary profile CTA.
// House icon hits are circles. 44px floor. No label, no twin fill.
export const SOCIAL_SHARE_CLASS =
  "inline-flex size-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-surface-muted";

// 180:206 / 180:1946 / 181:2184 — Edit profile. Mobile full page; desktop
// 480 sheet on wash. 180:2004 / 180:2026 — Bio editor. Tokens only.
export const SOCIAL_PROFILE_EDIT_HOST_CLASS =
  "fixed inset-0 z-50 flex flex-col bg-bg md:items-center md:justify-center md:bg-ink/40";

export const SOCIAL_PROFILE_EDIT_SHEET_CLASS =
  "flex h-full w-full flex-col overflow-y-auto bg-bg md:h-auto md:max-h-[90dvh] md:w-[480px] md:rounded-[16px] md:border md:border-hairline md:bg-surface";

export const SOCIAL_PROFILE_EDIT_HEADER_CLASS =
  "flex h-16 shrink-0 items-center gap-2 border-b border-hairline bg-surface py-2 pl-2 pr-4";

export const SOCIAL_PROFILE_EDIT_BACK_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink";

export const SOCIAL_PROFILE_EDIT_DONE_CLASS =
  "shrink-0 t-body-sm font-semibold text-accent";

export const SOCIAL_PROFILE_BIO_DONE_CLASS =
  "flex shrink-0 items-center justify-center rounded-full bg-accent px-3 py-2 text-accent-contrast";

export const SOCIAL_PROFILE_EDIT_BODY_CLASS =
  "flex flex-col gap-[var(--space-4)] px-4 pb-10 pt-5 md:p-5";

export const SOCIAL_WELCOME_VIDEO_CLASS =
  `overflow-hidden ${SOCIAL_SURFACE_RADIUS_CLASS} border border-hairline bg-surface`;

export const SOCIAL_PROFILE_EDIT_PHOTO_CLASS =
  "flex flex-col items-center justify-center gap-[var(--space-3)]";

export const SOCIAL_PROFILE_EDIT_AVATAR_CLASS =
  "relative flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-muted text-ink";

export const SOCIAL_PROFILE_EDIT_AVATAR_DROPPING_CLASS =
  "border-accent bg-accent-wash";

export const SOCIAL_PROFILE_EDIT_PICTURE_CLASS =
  "t-body-sm font-medium text-accent";

export const SOCIAL_PROFILE_AVATAR_SHEET_HANDLE_CLASS =
  "mx-auto mb-1 h-1 w-10 shrink-0 touch-none rounded-full bg-ink-3/40";

export const SOCIAL_PROFILE_AVATAR_SHEET_HANDLE_HIT_CLASS =
  "flex w-full cursor-grab justify-center py-2 touch-none";

export const SOCIAL_PROFILE_AVATAR_SHEET_LIST_CLASS = "flex w-full flex-col";

export const SOCIAL_PROFILE_AVATAR_SHEET_ROW_CLASS =
  "flex w-full items-center gap-3 py-3 text-left t-body text-ink";

export const SOCIAL_PROFILE_AVATAR_SHEET_DANGER_CLASS =
  "flex w-full items-center gap-3 py-3 text-left t-body text-[#c4564a]";

export const SOCIAL_PROFILE_EDIT_CARD_CLASS =
  `flex w-full flex-col overflow-hidden ${SOCIAL_SURFACE_RADIUS_CLASS} border border-hairline bg-surface px-4`;

export const SOCIAL_PROFILE_EDIT_ROW_CLASS =
  "flex w-full items-start gap-3 py-3";

export const SOCIAL_PROFILE_EDIT_SECTION_CLASS = "flex flex-col gap-3 py-3";

// House type SoT — Settings/drill-in labels, not t-label ALL-CAPS
// + 0.12em track. One line, no mid-word ellipsis. 128px still
// fits sentence-case field names in the label column.
export const SOCIAL_HANDLE_FIELD_LABEL_CLASS = SETTINGS_DIALOG_LABEL_CLASS;
export const SOCIAL_HANDLE_PREFIX_CLASS = "shrink-0 select-none font-medium text-ink-2";
export const SOCIAL_HANDLE_FIELD_CLASS =
  `flex w-full items-center rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 ${HOUSE_VOICE_FOCUS_HOST_CLASS}`;

export const SOCIAL_PROFILE_EDIT_LABEL_CLASS =
  `w-32 shrink-0 whitespace-nowrap pt-0.5 ${SETTINGS_DIALOG_LABEL_CLASS}`;
export const SOCIAL_PROFILE_EDIT_HELP_CLASS = SETTINGS_DIALOG_HELP_CLASS;
export const SOCIAL_PROFILE_EDIT_ERROR_CLASS = SETTINGS_DIALOG_ERROR_CLASS;

export const SOCIAL_PROFILE_EDIT_HANDLE_CLASS =
  "flex min-w-0 flex-1 items-center rounded-[12px] bg-surface-muted px-3 py-2.5 t-control";

export const SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS =
  "flex min-w-0 flex-1 items-center rounded-[12px] border border-ink bg-surface-muted px-3 py-2.5 t-control";

export const SOCIAL_PROFILE_BIO_CARD_CLASS =
  "flex w-full flex-col gap-4 rounded-[16px] border border-hairline bg-surface p-4";

// 155:194 / 155:372 — wash overlay, QR card, three actions. No glass, no drop shadow.
export const SOCIAL_SHARE_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-bg";

export const SOCIAL_SHARE_SHEET_WASH_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-accent/18 to-transparent md:h-[520px] md:from-accent/12";

export const SOCIAL_SHARE_SHEET_CHROME_CLASS =
  "relative flex h-16 shrink-0 items-center px-[var(--space-4)]";

export const SOCIAL_SHARE_SHEET_CLOSE_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/8 text-ink";

export const SOCIAL_SHARE_SHEET_BODY_CLASS =
  "relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[var(--space-6)] px-[var(--space-4)] pb-[var(--space-12)] md:gap-[var(--space-8)]";

export const SOCIAL_SHARE_SHEET_CARD_CLASS =
  "flex w-[310px] flex-col items-center justify-center gap-[var(--space-6)] rounded-[24px] border border-hairline bg-surface px-[var(--space-6)] py-[var(--space-8)] md:h-[420px] md:w-[360px]";

export const SOCIAL_SHARE_SHEET_QR_CLASS =
  "relative size-[240px] overflow-hidden bg-surface text-accent";

export const SOCIAL_SHARE_SHEET_MARK_CLASS =
  "absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[12px] border-2 border-accent bg-surface text-[16px] font-semibold text-accent";

export const SOCIAL_SHARE_SHEET_HANDLE_CLASS =
  "t-body font-semibold tracking-[0.06em] text-accent";

export const SOCIAL_SHARE_SHEET_ACTIONS_CLASS =
  "flex items-center justify-center gap-[var(--space-2)] md:gap-[var(--space-4)]";

export const SOCIAL_SHARE_SHEET_ACTION_CLASS =
  "flex w-[114px] flex-col items-center justify-center gap-[var(--space-2)] rounded-[16px] border border-hairline bg-surface py-[var(--space-4)] text-[length:var(--text-xs)] font-medium text-ink md:w-[128px]";

export const SOCIAL_CREATE_CARD_CLASS =
  "flex flex-col gap-3 rounded-[8px] border border-hairline bg-surface p-4 md:gap-4 md:p-6";

export const SOCIAL_CREATE_WELL_CLASS =
  "flex h-[220px] w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-hairline bg-surface-muted px-4 py-7 text-center md:h-[320px] md:gap-2.5 md:px-6 md:py-10";

export const SOCIAL_CREATE_AVATAR_CLASS =
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body-sm font-semibold text-ink-2 md:size-12";

export const SOCIAL_STORY_PICKER_CLASS =
  "flex w-full max-w-[420px] flex-col gap-4 rounded-[24px] border border-hairline bg-surface p-6";

export const SOCIAL_STORY_PICKER_ROW_CLASS =
  "flex w-full items-center gap-4 rounded-[16px] border border-hairline bg-surface p-4 text-left";

export const SOCIAL_STORY_PICKER_WELL_CLASS =
  "flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink";

export const SOCIAL_STORY_STUDIO_CLASS =
  "fixed inset-0 z-50 flex bg-band text-band-ink md:items-center md:justify-center";

export const SOCIAL_STORY_STUDIO_STAGE_CLASS =
  "relative flex h-full w-full flex-col overflow-hidden bg-band md:h-[746px] md:max-h-[90dvh] md:w-[420px] md:rounded-[16px] md:border md:border-band-ink/20";

// Live preview: contain, not cover. Cover on a tall stage + landscape camera
// stream crops to a center strip (extreme zoom). Review/viewer stay cover.
export const SOCIAL_STORY_STUDIO_PREVIEW_CLASS =
  "absolute inset-0 size-full object-contain";

export const SOCIAL_STORY_STUDIO_PREVIEW_MIRROR_CLASS = "-scale-x-100";

export const SOCIAL_STORY_STUDIO_REVIEW_CLASS =
  "absolute inset-0 size-full object-cover";

export function socialStoryStudioPreviewClass(mirrored: boolean): string {
  return mirrored
    ? `${SOCIAL_STORY_STUDIO_PREVIEW_CLASS} ${SOCIAL_STORY_STUDIO_PREVIEW_MIRROR_CLASS}`
    : SOCIAL_STORY_STUDIO_PREVIEW_CLASS;
}

export const SOCIAL_STORY_STUDIO_CHROME_CLASS =
  "absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between bg-band/35 p-4";

export const SOCIAL_STORY_STUDIO_ICON_CLASS =
  "flex size-10 items-center justify-center rounded-full bg-band-ink/12 text-band-ink";

export const SOCIAL_STORY_STUDIO_RING_CLASS =
  "pointer-events-none absolute left-1/2 top-[calc(50%-40px)] size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-band-ink/25 border-t-accent md:size-[240px]";

export const SOCIAL_STORY_RECORD_CLASS =
  "flex size-20 items-center justify-center rounded-full border-[3px] border-band-ink bg-accent text-accent-contrast";

export const SOCIAL_STORY_STOP_CLASS =
  "size-6 rounded-[4px] bg-accent-contrast";

export const SOCIAL_STORY_REC_PILL_CLASS =
  "absolute left-1/2 top-[72px] z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-2.5 py-1.5 t-label font-semibold text-accent-contrast";

export const SOCIAL_STORY_POSTED_CLASS =
  "flex w-full max-w-[326px] flex-col items-center gap-4 rounded-[16px] border border-hairline bg-surface px-6 py-8 text-center";

export const SOCIAL_MUX_PLAYER_CLASS =
  "social-mux-player block size-full overflow-hidden bg-surface-muted object-cover";
