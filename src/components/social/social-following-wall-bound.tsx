"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { readSocialFollowingWall } from "@/app/(app)/social/query-actions";
import { useAppQueryClient } from "@/components/query-provider";
import { SOCIAL_QUERY_STALE_MS, socialFollowingWallQueryKey } from "@/lib/social-cache-keys";
import type { SocialFollowingWallPage } from "@/lib/social-feed";

export function SocialFollowingWallBound({
  viewerId,
  topic,
  cursor,
  wall,
  children,
}: {
  viewerId: string;
  topic: string;
  cursor: string | null;
  wall: SocialFollowingWallPage;
  children: ReactNode;
}) {
  const client = useAppQueryClient();
  if (!client) return children;
  return (
    <SocialFollowingWallBoundLive viewerId={viewerId} topic={topic} cursor={cursor} wall={wall}>
      {children}
    </SocialFollowingWallBoundLive>
  );
}

function SocialFollowingWallBoundLive({
  viewerId,
  topic,
  cursor,
  wall,
  children,
}: {
  viewerId: string;
  topic: string;
  cursor: string | null;
  wall: SocialFollowingWallPage;
  children: ReactNode;
}) {
  useQuery({
    queryKey: socialFollowingWallQueryKey(viewerId, topic, cursor),
    queryFn: () => readSocialFollowingWall({ topic, cursor }),
    initialData: wall,
    staleTime: SOCIAL_QUERY_STALE_MS,
  });
  return children;
}
