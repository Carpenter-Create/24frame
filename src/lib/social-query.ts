import type { QueryClient } from "@tanstack/react-query";

import {
  socialCountsQueryKey,
  socialFollowQueryKey,
  socialProfileQueryKey,
} from "@/lib/social-cache-keys";
import type { SocialProfileCounts } from "@/lib/social-feed";
import type { SocialProfileRow } from "@/lib/social-feed";

export type SocialProfileQueryRow = Pick<
  SocialProfileRow,
  | "id"
  | "handle"
  | "display_name"
  | "status"
  | "bio"
  | "welcome_video_key"
  | "cover_key"
  | "crafts"
  | "topics"
  | "imdb_url"
  | "website_url"
>;

// Optimistic Save / Follow: call these against the one App QueryClient.
// Do not fork a second cache. Local button override stays compatible.

export function applyOptimisticSocialProfile(
  queryClient: QueryClient,
  profile: SocialProfileQueryRow,
): void {
  queryClient.setQueryData(socialProfileQueryKey(profile.id), profile);
}

export function applyOptimisticSocialProfilePatch(
  queryClient: QueryClient,
  profileId: string,
  patch: Partial<SocialProfileQueryRow>,
): void {
  queryClient.setQueryData(socialProfileQueryKey(profileId), (old: SocialProfileQueryRow | undefined) =>
    old ? { ...old, ...patch } : old,
  );
}

export function applyOptimisticFollow(
  queryClient: QueryClient,
  input: { viewerId: string; targetId: string; following: boolean },
): void {
  queryClient.setQueryData(socialFollowQueryKey(input.viewerId, input.targetId), input.following);
  queryClient.setQueryData(
    socialCountsQueryKey(input.targetId),
    (old: SocialProfileCounts | undefined) =>
      old
        ? { ...old, followers: Math.max(0, old.followers + (input.following ? 1 : -1)) }
        : old,
  );
  queryClient.setQueryData(
    socialCountsQueryKey(input.viewerId),
    (old: SocialProfileCounts | undefined) =>
      old
        ? { ...old, following: Math.max(0, old.following + (input.following ? 1 : -1)) }
        : old,
  );
}

export function invalidateSocialQueries(
  queryClient: QueryClient,
  input: { profileId?: string; viewerId?: string; targetId?: string },
): void {
  if (input.profileId) {
    void queryClient.invalidateQueries({ queryKey: socialProfileQueryKey(input.profileId) });
    void queryClient.invalidateQueries({ queryKey: socialCountsQueryKey(input.profileId) });
  }
  if (input.viewerId && input.targetId) {
    void queryClient.invalidateQueries({ queryKey: socialFollowQueryKey(input.viewerId, input.targetId) });
    void queryClient.invalidateQueries({ queryKey: socialCountsQueryKey(input.viewerId) });
    void queryClient.invalidateQueries({ queryKey: socialCountsQueryKey(input.targetId) });
  }
}
