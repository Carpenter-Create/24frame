"use client";

import { useSyncExternalStore } from "react";

import {
  getSocialOptimisticServerSnapshot,
  mergeSocialLike,
  readOptimisticCommentCount,
  readOptimisticLike,
  readOptimisticSocialPosts,
  socialOptimisticPostsFor,
  subscribeOptimisticCommentCounts,
  subscribeOptimisticLikes,
  subscribeOptimisticSocialPosts,
  type SocialOptimisticLike,
  type SocialOptimisticPost,
} from "@/lib/social-optimistic";

export function useSocialLike(postId: string, server: SocialOptimisticLike): SocialOptimisticLike {
  const overlay = useSyncExternalStore(
    subscribeOptimisticLikes,
    () => readOptimisticLike(postId),
    getSocialOptimisticServerSnapshot,
  );
  return overlay ?? server;
}

export function useSocialLikeView(postId: string, liked: boolean, likeCount: number): SocialOptimisticLike {
  return useSocialLike(postId, { liked, likeCount });
}

export function useSocialCommentCount(postId: string, serverCount = 0): number {
  const overlay = useSyncExternalStore(
    subscribeOptimisticCommentCounts,
    () => readOptimisticCommentCount(postId),
    getSocialOptimisticServerSnapshot,
  );
  return overlay ?? serverCount;
}

export function useSocialOptimisticPosts(
  groupSlug?: string | null,
  topic?: string | null,
): readonly SocialOptimisticPost[] {
  const pending = useSyncExternalStore(
    subscribeOptimisticSocialPosts,
    readOptimisticSocialPosts,
    (): readonly SocialOptimisticPost[] => [],
  );
  return socialOptimisticPostsFor(groupSlug, pending, topic);
}

export { mergeSocialLike };
