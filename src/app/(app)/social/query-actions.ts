"use server";

import {
  loadCachedIsFollowing,
  loadCachedProfileSocialCounts,
  loadCachedSocialProfileById,
} from "@/lib/social-hot-reads";
import type { SocialProfileCounts } from "@/lib/social-feed";
import type { SocialProfileRow } from "@/lib/social-feed";
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
