import "server-only";

import type { createClient } from "@/lib/supabase/server";
import {
  socialCountsCacheKey,
  socialFeedCacheKey,
  socialFollowCacheKey,
  socialFolloweeSetCacheKey,
  socialProfileCacheKey,
  socialProfileHandleCacheKey,
} from "@/lib/social-cache-keys";
import {
  loadFolloweeIds,
  loadFollowingPosts,
  loadIsFollowing,
  loadProfileSocialCounts,
  type SocialFolloweePage,
  type SocialFollowingWallPage,
  type SocialProfileCounts,
  type SocialProfileRow,
} from "@/lib/social-feed";
import type { FollowingWallCursor } from "@/lib/social-home-bounds";
import type { SocialCategoryTopic } from "@/lib/social-categories";
import { SOCIAL_PROFILE_COLUMNS } from "@/lib/social-profile";
import { socialHotSet, withSocialHotCache } from "@/lib/social-hot-cache";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadCachedSocialProfileById(
  supabase: ServerClient,
  profileId: string,
): Promise<SocialProfileRow | null> {
  return withSocialHotCache(socialProfileCacheKey(profileId), async () => {
    const { data } = await supabase
      .from("profiles")
      .select(SOCIAL_PROFILE_COLUMNS)
      .eq("id", profileId)
      .maybeSingle();
    return data ?? null;
  });
}

export async function loadCachedSocialProfileByHandle(
  supabase: ServerClient,
  handle: string,
): Promise<SocialProfileRow | null> {
  return withSocialHotCache(socialProfileHandleCacheKey(handle), async () => {
    const { data } = await supabase
      .from("profiles")
      .select(SOCIAL_PROFILE_COLUMNS)
      .eq("handle", handle)
      .maybeSingle();
    if (data) await socialHotSet(socialProfileCacheKey(data.id), data);
    return data ?? null;
  });
}

export async function loadCachedProfileSocialCounts(
  supabase: ServerClient,
  profileId: string,
): Promise<SocialProfileCounts> {
  return withSocialHotCache(socialCountsCacheKey(profileId), () =>
    loadProfileSocialCounts(supabase, profileId),
  );
}

export async function loadCachedIsFollowing(
  supabase: ServerClient,
  viewerId: string,
  targetId: string,
): Promise<boolean> {
  return withSocialHotCache(socialFollowCacheKey(viewerId, targetId), () =>
    loadIsFollowing(supabase, viewerId, targetId),
  );
}

export async function loadCachedFolloweeIds(
  supabase: ServerClient,
  viewerId: string,
): Promise<SocialFolloweePage> {
  return withSocialHotCache(socialFolloweeSetCacheKey(viewerId), () =>
    loadFolloweeIds(supabase, viewerId),
  );
}

export async function loadCachedFollowingPosts(
  supabase: ServerClient,
  viewerId: string,
  authorIds: readonly string[],
  opts?: { category?: SocialCategoryTopic | null; cursor?: FollowingWallCursor | null },
): Promise<SocialFollowingWallPage> {
  if (opts?.category || opts?.cursor) {
    return loadFollowingPosts(supabase, authorIds, opts);
  }
  return withSocialHotCache(socialFeedCacheKey(viewerId), () =>
    loadFollowingPosts(supabase, authorIds, opts),
  );
}
