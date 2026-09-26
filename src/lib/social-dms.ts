import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { dmStoryInboxExcerpt } from "@/lib/social-dm-story";
import { dmPostInboxExcerpt } from "@/lib/social-post-share";
import { probeRange, splitProbe } from "@/lib/list-bounds";
import {
  SOCIAL_DM_INBOX_LIMIT,
  SOCIAL_DM_ROOM_LIMIT,
  SOCIAL_DM_THREAD_LIMIT,
  dmThreadKeysetOrFilter,
  encodeDmThreadCursor,
  type DmThreadCursor,
} from "@/lib/social-dm-bounds";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type DmInboxRow = Database["public"]["Functions"]["get_dm_inbox"]["Returns"][number];

export type DmInboxPage = {
  rows: DmInboxRow[];
  truncated: boolean;
};

export type DmMessageRow = {
  id: string;
  body: string | null;
  sender_id: string | null;
  created_at: string;
  status: string;
  media?: unknown;
};

export type DmThreadPage = {
  messages: DmMessageRow[];
  truncated: boolean;
  nextCursor: string | null;
};

export type DmParticipantRow = {
  user_id: string;
  left_at: string | null;
};

export type DmParticipantsPage = {
  rows: DmParticipantRow[];
  truncated: boolean;
};

/**
 * Caller inbox. Mapping C: conversations / participants use profiles.id.
 * Probe so a silent RPC cap cannot look like a finished list.
 */
export async function loadDmInbox(
  supabase: ServerClient,
  opts?: { limit?: number },
): Promise<DmInboxPage> {
  const limit = opts?.limit ?? SOCIAL_DM_INBOX_LIMIT;
  const { data } = await supabase.rpc("get_dm_inbox", { p_limit: limit + 1 });
  return splitProbe(data as DmInboxRow[] | null, limit);
}

/**
 * One thread's latest page. Newest-first read, chronological display.
 * created_at+id keyset; probe so the page cannot look finished.
 */
export async function loadDmThreadMessages(
  supabase: ServerClient,
  conversationId: string,
  opts?: { cursor?: DmThreadCursor | null },
): Promise<DmThreadPage> {
  let query = supabase
    .from("messages")
    .select("id, body, sender_id, created_at, status, media")
    .eq("conversation_id", conversationId)
    .eq("status", "active");
  if (opts?.cursor) query = query.or(dmThreadKeysetOrFilter(opts.cursor));
  const { data } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(...probeRange(SOCIAL_DM_THREAD_LIMIT));
  const { rows, truncated } = splitProbe(data as DmMessageRow[] | null, SOCIAL_DM_THREAD_LIMIT);
  const oldest = rows[rows.length - 1];
  return {
    messages: [...rows].reverse(),
    truncated,
    nextCursor: truncated && oldest ? encodeDmThreadCursor(oldest) : null,
  };
}

/**
 * Active members of one room. Left members are not this path — senders on
 * the current message page cover names for people who already left.
 */
export async function loadDmParticipants(
  supabase: ServerClient,
  conversationId: string,
): Promise<DmParticipantsPage> {
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id, left_at")
    .eq("conversation_id", conversationId)
    .is("left_at", null)
    .order("user_id", { ascending: true })
    .range(...probeRange(SOCIAL_DM_ROOM_LIMIT));
  return splitProbe(data as DmParticipantRow[] | null, SOCIAL_DM_ROOM_LIMIT);
}

/**
 * Newest message per room, story and post shares.
 * The inbox RPC has no body. A URL stored on an older row must not surface.
 */
export async function loadDmStoryInboxLines(
  supabase: ServerClient,
  conversationIds: readonly string[],
  viewerId: string,
): Promise<Map<string, string>> {
  const lines = new Map<string, string>();
  if (conversationIds.length === 0) return lines;
  const cap = Math.min(400, Math.max(conversationIds.length, conversationIds.length * 8));
  const { data } = await supabase
    .from("messages")
    .select("conversation_id, body, sender_id, media, created_at")
    .in("conversation_id", [...conversationIds])
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(0, cap - 1);
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (!row.conversation_id || seen.has(row.conversation_id)) continue;
    seen.add(row.conversation_id);
    const line =
      dmStoryInboxExcerpt({
        body: row.body,
        media: row.media,
        senderId: row.sender_id,
        viewerId,
      }) ??
      dmPostInboxExcerpt({
        body: row.body,
        media: row.media,
        senderId: row.sender_id,
        viewerId,
      });
    if (line) lines.set(row.conversation_id, line);
  }
  return lines;
}
