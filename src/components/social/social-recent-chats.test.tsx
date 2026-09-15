import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  SOCIAL_AVATAR_32_CLASS,
  SOCIAL_CHAT_EMPTY_CLASS,
  SOCIAL_CHAT_ROW_MUTED_CLASS,
  SOCIAL_CHATS_COLUMN_CLASS,
  SOCIAL_CHATS_PANEL_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SocialRecentChats } from "./social-recent-chats";

describe("Social recent chats column", () => {
  it("renders the empty quiet state and deep-links Messages", () => {
    const html = renderToStaticMarkup(<SocialRecentChats chats={[]} faces={new Map()} />);
    expect(html).toContain("data-social-recent-chats");
    expect(html).toContain("data-social-chats-empty");
    expect(html).toContain(SOCIAL.home.recentChats);
    expect(html).toContain(SOCIAL.home.chatsEmpty);
    expect(html).toContain(SOCIAL_ROUTES.dms);
    expect(html).toContain(SOCIAL_CHATS_COLUMN_CLASS);
    expect(html).toContain(SOCIAL_CHATS_PANEL_CLASS);
    expect(html).toContain(SOCIAL_CHAT_EMPTY_CLASS);
    expect(html).toContain('data-social-icon="chat-circle"');
    expect(html).not.toContain("/messages");
    expect(html).not.toContain("Loved the reel");
    expect(html).not.toContain("Inter");
  });

  it("renders 64px rows with av32 and room deep-links", () => {
    const html = renderToStaticMarkup(
      <SocialRecentChats
        chats={[
          {
            conversationId: "c1",
            label: "Maya Chen",
            preview: "2h",
            peerIds: ["u2"],
          },
        ]}
        faces={new Map([["u2", "https://s3.example/signed-avatar"]])}
      />,
    );
    expect(html).toContain('data-social-chat-row="c1"');
    expect(html).toContain("/social/dms/c1");
    expect(html).toContain("Maya Chen");
    expect(html).toContain("2h");
    expect(html).toContain(SOCIAL_CHAT_ROW_MUTED_CLASS);
    expect(html).toContain(SOCIAL_AVATAR_32_CLASS);
    expect(html).toContain("size-8");
    expect(html).toContain("h-16");
    expect(html).toContain('src="https://s3.example/signed-avatar"');
  });
});
