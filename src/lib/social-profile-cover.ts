// Profile cover banner — Lock A (Adam 2026-09-20 / 2026-09-21).
// One SoT for sizes, upload master, and avatar hang. UI tokens live in
// social-chrome; this module is the numeric lock tests import.
//
// Upload master / LinkedIn header SoT = 1784×446 (Adam 2026-09-21).
// masterWidth × masterHeight is the named LinkedIn header lock.
// coverFit 1584×396 is a legacy cover-fit also accepted by LinkedIn —
// it is not the primary size. 1784×446 is the canonical target.
//
// Display: phone 112px, desktop 224px, column 892, aspect 4:1.
// Avatar hang ~40% (72 / 88). These display values are Lock A and
// must not change without a new founder lock.

import { SOCIAL_IMAGE_CONTENT_TYPES } from "@/lib/social-media";

export const SOCIAL_PROFILE_COVER_LOCK_A = {
  columnWidth: 892,
  heightMobile: 112,
  heightDesktop: 224,
  aspectWidth: 4,
  aspectHeight: 1,
  /** LinkedIn header SoT — 1784×446 (Adam 2026-09-21). */
  masterHeight: 446,
  /** LinkedIn header SoT — 1784×446 (Adam 2026-09-21). */
  masterWidth: 446 * 4,
  /** Legacy cover-fit also accepted by LinkedIn — not the primary size. */
  coverFitHeight: 396,
  /** Legacy cover-fit also accepted by LinkedIn — not the primary size. */
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
