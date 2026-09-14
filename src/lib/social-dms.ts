import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
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
    .select("id, body, sender_id, created_at, status")
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
