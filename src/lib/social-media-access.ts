import { createClient } from "@/lib/supabase/server";
import {
  isForbiddenMediaKey,
  isOwnedSocialMediaKey,
  parsePostMedia,
  parseSocialMediaObjectKey,
} from "@/lib/social-media";
import { isStoryLive } from "@/lib/social-stories";

// GC-P1-3. Sign /api/social/media only for a key attached to a row the
// caller can select: post media, or a non-expired story visible under
// stories_select (active, expires_at still ahead, author or follow).
// isForbiddenMediaKey is a shape check, not a grant. Prefix ownership
// and profile cover / welcome are not rows, so they do not sign.
// The read uses the user-scoped client, so posts_select and stories_select
// stay the authorization layer. Story follow and expires_at are checked
// again so a returned row that fails them is still denied. Fail closed.

export type SocialMediaStoryGrant = {
  author_id: string;
  status?: string;
  expires_at: string;
  media: unknown;
};

export type SocialMediaPostGrant = {
  author_id: string;
  status?: string;
  media: unknown;
};

function mediaStoresKey(media: unknown, key: string): boolean {
  return parsePostMedia(media).some((item) => item.key === key);
}

export function socialMediaReadGrant(input: {
  userId: string;
  key: string;
  now?: Date;
  followeeIds?: readonly string[];
  stories?: readonly SocialMediaStoryGrant[];
  posts?: readonly SocialMediaPostGrant[];
}): boolean {
  if (!input.userId || isForbiddenMediaKey(input.key)) return false;
  const parsed = parseSocialMediaObjectKey(input.key);
  if (!parsed) return false;
  const now = input.now ?? new Date();
  if (parsed.lane === "stories") {
    const followees = new Set(input.followeeIds ?? []);
    return (input.stories ?? []).some((story) => {
      if (story.status !== "active") return false;
      if (!isStoryLive(story.expires_at, now)) return false;
      if (story.author_id !== input.userId && !followees.has(story.author_id)) return false;
      if (!isOwnedSocialMediaKey(input.key, story.author_id, "stories")) return false;
      return mediaStoresKey(story.media, input.key);
    });
  }
  return (input.posts ?? []).some((post) => {
    if (post.status !== "active") return false;
    if (!isOwnedSocialMediaKey(input.key, post.author_id, "posts")) return false;
    return mediaStoresKey(post.media, input.key);
  });
}

export async function viewerMaySignSocialMedia(userId: string, key: string, now = new Date()): Promise<boolean> {
  if (!userId || isForbiddenMediaKey(key)) return false;
  const parsed = parseSocialMediaObjectKey(key);
  if (!parsed) return false;
  try {
    const supabase = await createClient();
    if (parsed.lane === "stories") {
      const [{ data: follow, error: followError }, { data: stories, error: storyError }] = await Promise.all([
        supabase
          .from("follows")
          .select("followee_id")
          .eq("follower_id", userId)
          .eq("followee_id", parsed.userId)
          .maybeSingle(),
        supabase
          .from("stories")
          .select("author_id, status, expires_at, media")
          .eq("author_id", parsed.userId)
          .eq("status", "active")
          .gt("expires_at", now.toISOString())
          .contains("media", [{ key }])
          .limit(8),
      ]);
      if (followError || storyError) return false;
      return socialMediaReadGrant({
        userId,
        key,
        now,
        followeeIds: follow?.followee_id ? [follow.followee_id] : [],
        stories: stories ?? [],
      });
    }
    const { data: posts, error } = await supabase
      .from("posts")
      .select("author_id, status, media")
      .eq("author_id", parsed.userId)
      .eq("status", "active")
      .contains("media", [{ key }])
      .limit(8);
    if (error) return false;
    return socialMediaReadGrant({ userId, key, now, posts: posts ?? [] });
  } catch {
    return false;
  }
}
