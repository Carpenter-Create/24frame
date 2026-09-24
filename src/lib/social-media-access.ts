import { createClient } from "@/lib/supabase/server";
import {
  isForbiddenMediaKey,
  isOwnedSocialMediaKey,
  parsePostMedia,
  parseSocialMediaObjectKey,
} from "@/lib/social-media";
import { isStoryLive } from "@/lib/social-stories";

// Sign /api/social/media only after the session can already see the object.
// Posts-lane ownership (own upload, cover, welcome) may sign before a row exists.
// A stories-lane key does not. It follows stories_select: active, expires_at
// still in the future, and the caller is the author or follows them. Prefix
// ownership does not skip expires_at. An active post the session can read,
// or that author's published cover / welcome, can sign a posts-lane key.
// A foreign key written onto the caller's profile does not match the author
// embedded in the key, so it does not sign. Query failures fail closed.

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

export type SocialMediaProfileGrant = {
  id: string;
  cover_key?: string | null;
  welcome_video_key?: string | null;
};

function mediaStoresKey(media: unknown, key: string): boolean {
  return parsePostMedia(media).some((item) => item.key === key);
}

function profilePublishesKey(profile: SocialMediaProfileGrant, key: string): boolean {
  if (!isOwnedSocialMediaKey(key, profile.id, "posts")) return false;
  return profile.cover_key === key || profile.welcome_video_key === key;
}

export function socialMediaReadGrant(input: {
  userId: string;
  key: string;
  now?: Date;
  followeeIds?: readonly string[];
  stories?: readonly SocialMediaStoryGrant[];
  posts?: readonly SocialMediaPostGrant[];
  profiles?: readonly SocialMediaProfileGrant[];
}): boolean {
  if (!input.userId || isForbiddenMediaKey(input.key)) return false;
  const parsed = parseSocialMediaObjectKey(input.key);
  if (!parsed) return false;
  if (parsed.lane === "posts" && isOwnedSocialMediaKey(input.key, input.userId, "posts")) {
    return true;
  }
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
  const onPost = (input.posts ?? []).some((post) => {
    if (post.status !== "active") return false;
    if (!isOwnedSocialMediaKey(input.key, post.author_id, "posts")) return false;
    return mediaStoresKey(post.media, input.key);
  });
  if (onPost) return true;
  return (input.profiles ?? []).some((profile) => profilePublishesKey(profile, input.key));
}

export async function viewerMaySignSocialMedia(userId: string, key: string, now = new Date()): Promise<boolean> {
  if (!userId || isForbiddenMediaKey(key)) return false;
  if (isOwnedSocialMediaKey(key, userId, "posts")) return true;
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
    const [{ data: posts, error: postError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("posts")
        .select("author_id, status, media")
        .eq("author_id", parsed.userId)
        .eq("status", "active")
        .contains("media", [{ key }])
        .limit(8),
      supabase
        .from("profiles")
        .select("id, cover_key, welcome_video_key")
        .eq("id", parsed.userId)
        .maybeSingle(),
    ]);
    if (postError || profileError) return false;
    return socialMediaReadGrant({
      userId,
      key,
      now,
      posts: posts ?? [],
      profiles: profile ? [profile] : [],
    });
  } catch {
    return false;
  }
}
