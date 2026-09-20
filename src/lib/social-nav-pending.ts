import {
  houseNavActivePath,
  houseNavIgnorePendingClick,
  houseNavPendingSettled,
  type HouseNavClickLike,
} from "@/lib/house-nav-pending";

// Social rail aliases the house pending SoT. Do not fork a second
// pending grammar for Social dests.

export type SocialNavClickLike = HouseNavClickLike;

export const socialNavIgnorePendingClick = houseNavIgnorePendingClick;

export const socialNavActivePath = houseNavActivePath;

export const socialNavPendingSettled = houseNavPendingSettled;
