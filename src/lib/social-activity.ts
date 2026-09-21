import { parsePostMedia } from "@/lib/social-media";
import {
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  type SocialProfileTab,
} from "@/lib/social";

// Profile Activity tab pills. Exclusive filter — house SegmentedTrack.
// Posts tab on the profile stays the IG grid. These pills are feed cards.

export const SOCIAL_ACTIVITY_PILL_PARAM = "activity";
export const SOCIAL_ACTIVITY_PILLS = ["posts", "comments", "images", "videos"] as const;
export type SocialActivityPill = (typeof SOCIAL_ACTIVITY_PILLS)[number];

export function parseSocialActivityPill(
  raw: string | string[] | undefined | null,
): SocialActivityPill {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "comments" || value === "images" || value === "videos") return value;
  return "posts";
}

export function socialActivityPillLabel(pill: SocialActivityPill): string {
  switch (pill) {
    case "comments":
      return SOCIAL.profile.activityComments;
    case "images":
      return SOCIAL.profile.activityImages;
    case "videos":
      return SOCIAL.profile.activityVideos;
    default:
      return SOCIAL.profile.activityPosts;
  }
}

export function socialActivityEmptyCopy(pill: SocialActivityPill): {
  title: string;
  hint: string;
} {
  switch (pill) {
    case "comments":
      return {
        title: SOCIAL.profile.activityCommentsEmpty,
        hint: SOCIAL.profile.activityCommentsEmptyHint,
      };
    case "images":
      return {
        title: SOCIAL.profile.activityImagesEmpty,
        hint: SOCIAL.profile.activityImagesEmptyHint,
      };
    case "videos":
      return {
        title: SOCIAL.profile.activityVideosEmpty,
        hint: SOCIAL.profile.activityVideosEmptyHint,
      };
    default:
      return {
        title: SOCIAL.profile.activityPostsEmpty,
        hint: SOCIAL.profile.activityPostsEmptyHint,
      };
  }
}

export function socialProfileActivityHref(base: string, pill: SocialActivityPill): string {
  const params = new URLSearchParams();
  params.set(SOCIAL_PROFILE_TAB_PARAM, "activity");
  if (pill !== "posts") params.set(SOCIAL_ACTIVITY_PILL_PARAM, pill);
  return `${base}?${params.toString()}`;
}

export function socialProfileTabSearch(
  tab: SocialProfileTab,
  activity?: SocialActivityPill,
): Record<string, string> {
  if (tab === "posts") return {};
  if (tab !== "activity") return { [SOCIAL_PROFILE_TAB_PARAM]: tab };
  if (!activity || activity === "posts") return { [SOCIAL_PROFILE_TAB_PARAM]: "activity" };
  return {
    [SOCIAL_PROFILE_TAB_PARAM]: "activity",
    [SOCIAL_ACTIVITY_PILL_PARAM]: activity,
  };
}

/** Image-only / video-only. Mixed rolls stay on the Posts pill. */
export function socialPostMatchesActivityMedia(
  media: unknown,
  pill: Extract<SocialActivityPill, "images" | "videos">,
): boolean {
  const items = parsePostMedia(media);
  if (items.length === 0) return false;
  const kind = pill === "images" ? "image" : "video";
  return items.every((item) => item.kind === kind);
}
