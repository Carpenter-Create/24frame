import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_HOME_CHATS_LIMIT } from "@/lib/social-home-bounds";
import { socialHomeChatPreview, socialHomeChats } from "@/lib/social-home-chats";

describe("Social Home recent chats", () => {
  it("caps the Home preview at four rooms and keeps Messages as the full inbox", () => {
    expect(SOCIAL_HOME_CHATS_LIMIT).toBe(4);
    expect(SOCIAL.home.recentChats).toBe("Recent chats");
    expect(SOCIAL.home.chatsEmpty).toBe("No messages yet");
  });

  it("uses unread or last-active time — never invented snippet copy", () => {
    expect(socialHomeChatPreview({ last_message_at: null, unread_count: 2 })).toBe("2 unread");
    expect(
      socialHomeChatPreview({
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unread_count: 0,
      }),
    ).toBe("2h");
    expect(socialHomeChatPreview({ last_message_at: null, unread_count: 0 })).toBe("");
    expect(socialHomeChatPreview({ last_message_at: null, unread_count: 0 })).not.toContain("Loved");
  });

  it("labels rooms from title or peer names", () => {
    const chats = socialHomeChats(
      [
        {
          conversation_id: "c1",
          kind: "direct",
          last_message_at: null,
          muted: false,
          participant_ids: ["u2"],
          peer_id: "u2",
          title: null,
          unread_count: 0,
        },
      ],
      new Map([["u2", "Maya Chen"]]),
    );
    expect(chats).toEqual([
      {
        conversationId: "c1",
        label: "Maya Chen",
        preview: "",
        peerIds: ["u2"],
      },
    ]);
  });
});
