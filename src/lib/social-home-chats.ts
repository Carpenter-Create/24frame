import { conversationRoomLabel, inboxPeerIds, socialRelativeTime } from "@/lib/social";
import type { DmInboxRow } from "@/lib/social-dms";

// Home recent-chats preview. Inbox RPC stays class 6 — no new SQL.
// Preview is unread count or last-active time, never invented message text.

export type SocialHomeChat = {
  conversationId: string;
  label: string;
  preview: string;
  peerIds: string[];
};

export function socialHomeChatPreview(row: Pick<DmInboxRow, "last_message_at" | "unread_count">): string {
  if (row.unread_count > 0) return `${row.unread_count} unread`;
  if (row.last_message_at) return socialRelativeTime(row.last_message_at);
  return "";
}

export function socialHomeChats(
  rows: readonly DmInboxRow[],
  namesById: ReadonlyMap<string, string>,
): SocialHomeChat[] {
  return rows.map((row) => {
    const peerIds = inboxPeerIds(row);
    const names = peerIds.map((id) => namesById.get(id) ?? "");
    return {
      conversationId: row.conversation_id,
      label: conversationRoomLabel(row.title, names),
      preview: socialHomeChatPreview(row),
      peerIds,
    };
  });
}
