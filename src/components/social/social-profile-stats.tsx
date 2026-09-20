"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { readSocialCounts } from "@/app/(app)/social/query-actions";
import { useAppQueryClient } from "@/components/query-provider";
import { SOCIAL_QUERY_STALE_MS, socialCountsQueryKey } from "@/lib/social-cache-keys";
import { formatSocialCount, SOCIAL, socialProfileFollowsHref } from "@/lib/social";
import type { SocialProfileCounts } from "@/lib/social-feed";

export function SocialProfileStats({
  profileId,
  handle,
  stats,
}: {
  profileId?: string;
  handle: string;
  stats: SocialProfileCounts;
}) {
  const client = useAppQueryClient();
  if (!profileId || !client) {
    return <SocialProfileStatsView handle={handle} stats={stats} />;
  }
  return <SocialProfileStatsQuery profileId={profileId} handle={handle} initial={stats} />;
}

function SocialProfileStatsQuery({
  profileId,
  handle,
  initial,
}: {
  profileId: string;
  handle: string;
  initial: SocialProfileCounts;
}) {
  const query = useQuery({
    queryKey: socialCountsQueryKey(profileId),
    queryFn: () => readSocialCounts(profileId),
    initialData: initial,
    staleTime: SOCIAL_QUERY_STALE_MS,
  });
  return <SocialProfileStatsView handle={handle} stats={query.data ?? initial} />;
}

function SocialProfileStatsView({
  handle,
  stats,
}: {
  handle: string;
  stats: SocialProfileCounts;
}) {
  return (
    <div data-social-profile-stats="" className="mt-2 flex flex-wrap gap-4 t-body-sm">
      <p data-social-profile-stat="posts">
        <span className="font-semibold text-ink">{formatSocialCount(stats.posts)}</span>{" "}
        <span className="text-ink-2">{SOCIAL.profile.postsStat}</span>
      </p>
      <Link
        href={socialProfileFollowsHref(handle, "followers")}
        data-social-profile-stat="followers"
        className="min-w-0"
      >
        <span className="font-semibold text-ink">{formatSocialCount(stats.followers)}</span>{" "}
        <span className="text-ink-2">{SOCIAL.profile.followersStat}</span>
      </Link>
      <Link
        href={socialProfileFollowsHref(handle, "following")}
        data-social-profile-stat="following"
        className="min-w-0"
      >
        <span className="font-semibold text-ink">{formatSocialCount(stats.following)}</span>{" "}
        <span className="text-ink-2">{SOCIAL.profile.followingStat}</span>
      </Link>
    </div>
  );
}
