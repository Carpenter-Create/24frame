import { SOCIAL_ROUTES } from "@/lib/social";

// Social workspace Phosphor lock (Adam). Aggregation stays Lucide.
// Bold for idle. Fill for the active job.

export const SOCIAL_PHOSPHOR_ICONS = [
  "house",
  "compass",
  "plus",
  "chat-circle",
  "user",
  "check",
  "image",
  "warning-circle",
  "camera",
  "caret-left",
  "caret-right",
  "x",
  "heart",
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
export const SOCIAL_ICON_SIZE_DOCK = 22;
export const SOCIAL_ICON_SIZE_EMPTY = 40;
