// Profile cover banner — Lock A (Adam 2026-09-20 / 2026-09-21).
// One SoT for sizes, upload master, and avatar hang. UI tokens live in
// social-chrome; this module is the numeric lock tests import.
//
// Upload master / LinkedIn header SoT = 1784×446 (Adam 2026-09-21).
// masterWidth × masterHeight is the named LinkedIn header lock.
// coverFit 1584×396 is a legacy cover-fit also accepted by LinkedIn —
// it is not the primary size. 1784×446 is the canonical target.
//
// Display: phone 112px, desktop 224px, column = SOCIAL_DESKTOP_MEASURE.center, aspect 4:1.
// Avatar lip ~40% (72 / 88 → 29 / 35). The lip is the face only.
// Name and counts stay on the page. Crop master stays 1784×446 and
// is never painted in the profile UI.

import { SOCIAL_DESKTOP_MEASURE } from "@/lib/social-chrome";
import { SOCIAL_IMAGE_CONTENT_TYPES } from "@/lib/social-media";

export const SOCIAL_PROFILE_COVER_LOCK_A = {
  columnWidth: SOCIAL_DESKTOP_MEASURE.center,
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

export const COVER_CROP_VIEW_WIDTH = 320;
export const COVER_CROP_VIEW_HEIGHT = 80;
export const COVER_CROP_OUTPUT_WIDTH = SOCIAL_PROFILE_COVER_LOCK_A.masterWidth;
export const COVER_CROP_OUTPUT_HEIGHT = SOCIAL_PROFILE_COVER_LOCK_A.masterHeight;
export const COVER_CROP_OUTPUT_NAME = "cover.jpg";
export const COVER_CROP_MAX_BYTES = 10 * 1024 * 1024;

/** Trimmed cover URL. Blank is absent — visitors must not paint an empty band. */
export function socialProfileCoverPhoto(coverUrl?: string | null): string | null {
  if (typeof coverUrl !== "string") return null;
  const photo = coverUrl.trim();
  return photo.length > 0 ? photo : null;
}

/**
 * Owner keeps the band so Add cover stays on it.
 * Visitors render the band only when a real cover photo exists.
 */
export function socialProfileRendersCoverBand(input: {
  coverUrl?: string | null;
  owner: boolean;
}): boolean {
  return input.owner || socialProfileCoverPhoto(input.coverUrl) !== null;
}
