import { quotePostgrestValue } from "@/lib/social-home-bounds";

/**
 * DM access paths (class 6). Mapping C: profiles.id — no org_id.
 * Exclusive rooms are multi-party DMs (iMessage model), not gated groups.
 *
 * ACCESS PATH + CARDINALITY (independent caps; do not share PostgREST max_rows):
 *   add_conversation_participants  — refused. Membership is set when the
 *                                    thread is created. A 1:1 is not promoted.
 *   create_group_conversation      — fresh multi-party DM. Others ≤ 15.
 *                                    Room ≤ 16 including the creator.
 *   messages insert fan-out        — unread increment is one set-based UPDATE
 *                                    (cardinality = active room). Realtime inbox
 *                                    loop is LIMIT SOCIAL_DM_FANOUT_BATCH per
 *                                    message. No async remainder in this class:
 *                                    the room cannot exceed the batch.
 *   get_dm_inbox                   — caller's active rooms, last_message_at desc.
 *                                    Cap SOCIAL_DM_INBOX_LIMIT. SQL hard max 51.
 *   messages thread                — one conversation_id, status=active.
 *                                    created_at+id keyset (`before=`). Cap
 *                                    SOCIAL_DM_THREAD_LIMIT. Newest page first;
 *                                    display is chronological. Offset stays 0.
 *   conversation_participants      — active members of one room.
 *                                    Cap SOCIAL_DM_ROOM_LIMIT.
 *
 * Inbox and thread loaders probe limit+1 and splitProbe so a short page cannot
 * look finished. Thread uses range(0, limit) after a keyset WHERE — never
 * page-N OFFSET, never created_at ASC first-N (that hid recent messages).
 * Existing messages_conversation_created_idx (conversation_id, created_at desc)
 * covers the time order; id is the unique tie-break.
 */

/** Active people in one DM, including the caller. Cap 16. */
export const SOCIAL_DM_ROOM_LIMIT = 16;

/** Others in one create. Add-into-existing is refused. Same number as the room. */
export const SOCIAL_DM_ADD_BATCH_LIMIT = SOCIAL_DM_ROOM_LIMIT;

/**
 * Realtime inbox loop in 20260914420000 is still LIMIT 32.
 * That migration is not this apply. New rooms stop at SOCIAL_DM_ROOM_LIMIT.
 */
export const SOCIAL_DM_FANOUT_BATCH = 32;

/** Caller's inbox page. SQL least(..., 51) so the app can probe. */
export const SOCIAL_DM_INBOX_LIMIT = 50;

/** Latest messages in one thread. Keyset on (created_at desc, id desc). */
export const SOCIAL_DM_THREAD_LIMIT = 50;

export const SOCIAL_DM_THREAD_CURSOR_PARAM = "before";

export type DmThreadCursor = {
  createdAt: string;
  id: string;
};

const ISO_CREATED_AT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeDmThreadCursor(row: { created_at: string; id: string }): string {
  return `${row.created_at}|${row.id}`;
}

export function parseDmThreadCursor(raw: string | null | undefined): DmThreadCursor | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const sep = trimmed.lastIndexOf("|");
  if (sep <= 0 || sep === trimmed.length - 1) return null;
  const createdAt = trimmed.slice(0, sep);
  const id = trimmed.slice(sep + 1);
  if (!ISO_CREATED_AT.test(createdAt) || !UUID_RE.test(id)) return null;
  return { createdAt, id };
}

export function parseDmThreadCursorParam(
  raw: string | string[] | undefined,
): DmThreadCursor | null {
  return parseDmThreadCursor(Array.isArray(raw) ? raw[0] : raw);
}

/** `(created_at, id) < cursor` for `.or(...)` — older page, offset stays 0. */
export function dmThreadKeysetOrFilter(cursor: DmThreadCursor): string {
  const createdAt = quotePostgrestValue(cursor.createdAt);
  const id = quotePostgrestValue(cursor.id);
  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`;
}

export function socialDmThreadHref(
  conversationId: string,
  opts?: { before?: string | null },
): string {
  const base = `/social/dms/${encodeURIComponent(conversationId)}`;
  if (!opts?.before) return base;
  const params = new URLSearchParams();
  params.set(SOCIAL_DM_THREAD_CURSOR_PARAM, opts.before);
  return `${base}?${params.toString()}`;
}
