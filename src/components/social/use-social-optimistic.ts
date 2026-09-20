"use client";

import { useSyncExternalStore } from "react";

import {
  getSocialOptimisticServerSnapshot,
  mergeSocialLike,
  readOptimisticLike,
  readOptimisticSocialPosts,
  socialOptimisticPostsFor,
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

export function useSocialOptimisticPosts(groupSlug?: string | null): readonly SocialOptimisticPost[] {
  const pending = useSyncExternalStore(
    subscribeOptimisticSocialPosts,
    readOptimisticSocialPosts,
    (): readonly SocialOptimisticPost[] => [],
  );
  return socialOptimisticPostsFor(groupSlug, pending);
}

export { mergeSocialLike };
