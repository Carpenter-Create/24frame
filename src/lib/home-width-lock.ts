// Home width SoT. Stamp: HOME-width-lock.md.
// Desktop shell L/R follow shell-desktop-horizontal-gutter-lock-v2 (32 / 32).
// Header stays full-bleed. Dest rail stays off. Phone unchanged.
// Dest rail is off on Home — do not inset with `--sidebar-width`.

export const HOME_FIGMA_FRAME_PX = 1440;
/** Desktop shell inline start. Matches `--shell-gutter-inline-start`. */
export const HOME_LEFT_INSET_PX = 32;
/** Desktop shell inline end. Matches `--shell-gutter-inline-end`. */
export const HOME_RIGHT_INSET_PX = 32;
export const HOME_CONTENT_COLUMN_PX =
  HOME_FIGMA_FRAME_PX - HOME_LEFT_INSET_PX - HOME_RIGHT_INSET_PX;

export const HOME_WIDTH_LOCK = {
  figmaFrame: HOME_FIGMA_FRAME_PX,
  leftInset: HOME_LEFT_INSET_PX,
  rightInset: HOME_RIGHT_INSET_PX,
  contentColumn: HOME_CONTENT_COLUMN_PX,
} as const;
