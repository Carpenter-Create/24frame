// Profile cover banner — Lock A (Adam 2026-09-20 / 2026-09-21).
// One SoT for sizes, upload master, and avatar hang. UI tokens live in
// social-chrome; this module is the numeric lock tests import.

import { SOCIAL_IMAGE_CONTENT_TYPES } from "@/lib/social-media";

export const SOCIAL_PROFILE_COVER_LOCK_A = {
  columnWidth: 892,
  heightMobile: 112,
  heightDesktop: 224,
  aspectWidth: 4,
  aspectHeight: 1,
  masterHeight: 446,
  masterWidth: 446 * 4,
  coverFitHeight: 396,
  coverFitWidth: 396 * 4,
  avatarHangRatio: 0.4,
  avatarSizeMobile: 72,
  avatarSizeDesktop: 88,
} as const;

export const SOCIAL_PROFILE_COVER_HANG_MOBILE_PX = Math.round(
  SOCIAL_PROFILE_COVER_LOCK_A.avatarSizeMobile * SOCIAL_PROFILE_COVER_LOCK_A.avatarHangRatio,
);

export const SOCIAL_PROFILE_COVER_HANG_DESKTOP_PX = Math.round(
  SOCIAL_PROFILE_COVER_LOCK_A.avatarSizeDesktop * SOCIAL_PROFILE_COVER_LOCK_A.avatarHangRatio,
);

export const SOCIAL_PROFILE_COVER_ACCEPT = SOCIAL_IMAGE_CONTENT_TYPES.join(",");
