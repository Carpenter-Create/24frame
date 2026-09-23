import {
  parseSocialCategoryParam,
  SOCIAL_CATEGORY_PARAM,
  type SocialCategoryLabel,
} from "@/lib/social-categories";
import { parseSocialHomeLane, SOCIAL_HOME_LANE_PARAM, type SocialHomeLane } from "@/lib/social";

export function readSocialHomeLocation(search: string): {
  lane: SocialHomeLane;
  topic: SocialCategoryLabel;
} {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    lane: parseSocialHomeLane(params.get(SOCIAL_HOME_LANE_PARAM)),
    topic: parseSocialCategoryParam(params.get(SOCIAL_CATEGORY_PARAM)),
  };
}

/**
 * Owned house search wins so a lane/topic click paints the chip
 * before SocialHomeCenter resolves. Before the shell owns the
 * address, an empty Next search is the Suspense fallback — keep
 * the RSC seed so a deep link paints the right chip.
 */
export function resolveSocialHomeLocation(input: {
  owned: boolean;
  search: string;
  nextSearch: string;
  seedLane: SocialHomeLane;
  seedTopic: SocialCategoryLabel;
}): { lane: SocialHomeLane; topic: SocialCategoryLabel } {
  const source = input.owned ? input.search : input.nextSearch.length > 0 ? input.nextSearch : null;
  if (source === null) return { lane: input.seedLane, topic: input.seedTopic };
  return readSocialHomeLocation(source);
}
