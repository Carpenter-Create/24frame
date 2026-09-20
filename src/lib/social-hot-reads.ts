import "server-only";

import type { createClient } from "@/lib/supabase/server";
import {
  socialCountsCacheKey,
  socialFollowCacheKey,
  socialProfileCacheKey,
  socialProfileHandleCacheKey,
} from "@/lib/social-cache-keys";
import {
  loadIsFollowing,
  loadProfileSocialCounts,
  type SocialProfileCounts,
  type SocialProfileRow,
} from "@/lib/social-feed";
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
