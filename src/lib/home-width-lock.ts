// Home width SoT. Stamp: HOME-width-lock.md (amended 2026-09-18).
// Header stays full-bleed. Dest rail stays off. Phone unchanged.
// Dest rail is off on Home — do not inset with `--sidebar-width`.

export const HOME_FIGMA_FRAME_PX = 1440;
/** House `--content-inset`. Calm left breath — not the dest-rail slot. */
export const HOME_LEFT_INSET_PX = 48;
/** House `--chrome-gutter`. Slight News outer inset — not a second rail. */
export const HOME_RIGHT_INSET_PX = 16;
export const HOME_CONTENT_COLUMN_PX =
  HOME_FIGMA_FRAME_PX - HOME_LEFT_INSET_PX - HOME_RIGHT_INSET_PX;

export const HOME_WIDTH_LOCK = {
  figmaFrame: HOME_FIGMA_FRAME_PX,
  leftInset: HOME_LEFT_INSET_PX,
  rightInset: HOME_RIGHT_INSET_PX,
  contentColumn: HOME_CONTENT_COLUMN_PX,
} as const;
