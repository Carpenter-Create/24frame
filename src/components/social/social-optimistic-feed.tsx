"use client";

import type { ReactNode } from "react";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialPostCard, type SocialPostCardModel } from "@/components/social/social-ui";
import { useSocialOptimisticPosts } from "@/components/social/use-social-optimistic";
import {
  mergeSocialOptimisticPosts,
  socialOptimisticNotice,
} from "@/lib/social-optimistic";

export function SocialOptimisticFeed({
  posts,
  groupSlug = null,
  empty = null,
}: {
  posts: SocialPostCardModel[];
  groupSlug?: string | null;
  empty?: ReactNode;
}) {
  const pending = useSocialOptimisticPosts(groupSlug);
  const merged = mergeSocialOptimisticPosts(posts, pending);
  const error = socialOptimisticNotice(pending);
  if (merged.length === 0) return empty;
  return (
    <div data-social-feed="" className="flex flex-col gap-2">
      {error ? (
        <InlineNotice tone="error" data-social-optimistic-error="">
          {error}
        </InlineNotice>
      ) : null}
      {merged.map((post) => (
        <SocialPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
