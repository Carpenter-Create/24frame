// Social measured chrome. Tokens only — no hex.
// Home ship: Figma 130:215 / 133:816 / 133:1078.
// Profile ship: Figma 129:215 / 129:415 / 129:615.
// Create ship: Figma 135:585 / 135:1037 / 135:1214.
// Stories ship: Figma 138:163 / 138:889 / 138:943.
// Stories studio: Figma 146:230 / 146:1050 / 146:1072 / 146:1099
//   desktop 146:1125 / 146:1147 / 146:1173 / 147:251.
// Stories picker: Figma 144:1218 / 144:1444.
// No glass, no drop shadow. Aggregation / Settings Mercury stays elsewhere.

export const SOCIAL_FIGMA_HOME = "130:215";
export const SOCIAL_FIGMA_HOME_EMPTY = "133:816";
export const SOCIAL_FIGMA_HOME_MOBILE = "133:1078";
export const SOCIAL_FIGMA_PROFILE = ["129:215", "129:415", "129:615"] as const;
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

export const SOCIAL_RAIL_WIDTH_CLASS = "w-[240px]";
export const SOCIAL_RAIL_MAIN_OFFSET_CLASS = "md:ml-[240px]";
export const SOCIAL_FOR_YOU_WIDTH_CLASS = "w-[300px]";
export const SOCIAL_CENTER_WIDTH_CLASS = "w-full min-w-0 lg:max-w-[680px]";

export const SOCIAL_PAGE_CLASS =
  "flex flex-col gap-[var(--space-4)] pb-[var(--space-12)]";

export const SOCIAL_HOME_LAYOUT_CLASS =
  "flex items-start gap-[var(--space-4)]";

export const SOCIAL_HOME_CENTER_CLASS =
  "flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[680px]";

export const SOCIAL_FOR_YOU_RAIL_CLASS =
  "hidden w-[300px] shrink-0 flex-col gap-3 lg:flex";

export const SOCIAL_CARD_CLASS =
  "flex flex-col gap-[var(--space-3)] rounded-[8px] border border-hairline bg-surface p-[var(--space-4)]";

export const SOCIAL_CARD_MUTED_CLASS =
  "flex flex-col gap-[var(--space-3)] rounded-[8px] bg-surface-muted p-[var(--space-4)]";

export const SOCIAL_EMPTY_PANEL_CLASS =
  "flex flex-col items-center justify-center gap-[var(--space-4)] rounded-[8px] bg-surface-muted px-[var(--space-6)] py-[var(--space-12)] text-center";

export const SOCIAL_EMPTY_ACTION_CLASS =
  "inline-flex items-center justify-center rounded-[8px] bg-accent px-[var(--space-4)] py-[10px] t-body-sm font-medium text-accent-contrast";

export const SOCIAL_CHECKLIST_CLASS =
  "flex flex-col gap-[var(--space-2)] rounded-[8px] border border-hairline bg-surface p-[var(--space-4)]";

export const SOCIAL_CHECKLIST_ROW_CLASS = "border-b border-hairline py-[var(--space-3)]";

export const SOCIAL_CHECKLIST_ROW_LAST_CLASS = "py-[var(--space-3)]";

export const SOCIAL_PILL_CLASS =
  "rounded-full px-[14px] py-[var(--space-2)] t-body-sm whitespace-nowrap";

export const SOCIAL_PILL_ACTIVE_CLASS = "bg-accent font-medium text-accent-contrast";

export const SOCIAL_PILL_IDLE_CLASS = "bg-surface-muted text-ink";

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

export const SOCIAL_STORIES_CARD_CLASS =
  "flex h-[168px] w-[112px] shrink-0 items-center justify-center rounded-[16px] p-[3px]";

export const SOCIAL_STORIES_FACE_CLASS =
  "flex size-full flex-col items-center justify-center gap-[var(--space-2)] rounded-[13px] px-[var(--space-2)] py-[var(--space-4)]";

export const SOCIAL_STORIES_MEDIA_CLASS =
  "relative size-full overflow-hidden rounded-[13px] bg-surface-muted";

export const SOCIAL_STORIES_PLUS_WELL_CLASS =
  "flex size-9 items-center justify-center rounded-full bg-accent text-accent-contrast";

export const SOCIAL_STORIES_EMPTY_ACTION_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-[var(--space-4)] py-[10px] t-body-sm font-medium text-accent-contrast";

export const SOCIAL_STORY_VIEWER_CLASS =
  "mx-auto flex w-full max-w-[420px] flex-col gap-[var(--space-4)] rounded-[16px] border border-hairline bg-surface p-[var(--space-4)] md:max-w-[420px]";

export const SOCIAL_STORY_PROGRESS_BAR_CLASS = "h-[3px] flex-1 rounded-full";

export const SOCIAL_STORY_CARET_CLASS =
  "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-ink-2";

export const SOCIAL_COMPOSER_CLASS =
  "flex flex-col gap-2 border border-hairline bg-surface px-3 pb-2 pt-2.5";

export const SOCIAL_COMPOSER_FIELD_CLASS =
  "flex h-10 min-w-0 flex-1 items-center rounded-[20px] bg-surface-muted px-[16px] t-body text-ink-2";

export const SOCIAL_COMPOSER_ACTION_CLASS =
  "inline-flex items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] t-label font-medium text-ink-2";

export const SOCIAL_FOLLOW_COMPACT_CLASS =
  "inline-flex items-center rounded-[8px] bg-accent px-[10px] py-[5px] text-[11px] font-semibold text-accent-contrast";

export const SOCIAL_FOR_YOU_CARD_CLASS =
  "flex w-full flex-col gap-2 rounded-[8px] border border-hairline bg-surface p-3";

export const SOCIAL_FEED_ROW_CLASS =
  "flex flex-col gap-2 border-b border-hairline bg-surface p-3";

export const SOCIAL_CREATE_CTA_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-accent px-4 py-3 t-body font-semibold text-accent-contrast";

export const SOCIAL_ACCOUNT_CHIP_CLASS =
  "flex w-full items-center gap-2.5 rounded-[12px] border border-hairline bg-surface-muted p-2.5";

export const SOCIAL_TAB_BAR_CLASS =
  "fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface pb-[max(12px,env(safe-area-inset-bottom))] md:hidden";

export const SOCIAL_TAB_BAR_ROW_CLASS = "flex h-14 w-full items-center";

export const SOCIAL_TAB_ITEM_CLASS =
  "flex h-full flex-1 items-center justify-center px-2 py-3";

export const SOCIAL_TAB_BAR_MAIN_PAD_CLASS = "pb-20 md:pb-4";

export const SOCIAL_HOME_TAB_CLASS =
  "flex flex-1 flex-col items-center gap-2.5 px-4 pt-3 t-body";

export const SOCIAL_TOPIC_CHIP_CLASS =
  "inline-flex items-center rounded-[14px] bg-surface-muted px-[10px] py-[5px] text-[11px] font-medium text-ink";

export const SOCIAL_FIRST_WIN_CLASS =
  "flex flex-col items-center justify-center gap-2.5 rounded-[8px] border border-hairline bg-surface px-5 pb-4 pt-5 text-center";

export const SOCIAL_AVATAR_SM_CLASS =
  "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-label font-medium text-ink-2";

export const SOCIAL_AVATAR_LG_CLASS =
  "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[length:var(--text-title)] font-semibold text-ink-2";

export const SOCIAL_AVATAR_PROFILE_CLASS =
  "flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[18px] font-semibold text-ink-2 md:size-[88px] md:text-[28px]";

export const SOCIAL_HANDLE_PILL_CLASS =
  "inline-flex items-center rounded-[8px] bg-surface-muted px-[10px] py-[6px] t-body-sm font-medium text-ink-2";

export const SOCIAL_PROFILE_TAB_CLASS =
  "flex flex-col items-center gap-2 px-4 py-2.5 t-body md:gap-2 md:px-4";

export const SOCIAL_PROFILE_GRID_CLASS =
  "grid grid-cols-3 gap-1.5 md:gap-2";

export const SOCIAL_PROFILE_TILE_CLASS =
  "relative flex h-[140px] flex-col justify-between overflow-hidden rounded-[8px] bg-surface-muted p-2.5 md:h-[220px] md:p-[var(--space-4)]";

export const SOCIAL_HIGHLIGHT_RING_CLASS =
  "rounded-full border-2 border-accent p-[2px]";

export const SOCIAL_SHARE_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-hairline bg-surface px-[14px] py-[var(--space-2)] t-body-sm font-medium text-ink";

export const SOCIAL_CREATE_CARD_CLASS =
  "flex flex-col gap-3 rounded-[8px] border border-hairline bg-surface p-4 md:gap-4 md:p-6";

export const SOCIAL_CREATE_WELL_CLASS =
  "flex h-[220px] w-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-hairline bg-surface-muted px-4 py-7 text-center md:h-[320px] md:gap-2.5 md:px-6 md:py-10";

export const SOCIAL_CREATE_KIND_CLASS =
  "inline-flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[12px] md:gap-1.5 md:px-[14px] md:py-2 md:text-[13px]";

export const SOCIAL_CREATE_AVATAR_CLASS =
  "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[12px] font-semibold text-ink-2 md:size-10 md:text-[14px]";

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
