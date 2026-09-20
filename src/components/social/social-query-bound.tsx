"use client";

import { useQuery } from "@tanstack/react-query";

import {
  readSocialCounts,
  readSocialFollowState,
  readSocialProfile,
} from "@/app/(app)/social/query-actions";
import { useAppQueryClient } from "@/components/query-provider";
import {
  SOCIAL_QUERY_STALE_MS,
  socialCountsQueryKey,
  socialFollowQueryKey,
  socialProfileQueryKey,
} from "@/lib/social-cache-keys";
import type { SocialProfileCounts, SocialProfileRow } from "@/lib/social-feed";

export type SocialQueryFollowSeed = {
  viewerId: string;
  targetId: string;
  following: boolean;
};

// Registers own/public profile, counts, and follow-state in the one Query cache.
// Renders nothing. Pages still paint from the server payload (Redis → Supabase).

export function SocialQueryBound({
  profile,
  counts,
  follow = null,
}: {
  profile: SocialProfileRow;
  counts: SocialProfileCounts;
  follow?: SocialQueryFollowSeed | null;
}) {
  const client = useAppQueryClient();
  if (!client) return null;
  return <SocialQueryBoundLive profile={profile} counts={counts} follow={follow} />;
}

function SocialQueryBoundLive({
  profile,
  counts,
  follow,
}: {
  profile: SocialProfileRow;
  counts: SocialProfileCounts;
  follow: SocialQueryFollowSeed | null;
}) {
  useQuery({
    queryKey: socialProfileQueryKey(profile.id),
    queryFn: () => readSocialProfile(profile.id),
    initialData: profile,
    staleTime: SOCIAL_QUERY_STALE_MS,
  });
  useQuery({
    queryKey: socialCountsQueryKey(profile.id),
    queryFn: () => readSocialCounts(profile.id),
    initialData: counts,
    staleTime: SOCIAL_QUERY_STALE_MS,
  });
  useQuery({
    queryKey: socialFollowQueryKey(follow?.viewerId ?? "", follow?.targetId ?? ""),
    queryFn: () => readSocialFollowState(follow?.targetId ?? ""),
    initialData: follow?.following,
    enabled: Boolean(follow),
    staleTime: SOCIAL_QUERY_STALE_MS,
  });
  return null;
}
