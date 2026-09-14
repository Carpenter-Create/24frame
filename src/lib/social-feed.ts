import type { createClient } from "@/lib/supabase/server";
import { LIST_PAGE, rangeFor } from "@/lib/list-bounds";
import { followingAuthorIds } from "@/lib/social-home";
import type { SocialCategoryTopic } from "@/lib/social-categories";
import { isStoryLive, storyRailUnseen } from "@/lib/social-stories";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SocialProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  status: string;
  bio?: string | null;
};

export type SocialPostRow = {
  id: string;
  body: string | null;
  author_id: string;
  group_id: string | null;
  like_count: number;
  created_at: string;
  media: unknown;
  category?: string | null;
};

export type SocialStoryRow = {
  id: string;
  author_id: string;
  body: string | null;
  media: unknown;
  expires_at: string;
  created_at: string;
};

export type SocialStoryRailCard = {
  authorId: string;
  storyIds: string[];
  latest: SocialStoryRow;
  unseen: boolean;
};

export async function loadOwnProfile(
  supabase: ServerClient,
  userId: string,
): Promise<SocialProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, status, bio")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function loadFolloweeIds(
  supabase: ServerClient,
  followerId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", followerId)
    .range(...rangeFor(LIST_PAGE));
  return (data ?? []).map((row) => row.followee_id);
}

export async function loadIsFollowing(
  supabase: ServerClient,
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();
  return !!data;
}

export async function loadFollowingPosts(
  supabase: ServerClient,
  userId: string,
  category?: SocialCategoryTopic | null,
): Promise<SocialPostRow[]> {
  const followeeIds = await loadFolloweeIds(supabase, userId);
  const authorIds = followingAuthorIds(userId, followeeIds);
  let query = supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, media, category")
    .eq("status", "active")
    .is("group_id", null)
    .in("author_id", authorIds);
  if (category) query = query.eq("category", category);
  const { data } = await query
    .order("created_at", { ascending: false })
    .range(...rangeFor(LIST_PAGE));
  return data ?? [];
}

export async function loadVisiblePosts(
  supabase: ServerClient,
  groupId?: string,
): Promise<SocialPostRow[]> {
  let query = supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, media, category")
    .eq("status", "active");
  if (groupId) query = query.eq("group_id", groupId);
  const { data } = await query
    .order("created_at", { ascending: false })
    .range(...rangeFor(LIST_PAGE));
  return data ?? [];
}

export async function loadLiveStories(
  supabase: ServerClient,
  authorIds: readonly string[],
  now = new Date(),
): Promise<SocialStoryRow[]> {
  if (authorIds.length === 0) return [];
  const { data } = await supabase
    .from("stories")
    .select("id, author_id, body, media, expires_at, created_at")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .range(...rangeFor(LIST_PAGE));
  return (data ?? []).filter((row) => isStoryLive(row.expires_at, now));
}

export async function loadViewedStoryIds(
  supabase: ServerClient,
  viewerId: string,
  storyIds: readonly string[],
): Promise<Set<string>> {
  if (storyIds.length === 0) return new Set();
  const { data } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", viewerId)
    .in("story_id", storyIds);
  return new Set((data ?? []).map((row) => row.story_id));
}

export function groupStoryRail(
  stories: readonly SocialStoryRow[],
  viewedIds: ReadonlySet<string>,
): SocialStoryRailCard[] {
  const byAuthor = new Map<string, SocialStoryRow[]>();
  for (const story of stories) {
    const current = byAuthor.get(story.author_id) ?? [];
    current.push(story);
    byAuthor.set(story.author_id, current);
  }
  return [...byAuthor.entries()].map(([authorId, rows]) => ({
    authorId,
    storyIds: rows.map((row) => row.id),
    latest: rows[0],
    unseen: storyRailUnseen(rows.map((row) => row.id), viewedIds),
  }));
}

export async function loadStoryById(
  supabase: ServerClient,
  storyId: string,
): Promise<SocialStoryRow | null> {
  const { data } = await supabase
    .from("stories")
    .select("id, author_id, body, media, expires_at, created_at")
    .eq("id", storyId)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

export async function loadOwnPostFacts(
  supabase: ServerClient,
  userId: string,
): Promise<{ hasIntro: boolean; hasPost: boolean; hasStory: boolean }> {
  const [{ data: posts }, { data: stories }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, body")
      .eq("author_id", userId)
      .eq("status", "active")
      .range(...rangeFor(20)),
    supabase
      .from("stories")
      .select("id")
      .eq("author_id", userId)
      .eq("status", "active")
      .range(...rangeFor(1)),
  ]);
  const rows = posts ?? [];
  return {
    hasPost: rows.length > 0,
    hasIntro: rows.some((row) => !!row.body?.trim()),
    hasStory: (stories ?? []).length > 0,
  };
}

export type SocialExploreHit = {
  kind: "person" | "post";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export async function loadExploreSearch(
  supabase: ServerClient,
  query: string,
): Promise<SocialExploreHit[]> {
  const needle = query.trim();
  if (!needle) return [];
  const like = `%${needle.replace(/[%_]/g, "")}%`;
  const [{ data: people }, { data: posts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name")
      .eq("status", "active")
      .or(`handle.ilike.${like},display_name.ilike.${like}`)
      .range(...rangeFor(20)),
    supabase
      .from("posts")
      .select("id, body, author_id")
      .eq("status", "active")
      .is("group_id", null)
      .ilike("body", like)
      .range(...rangeFor(20)),
  ]);
  const hits: SocialExploreHit[] = [];
  for (const person of people ?? []) {
    hits.push({
      kind: "person",
      id: person.id,
      title: person.display_name,
      subtitle: `@${person.handle}`,
      href: `/social/members/${encodeURIComponent(person.handle)}`,
    });
  }
  for (const post of posts ?? []) {
    hits.push({
      kind: "post",
      id: post.id,
      title: post.body?.trim() || "Post",
      subtitle: null,
      href: "/social/explore",
    });
  }
  return hits;
}

export async function loadProfilesByIds(
  supabase: ServerClient,
  ids: string[],
): Promise<Map<string, SocialProfileRow>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, status")
    .in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function loadGroupsByIds(
  supabase: ServerClient,
  ids: string[],
): Promise<Map<string, { id: string; slug: string; name: string }>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from("groups").select("id, slug, name").in("id", ids);
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function loadLikedPostIds(
  supabase: ServerClient,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data } = await supabase
    .from("likes")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", "post")
    .in("target_id", postIds);
  return new Set((data ?? []).map((row) => row.target_id));
}
