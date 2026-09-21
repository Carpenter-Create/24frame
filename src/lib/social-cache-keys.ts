// One SoT for Social hot-cache + TanStack Query keys.
// Redis REST keys stay server-only at use; this module is client-safe (no env, no client).

export const SOCIAL_HOT_TTL_SECONDS = 60;
export const SOCIAL_QUERY_STALE_MS = 45_000;

export function socialProfileCacheKey(profileId: string): string {
  return `social:profile:${profileId}`;
}

export function socialProfileHandleCacheKey(handle: string): string {
  return `social:profile:handle:${handle}`;
}

export function socialCountsCacheKey(profileId: string): string {
  return `social:counts:${profileId}`;
}

export function socialFollowCacheKey(viewerId: string, targetId: string): string {
  return `social:follow:${viewerId}:${targetId}`;
}

export function socialFolloweeSetCacheKey(viewerId: string): string {
  return `social:followees:${viewerId}`;
}

export function socialFeedCacheKey(viewerId: string): string {
  return `social:feed:${viewerId}`;
}

export function socialFollowingWallQueryKey(
  viewerId: string,
  topic = "",
  cursor: string | null = null,
) {
  return ["social", "following-wall", viewerId, topic, cursor ?? ""] as const;
}

export function socialProfileQueryKey(profileId: string) {
  return ["social", "profile", profileId] as const;
}

export function socialCountsQueryKey(profileId: string) {
  return ["social", "counts", profileId] as const;
}

export function socialFollowQueryKey(viewerId: string, targetId: string) {
  return ["social", "follow", viewerId, targetId] as const;
}

export function socialProfileInvalidateKeys(profileId: string, handles: readonly (string | null | undefined)[] = []): string[] {
  const keys = [socialProfileCacheKey(profileId)];
  for (const handle of handles) {
    const trimmed = handle?.trim();
    if (trimmed) keys.push(socialProfileHandleCacheKey(trimmed));
  }
  return [...new Set(keys)];
}

export function socialFeedInvalidateKeys(viewerId: string): string[] {
  return [socialFolloweeSetCacheKey(viewerId), socialFeedCacheKey(viewerId)];
}

export function socialFollowInvalidateKeys(viewerId: string, targetId: string): string[] {
  return [
    socialFollowCacheKey(viewerId, targetId),
    socialCountsCacheKey(viewerId),
    socialCountsCacheKey(targetId),
    ...socialFeedInvalidateKeys(viewerId),
    socialFolloweeSetCacheKey(targetId),
    socialFeedCacheKey(targetId),
  ];
}
