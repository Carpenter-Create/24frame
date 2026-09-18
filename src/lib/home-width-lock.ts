// Figma Home width SoT. Stamp: HOME-width-lock.md (amended 2026-09-18).
// Header stays full-bleed. Dest rail stays off. Phone unchanged.

export const HOME_FIGMA_FRAME_PX = 1440;
export const HOME_ACCESS_RAIL_INSET_PX = 220;
export const HOME_CONTENT_COLUMN_PX = 1220;

export const HOME_WIDTH_LOCK = {
  figmaFrame: HOME_FIGMA_FRAME_PX,
  phantomAccessRail: HOME_ACCESS_RAIL_INSET_PX,
  contentColumn: HOME_CONTENT_COLUMN_PX,
} as const;
