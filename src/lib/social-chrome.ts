// Social measured chrome. Tokens only — no hex.
// Desktop Home Circle-primary: Figma 176:1085 / 176:1346.
// Prior desktop: 169:964 / 169:1281 (164:1136 / 164:1360 still in place).
// Mobile Home: Figma 169:1519 setup after Stories, before Following wall.
// Pill hide stays 160:1129.
// Profile ship: Figma 129:215 / 129:415 / 129:615.
// Profile share sheet: Figma 155:194 / 155:372.
// Create ship: Figma 135:585 / 135:1037 / 135:1214.
// Stories ship: Figma 138:163 / 138:889 / 138:943.
// Stories studio: Figma 146:230 / 146:1050 / 146:1072 / 146:1099
//   desktop 146:1125 / 146:1147 / 146:1173 / 147:251.
// Stories picker: Figma 144:1218 / 144:1444.
// No glass, no drop shadow. Aggregation / Settings Mercury stays elsewhere.

export const SOCIAL_FIGMA_HOME = "176:1085";
export const SOCIAL_FIGMA_HOME_EMPTY = "176:1346";
export const SOCIAL_FIGMA_HOME_MOBILE = "169:1519";
export const SOCIAL_FIGMA_HOME_MOBILE_SCROLL = "160:1129";
export const SOCIAL_FIGMA_HOME_DESKTOP_PRIOR = ["169:964", "169:1281", "164:1136", "164:1360"] as const;

// Desktop Social Home measure — 176:1085 / 176:1346.
// dest 200 | gutter 16 | chats 200 | gutter 16 | center 676 | gutter 16 | For you 300 | padR 16 = 1440.
export const SOCIAL_DESKTOP_MEASURE = {
  dest: 200,
  gutter: 16,
  chats: 200,
  center: 676,
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

export const SOCIAL_RAIL_WIDTH_CLASS = "w-[200px]";
export const SOCIAL_RAIL_MAIN_OFFSET_CLASS = "md:ml-[200px]";
export const SOCIAL_RAIL_PANEL_CLASS =
  "rounded-[16px] border border-hairline bg-surface";
export const SOCIAL_FOR_YOU_WIDTH_CLASS = "w-[300px]";
export const SOCIAL_CENTER_WIDTH_CLASS = "w-full min-w-0 lg:max-w-[676px]";
export const SOCIAL_DESKTOP_FRAME_PAD_CLASS = "w-full px-[16px] py-4";

export const SOCIAL_PAGE_CLASS =
  "flex flex-col gap-[var(--space-4)] pb-[var(--space-12)]";

export const SOCIAL_HOME_LAYOUT_CLASS = "flex items-start gap-[16px]";

export const SOCIAL_HOME_CENTER_CLASS =
  "flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[676px]";

export const SOCIAL_CHATS_COLUMN_CLASS =
  "hidden w-[200px] shrink-0 flex-col lg:flex";

export const SOCIAL_CHATS_PANEL_CLASS =
  "flex w-full flex-col gap-2 rounded-[16px] border border-hairline bg-surface p-4";

export const SOCIAL_CHAT_ROW_CLASS =
  "flex h-16 items-center gap-2 rounded-[12px] px-2";

export const SOCIAL_CHAT_ROW_MUTED_CLASS =
  "flex h-16 items-center gap-2 rounded-[12px] bg-surface-muted px-2";

export const SOCIAL_CHAT_EMPTY_CLASS =
  "flex flex-col items-center justify-center gap-2 rounded-[12px] px-4 py-6";

export const SOCIAL_AVATAR_32_CLASS =
  "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted t-label font-medium text-ink-2";

export const SOCIAL_FOR_YOU_RAIL_CLASS =
  "hidden w-[300px] shrink-0 flex-col gap-4 rounded-[16px] border border-hairline bg-surface p-4 lg:flex";

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

export const SOCIAL_CHECKLIST_TRACK_CLASS =
  "h-1 w-full overflow-hidden rounded-full bg-surface-muted";

export const SOCIAL_CHECKLIST_TRACK_NESTED_CLASS =
  "h-1 w-full overflow-hidden rounded-full bg-surface";

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

// Home tall FB-style cards — 160:482 / 160:964. Circular rings superseded.
export const SOCIAL_HOME_STORY_CARD_CLASS =
  "relative h-[192px] w-[108px] shrink-0 overflow-hidden rounded-[16px] border border-hairline bg-surface md:h-[200px] md:w-[112px]";

export const SOCIAL_HOME_STORY_CREATE_FACE_CLASS =
  "absolute inset-x-0 top-0 flex h-[114px] items-center justify-center overflow-hidden bg-surface-muted md:h-[120px]";

export const SOCIAL_HOME_STORY_CREATE_INITIAL_CLASS =
  "text-[32px] font-semibold text-ink-2/45 md:text-[40px]";

export const SOCIAL_HOME_STORY_PLUS_CLASS =
  "absolute left-1/2 top-[96px] z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-surface bg-accent text-accent-contrast md:top-[100px] md:size-10";

export const SOCIAL_HOME_STORY_CREATE_LABEL_CLASS =
  "absolute inset-x-0 bottom-0 flex h-[78px] items-center justify-center bg-surface px-2 text-center t-label font-medium text-ink md:h-20";

export const SOCIAL_HOME_STORY_FACE_RING_CLASS =
  "absolute left-2 top-2 z-10 flex size-8 items-center justify-center overflow-hidden rounded-full border-2 bg-surface p-[2px] md:left-[9px] md:top-[9px] md:size-9";

export const SOCIAL_HOME_STORY_FACE_CLASS =
  "flex size-full items-center justify-center overflow-hidden rounded-full bg-surface t-label font-semibold text-ink";

export const SOCIAL_HOME_STORY_NAME_CLASS =
  "absolute inset-x-0 bottom-0 flex h-10 items-center bg-band/55 px-2 t-label font-medium text-band-ink md:h-12 md:px-2.5";

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

// Home composer compact — 160:482 / 160:741 / 160:964 / 160:1129.
// Single row: avatar | field (text) | media icon. Photo|Video|Text pills gone
// on this surface only. Create keeps its kind pills.
export const SOCIAL_COMPOSER_CLASS =
  "flex h-16 items-center gap-3 rounded-[16px] border border-hairline bg-surface px-3 py-3 md:px-4";

export const SOCIAL_COMPOSER_FIELD_CLASS =
  "flex h-9 min-w-0 flex-1 items-center t-body text-ink-2";

export const SOCIAL_COMPOSER_MEDIA_CLASS =
  "relative flex size-9 shrink-0 cursor-pointer items-center justify-center text-ink-2";

export const SOCIAL_FOLLOW_COMPACT_CLASS =
  "inline-flex items-center rounded-[8px] bg-accent px-[10px] py-[5px] text-[11px] font-semibold text-accent-contrast";

export const SOCIAL_FOR_YOU_CARD_CLASS =
  "flex w-full flex-col gap-2 rounded-[12px] bg-surface-muted p-4";

export const SOCIAL_FEED_ROW_CLASS =
  "flex flex-col gap-2 border-b border-hairline bg-surface p-3";

export const SOCIAL_CREATE_CTA_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-accent px-4 py-3 t-body font-semibold text-accent-contrast";

export const SOCIAL_ACCOUNT_CHIP_CLASS =
  "flex w-full items-center gap-2.5 rounded-[12px] border border-hairline bg-surface-muted p-2.5";

// Floating pill — 160:964 visible / 160:1129 hidden on scroll-down.
// Desktop left Aggregation rail is unchanged; pill is md:hidden.
export const SOCIAL_TAB_BAR_CLASS =
  "fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out md:hidden";

export const SOCIAL_TAB_PILL_CLASS =
  "flex h-14 w-[min(358px,calc(100%-32px))] items-center rounded-[28px] border border-hairline bg-surface px-2";

export const SOCIAL_TAB_PILL_HIDDEN_CLASS = "pointer-events-none translate-y-full";

export const SOCIAL_TAB_BAR_ROW_CLASS = "flex h-12 w-full items-center";

export const SOCIAL_TAB_ITEM_CLASS =
  "flex h-full flex-1 items-center justify-center px-2 py-3";

export const SOCIAL_TAB_BAR_MAIN_PAD_CLASS = "pb-20 md:pb-4";

export const SOCIAL_HOME_TAB_CLASS =
  "flex flex-1 flex-col items-center gap-2.5 px-4 pt-3 t-body";

export const SOCIAL_TOPIC_CHIP_CLASS =
  "inline-flex items-center rounded-[14px] bg-surface px-[10px] py-[5px] text-[11px] font-medium text-ink";

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
  "flex shrink-0 flex-col items-center gap-2 whitespace-nowrap px-4 py-2.5 t-body md:gap-2 md:px-4";

export const SOCIAL_PROFILE_GRID_CLASS =
  "grid grid-cols-3 gap-1.5 md:gap-2";

export const SOCIAL_PROFILE_TILE_CLASS =
  "relative flex h-[140px] flex-col justify-between overflow-hidden rounded-[8px] bg-surface-muted p-2.5 md:h-[220px] md:p-[var(--space-4)]";

export const SOCIAL_HIGHLIGHT_RING_CLASS =
  "rounded-full border-2 border-accent p-[2px]";

export const SOCIAL_SHARE_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-hairline bg-surface px-[14px] py-[var(--space-2)] t-body-sm font-medium text-ink";

// 180:206 / 180:1946 / 181:2184 — Edit profile. Mobile full page; desktop
// 480 sheet on wash. 180:2004 / 180:2026 — Bio editor. Tokens only.
export const SOCIAL_PROFILE_EDIT_HOST_CLASS =
  "fixed inset-0 z-50 flex flex-col bg-bg md:items-center md:justify-center md:bg-ink/40";

export const SOCIAL_PROFILE_EDIT_SHEET_CLASS =
  "flex h-full w-full flex-col overflow-y-auto bg-bg md:h-auto md:max-h-[90dvh] md:w-[480px] md:rounded-[16px] md:border md:border-hairline md:bg-surface";

export const SOCIAL_PROFILE_EDIT_HEADER_CLASS =
  "flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface py-2 pl-2 pr-4";

export const SOCIAL_PROFILE_EDIT_BACK_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink";

export const SOCIAL_PROFILE_EDIT_DONE_CLASS =
  "shrink-0 t-body-sm font-semibold text-accent";

export const SOCIAL_PROFILE_BIO_DONE_CLASS =
  "flex shrink-0 items-center justify-center rounded-full bg-accent px-3 py-2 text-accent-contrast";

export const SOCIAL_PROFILE_EDIT_BODY_CLASS =
  "flex flex-col gap-6 px-4 pb-12 pt-6 md:p-6";

export const SOCIAL_PROFILE_EDIT_PHOTO_CLASS =
  "flex flex-col items-center justify-center gap-4";

export const SOCIAL_PROFILE_EDIT_AVATAR_CLASS =
  "flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-muted text-ink";

export const SOCIAL_PROFILE_EDIT_PICTURE_CLASS =
  "t-body-sm font-medium text-accent";

export const SOCIAL_PROFILE_EDIT_CARD_CLASS =
  "flex w-full flex-col overflow-hidden rounded-[16px] border border-hairline bg-surface px-4";

export const SOCIAL_PROFILE_EDIT_ROW_CLASS =
  "flex w-full items-start gap-4 py-4";

export const SOCIAL_PROFILE_EDIT_LABEL_CLASS =
  "w-[88px] shrink-0 pt-0.5 t-label text-ink-2 md:w-24";

export const SOCIAL_PROFILE_EDIT_HANDLE_CLASS =
  "flex min-w-0 flex-1 items-center rounded-[12px] bg-surface-muted px-3 py-2.5 t-body-sm";

export const SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS =
  "flex min-w-0 flex-1 items-center rounded-[12px] border border-ink bg-surface-muted px-3 py-2.5 t-body-sm";

export const SOCIAL_PROFILE_BIO_CARD_CLASS =
  "flex w-full flex-col gap-4 rounded-[16px] border border-hairline bg-surface p-4";

export const SOCIAL_PROFILE_BIO_TEXTAREA_CLASS =
  "min-h-[120px] w-full resize-none bg-transparent t-body-sm leading-[22px] text-ink outline-none placeholder:text-ink-3";

// 155:194 / 155:372 — wash overlay, QR card, three actions. No glass, no drop shadow.
export const SOCIAL_SHARE_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-bg";

export const SOCIAL_SHARE_SHEET_WASH_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-accent/18 to-transparent md:h-[520px] md:from-accent/12";

export const SOCIAL_SHARE_SHEET_CHROME_CLASS =
  "relative flex h-14 shrink-0 items-center px-[var(--space-4)]";

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
