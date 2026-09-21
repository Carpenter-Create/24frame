import { SOCIAL_ROUTES } from "@/lib/social";

// Social workspace Phosphor lock (Adam). Aggregation chrome uses
// NavGlyph / phosphor-icon.
// Bold for idle. Fill for the active job.

export const SOCIAL_PHOSPHOR_ICONS = [
  "house",
  "compass",
  "plus",
  "chat-circle",
  "user",
  "check",
  "image",
  "users",
  "warning-circle",
  "camera",
  "caret-left",
  "caret-right",
  "x",
  "heart",
  "film-strip",
  "film-slate",
  "squares-four",
  "magnifying-glass",
  "tray",
  "paper-plane-tilt",
  "play",
  "share-network",
  "link",
  "download-simple",
  "text-t",
  "upload-simple",
  "camera-rotate",
  "pencil-simple",
  "check-circle",
  "trash",
  "broadcast",
] as const;

export type SocialPhosphorIconName = (typeof SOCIAL_PHOSPHOR_ICONS)[number];

export const SOCIAL_NAV_ICON_BY_HREF: Record<string, SocialPhosphorIconName> = {
  [SOCIAL_ROUTES.home]: "house",
  [SOCIAL_ROUTES.explore]: "compass",
  [SOCIAL_ROUTES.create]: "plus",
  [SOCIAL_ROUTES.dms]: "chat-circle",
  [SOCIAL_ROUTES.profile]: "user",
};

export function socialNavIconName(href: string): SocialPhosphorIconName {
  return SOCIAL_NAV_ICON_BY_HREF[href] ?? "house";
}

export const SOCIAL_ICON_SIZE_NAV = 20;
export const SOCIAL_ICON_SIZE_TAB = 22;
export const SOCIAL_ICON_SIZE_EMPTY = 40;
export const SOCIAL_ICON_SIZE_STORY_CREATE = 28;
export const SOCIAL_ICON_SIZE_STORY_PLUS = 20;
export const SOCIAL_ICON_SIZE_COMPOSER = 22;
export const SOCIAL_ICON_SIZE_CREATE_TILE = 32;
export const SOCIAL_ICON_SIZE_SEARCH = 16;
export const SOCIAL_ICON_SIZE_HEADER = 20;
export const SOCIAL_ICON_SIZE_SHARE = 16;
export const SOCIAL_ICON_SIZE_PROFILE_PLAY = 16;
export const SOCIAL_ICON_SIZE_SHARE_SHEET_CLOSE = 18;
export const SOCIAL_ICON_SIZE_SHARE_SHEET_ACTION = 22;
export const SOCIAL_ICON_SIZE_STORY_PICKER = 24;
export const SOCIAL_ICON_SIZE_STORY_PICKER_CLOSE = 18;
export const SOCIAL_ICON_SIZE_STORY_FOOTNOTE = 14;
export const SOCIAL_ICON_SIZE_STORY_STUDIO = 20;
export const SOCIAL_ICON_SIZE_STORY_PLAY = 28;
export const SOCIAL_ICON_SIZE_STORY_POSTED = 48;
