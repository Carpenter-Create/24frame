import type { createClient } from "@/lib/supabase/server";
import { LIST_PAGE, probeRange, rangeFor, splitProbe } from "@/lib/list-bounds";
import type { SocialCategoryTopic } from "@/lib/social-categories";
import {
  SOCIAL_EXPLORE_PEOPLE_LIMIT,
  SOCIAL_EXPLORE_POSTS_LIMIT,
  SOCIAL_FOLLOWEES_LIMIT,
  SOCIAL_FOLLOWING_WALL_LIMIT,
  SOCIAL_FOR_YOU_PEOPLE_LIMIT,
  SOCIAL_STORIES_RAIL_LIMIT,
  followingWallKeysetOrFilter,
  encodeFollowingWallCursor,
  type FollowingWallCursor,
} from "@/lib/social-home-bounds";
import { SOCIAL_PROFILE_POSTS_PAGE, socialPersonIdentity, socialProfileHref } from "@/lib/social";
import {
  SOCIAL_MUTUALS_NAME_CAP,
  SOCIAL_MUTUALS_PROBE,
  emptySocialProfileMutuals,
  socialMutualFromProfile,
  type SocialProfileMutuals,
} from "@/lib/social-profile-mutuals";
import { rankSocialSuggestedPeople, socialPostAffinityScore } from "@/lib/social-role-affinity";
import { isStoryLive, storyRailUnseen } from "@/lib/social-stories";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SocialProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  status: string;
  bio?: string | null;
  welcome_video_key?: string | null;
  crafts?: string[] | null;
  topics?: string[] | null;
  imdb_url?: string | null;
  website_url?: string | null;
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

export type SocialFolloweePage = {
  ids: string[];
  truncated: boolean;
};

export async function loadFolloweeIds(
  supabase: ServerClient,
  followerId: string,
): Promise<SocialFolloweePage> {
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", followerId)
    .order("created_at", { ascending: false })
    .order("followee_id", { ascending: true })
    .range(...probeRange(SOCIAL_FOLLOWEES_LIMIT));
  const { rows, truncated } = splitProbe(data, SOCIAL_FOLLOWEES_LIMIT);
  return { ids: rows.map((row) => row.followee_id), truncated };
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

export async function loadProfileMutuals(
  supabase: ServerClient,
  viewerId: string,
  profileId: string,
): Promise<SocialProfileMutuals> {
  if (!viewerId || viewerId === profileId) return emptySocialProfileMutuals();
  const followees = await loadFolloweeIds(supabase, viewerId);
  const candidate = followees.ids.filter((id) => id !== profileId);
  if (candidate.length === 0) return emptySocialProfileMutuals();

  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("followee_id", profileId)
    .in("follower_id", candidate)
    .order("created_at", { ascending: false })
    .range(...probeRange(SOCIAL_MUTUALS_PROBE));
  const { rows } = splitProbe(data, SOCIAL_MUTUALS_PROBE);
  const overlapIds = [...new Set(rows.map((row) => row.follower_id))];
  if (overlapIds.length === 0) return emptySocialProfileMutuals();

  const shownIds = overlapIds.slice(0, SOCIAL_MUTUALS_NAME_CAP);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", shownIds);
  const byId = new Map((profiles ?? []).map((row) => [row.id, row]));
  const people = shownIds
    .map((id) => {
      const row = byId.get(id);
      return row ? socialMutualFromProfile(row) : null;
    })
    .filter((row): row is NonNullable<typeof row> => !!row);
  if (people.length === 0) return emptySocialProfileMutuals();
  return { people, extra: Math.max(0, overlapIds.length - people.length) };
}

export type SocialProfileCounts = {
  posts: number;
  followers: number;
  following: number;
};

// Live follows rows are the count SoT. follows has no id column;
// profiles.follower_count is leftover denormalized storage.
export async function loadProfileSocialCounts(
  supabase: ServerClient,
  profileId: string,
): Promise<SocialProfileCounts> {
  const [followers, following, posts] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followee_id", profileId),
    supabase
      .from("follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("follower_id", profileId),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profileId)
      .eq("status", "active")
      .is("group_id", null),
  ]);

  return {
    posts: posts.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

export type SocialFollowingWallPage = {
  posts: SocialPostRow[];
  truncated: boolean;
  nextCursor: string | null;
};

/**
 * Home following wall. Mapping C: posts.author_id = profiles.id.
 * created_at+id keyset; probe so the page cannot look finished.
 * Caller supplies the followee IN() set so followee truncation stays a
 * separate, named path.
 */
export async function loadFollowingPosts(
  supabase: ServerClient,
  authorIds: readonly string[],
  opts?: { category?: SocialCategoryTopic | null; cursor?: FollowingWallCursor | null },
): Promise<SocialFollowingWallPage> {
  if (authorIds.length === 0) return { posts: [], truncated: false, nextCursor: null };
  let query = supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, media, category")
    .eq("status", "active")
    .is("group_id", null)
    .in("author_id", authorIds);
  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.cursor) query = query.or(followingWallKeysetOrFilter(opts.cursor));
  const { data } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(...probeRange(SOCIAL_FOLLOWING_WALL_LIMIT));
  const { rows, truncated } = splitProbe(data, SOCIAL_FOLLOWING_WALL_LIMIT);
  const last = rows[rows.length - 1];
  return {
    posts: rows,
    truncated,
    nextCursor: truncated && last ? encodeFollowingWallCursor(last) : null,
  };
}

export type SocialAuthorPostsPage = {
  posts: SocialPostRow[];
  truncated: boolean;
};

/**
 * One author's public wall posts. Mapping C: `posts.author_id` = `profiles.id`.
 * Group walls stay on the group route. Probe so a cap is visible, not silent.
 */
export async function loadAuthorPosts(
  supabase: ServerClient,
  authorId: string,
): Promise<SocialAuthorPostsPage> {
  const { data } = await supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, media, category")
    .eq("status", "active")
    .is("group_id", null)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .range(...probeRange(SOCIAL_PROFILE_POSTS_PAGE));
  const { rows, truncated } = splitProbe(data, SOCIAL_PROFILE_POSTS_PAGE);
  return { posts: rows, truncated };
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

export type SocialStoriesPage = {
  stories: SocialStoryRow[];
  truncated: boolean;
};

export async function loadLiveStories(
  supabase: ServerClient,
  authorIds: readonly string[],
  now = new Date(),
): Promise<SocialStoriesPage> {
  if (authorIds.length === 0) return { stories: [], truncated: false };
  const { data } = await supabase
    .from("stories")
    .select("id, author_id, body, media, expires_at, created_at")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(...probeRange(SOCIAL_STORIES_RAIL_LIMIT));
  const live = (data ?? []).filter((row) => isStoryLive(row.expires_at, now));
  const { rows, truncated } = splitProbe(live, SOCIAL_STORIES_RAIL_LIMIT);
  return { stories: rows, truncated };
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
  handle?: string;
  displayName?: string;
};

export type SocialExplorePage = {
  hits: SocialExploreHit[];
  truncated: boolean;
  peopleTruncated: boolean;
  postsTruncated: boolean;
};

export async function loadExploreSearch(
  supabase: ServerClient,
  query: string,
  viewer: { topics?: unknown; crafts?: unknown } | readonly string[] = [],
): Promise<SocialExplorePage> {
  const needle = query.trim();
  if (!needle) {
    return { hits: [], truncated: false, peopleTruncated: false, postsTruncated: false };
  }
  const like = `%${needle.replace(/[%_]/g, "")}%`;
  const [{ data: people }, { data: posts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, crafts, topics")
      .eq("status", "active")
      .or(`handle.ilike.${like},display_name.ilike.${like}`)
      .range(...probeRange(SOCIAL_EXPLORE_PEOPLE_LIMIT)),
    supabase
      .from("posts")
      .select("id, body, author_id, category")
      .eq("status", "active")
      .is("group_id", null)
      .ilike("body", like)
      .range(...probeRange(SOCIAL_EXPLORE_POSTS_LIMIT)),
  ]);
  const peoplePage = splitProbe(people, SOCIAL_EXPLORE_PEOPLE_LIMIT);
  const postsPage = splitProbe(posts, SOCIAL_EXPLORE_POSTS_LIMIT);
  const rankedPeople = rankSocialSuggestedPeople(
    peoplePage.rows.map((person) => ({
      ...person,
      crafts: person.crafts ?? [],
      topics: person.topics ?? [],
    })),
    viewer,
  );
  const rankedPosts = [...postsPage.rows].sort((a, b) => {
    const delta = socialPostAffinityScore(b.category, viewer) - socialPostAffinityScore(a.category, viewer);
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
  const hits: SocialExploreHit[] = [];
  for (const person of rankedPeople) {
    const identity = socialPersonIdentity({
      handle: person.handle,
      displayName: person.display_name,
    });
    hits.push({
      kind: "person",
      id: person.id,
      title: identity.handleLabel,
      subtitle: identity.name,
      href: socialProfileHref(person.handle),
      handle: person.handle,
      displayName: person.display_name,
    });
  }
  for (const post of rankedPosts) {
    hits.push({
      kind: "post",
      id: post.id,
      title: post.body?.trim() || "Post",
      subtitle: null,
      href: "/social/explore",
    });
  }
  return {
    hits,
    peopleTruncated: peoplePage.truncated,
    postsTruncated: postsPage.truncated,
    truncated: peoplePage.truncated || postsPage.truncated,
  };
}

export type SocialSuggestedPerson = {
  id: string;
  handle: string;
  display_name: string;
  crafts?: string[] | null;
  topics?: string[] | null;
};

export async function loadSuggestedPeople(
  supabase: ServerClient,
  excludeIds: readonly string[],
  viewer: { topics?: unknown; crafts?: unknown } | readonly string[] = [],
): Promise<SocialSuggestedPerson[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, crafts, topics")
    .eq("status", "active")
    .order("handle", { ascending: true })
    .range(...probeRange(SOCIAL_EXPLORE_PEOPLE_LIMIT));
  const blocked = new Set(excludeIds.filter(Boolean));
  const available = (data ?? []).filter((row) => !blocked.has(row.id));
  return rankSocialSuggestedPeople(available, viewer).slice(0, SOCIAL_FOR_YOU_PEOPLE_LIMIT);
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
