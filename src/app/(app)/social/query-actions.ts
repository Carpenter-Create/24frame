"use server";

import {
  loadCachedFolloweeIds,
  loadCachedFollowingPosts,
  loadCachedIsFollowing,
  loadCachedProfileSocialCounts,
  loadCachedSocialProfileById,
} from "@/lib/social-hot-reads";
import {
  parseSocialCategoryParam,
  SOCIAL_CATEGORY_ALL,
} from "@/lib/social-categories";
import type { SocialFollowingWallPage, SocialProfileCounts, SocialProfileRow } from "@/lib/social-feed";
import { followingAuthorIds } from "@/lib/social-home";
import { parseFollowingWallCursorParam } from "@/lib/social-home-bounds";
import { loadSocialSession } from "@/lib/social-session";

export async function readSocialProfile(profileId: string): Promise<SocialProfileRow | null> {
  const session = await loadSocialSession();
  if (!session || !profileId) return null;
  return loadCachedSocialProfileById(session.supabase, profileId);
}

export async function readSocialCounts(profileId: string): Promise<SocialProfileCounts | null> {
  const session = await loadSocialSession();
  if (!session || !profileId) return null;
  return loadCachedProfileSocialCounts(session.supabase, profileId);
}

export async function readSocialFollowState(targetId: string): Promise<boolean> {
  const session = await loadSocialSession();
  if (!session || !targetId) return false;
  return loadCachedIsFollowing(session.supabase, session.ctx.user.id, targetId);
}

export async function readSocialFollowingWall(input: {
  topic?: string;
  cursor?: string | null;
}): Promise<SocialFollowingWallPage | null> {
  const session = await loadSocialSession();
  if (!session) return null;
  const followees = await loadCachedFolloweeIds(session.supabase, session.ctx.user.id);
  const topic = parseSocialCategoryParam(input.topic);
  const category = topic === SOCIAL_CATEGORY_ALL ? null : topic;
  return loadCachedFollowingPosts(
    session.supabase,
    session.ctx.user.id,
    followingAuthorIds(session.ctx.user.id, followees.ids),
    { category, cursor: parseFollowingWallCursorParam(input.cursor ?? undefined) },
  );
}
