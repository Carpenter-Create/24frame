import type { createClient } from "@/lib/supabase/server";
import { LIST_PAGE, rangeFor } from "@/lib/list-bounds";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SocialProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  status: string;
};

export type SocialPostRow = {
  id: string;
  body: string | null;
  author_id: string;
  group_id: string | null;
  like_count: number;
  created_at: string;
  media: unknown;
};

export async function loadOwnProfile(
  supabase: ServerClient,
  userId: string,
): Promise<SocialProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, status")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function loadVisiblePosts(
  supabase: ServerClient,
  groupId?: string,
): Promise<SocialPostRow[]> {
  let query = supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, media")
    .eq("status", "active");
  if (groupId) query = query.eq("group_id", groupId);
  const { data } = await query
    .order("created_at", { ascending: false })
    .range(...rangeFor(LIST_PAGE));
  return data ?? [];
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
