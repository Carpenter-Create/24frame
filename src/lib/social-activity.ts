import { parsePostMedia } from "@/lib/social-media";
import {
  SOCIAL,
  SOCIAL_PROFILE_DEFAULT_TAB,
  SOCIAL_PROFILE_TAB_PARAM,
  parseSocialProfileTab,
  resolveSocialProfileTab,
  socialProfileTabHref,
  type SocialProfileTab,
} from "@/lib/social";

// Profile Activity tab pills. Exclusive filter — house SegmentedTrack.
// Activity is the default profile tab. Posts / Comments / Images / Videos
// are pills on that feed — not a twin top-level Posts tab.

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
  if (pill === "posts") return base;
  const params = new URLSearchParams();
  params.set(SOCIAL_PROFILE_TAB_PARAM, SOCIAL_PROFILE_DEFAULT_TAB);
  params.set(SOCIAL_ACTIVITY_PILL_PARAM, pill);
  return `${base}?${params.toString()}`;
}

export function socialProfileViewHref(
  base: string,
  tab: SocialProfileTab,
  activity: SocialActivityPill = "posts",
): string {
  return tab === SOCIAL_PROFILE_DEFAULT_TAB
    ? socialProfileActivityHref(base, activity)
    : socialProfileTabHref(base, tab);
}

export function socialProfileTabSearch(
  tab: SocialProfileTab,
  activity?: SocialActivityPill,
): Record<string, string> {
  if (tab !== SOCIAL_PROFILE_DEFAULT_TAB) return { [SOCIAL_PROFILE_TAB_PARAM]: tab };
  if (!activity || activity === "posts") return {};
  return {
    [SOCIAL_PROFILE_TAB_PARAM]: SOCIAL_PROFILE_DEFAULT_TAB,
    [SOCIAL_ACTIVITY_PILL_PARAM]: activity,
  };
}

export function readSocialProfileLocation(search: string): {
  tab: SocialProfileTab;
  activity: SocialActivityPill;
} {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    tab: parseSocialProfileTab(params.get(SOCIAL_PROFILE_TAB_PARAM)),
    activity: parseSocialActivityPill(params.get(SOCIAL_ACTIVITY_PILL_PARAM)),
  };
}

/**
 * Owned house search wins so a ?tab= pushState swaps the panel.
 * Before the shell owns the address, an empty Next search is the
 * Suspense fallback — keep the RSC seed so a deep link paints the right tab.
 */
export function resolveSocialProfileLocation(input: {
  owned: boolean;
  search: string;
  nextSearch: string;
  seedTab: SocialProfileTab;
  seedActivity: SocialActivityPill;
  tabs?: readonly SocialProfileTab[];
}): { tab: SocialProfileTab; activity: SocialActivityPill } {
  const source = input.owned ? input.search : input.nextSearch.length > 0 ? input.nextSearch : null;
  const read =
    source === null
      ? { tab: input.seedTab, activity: input.seedActivity }
      : readSocialProfileLocation(source);
  return {
    tab: resolveSocialProfileTab(read.tab, input.tabs),
    activity: read.activity,
  };
}

/** Ids for the Images and Videos pills. Both come from the Posts page. */
export function socialActivityMediaPostIds(
  posts: readonly { id: string; media: unknown }[],
): { imageIds: string[]; videoIds: string[] } {
  const imageIds: string[] = [];
  const videoIds: string[] = [];
  for (const post of posts) {
    if (socialPostMatchesActivityMedia(post.media, "images")) imageIds.push(post.id);
    if (socialPostMatchesActivityMedia(post.media, "videos")) videoIds.push(post.id);
  }
  return { imageIds, videoIds };
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
