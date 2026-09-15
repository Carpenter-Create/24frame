import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_AVATAR_32_CLASS,
  SOCIAL_CHAT_EMPTY_CLASS,
  SOCIAL_CHAT_ROW_CLASS,
  SOCIAL_CHAT_ROW_MUTED_CLASS,
  SOCIAL_CHATS_COLUMN_CLASS,
  SOCIAL_CHATS_PANEL_CLASS,
} from "@/lib/social-chrome";
import type { SocialHomeChat } from "@/lib/social-home-chats";
import { SOCIAL_ICON_SIZE_SHARE } from "@/lib/social-icons";
import { SOCIAL, SOCIAL_ROUTES, socialDmHref, socialInitials } from "@/lib/social";

export function SocialRecentChats({
  chats,
  faces,
}: {
  chats: readonly SocialHomeChat[];
  faces: ReadonlyMap<string, string | null>;
}) {
  return (
    <aside data-social-recent-chats="" className={SOCIAL_CHATS_COLUMN_CLASS}>
      <div className={SOCIAL_CHATS_PANEL_CLASS}>
        <Link
          href={SOCIAL_ROUTES.dms}
          data-social-recent-chats-title=""
          className="t-body-sm font-medium tracking-[0.2px] text-ink-2"
        >
          {SOCIAL.home.recentChats}
        </Link>
        {chats.length === 0 ? (
          <Link
            href={SOCIAL_ROUTES.dms}
            data-social-chats-empty=""
            className={SOCIAL_CHAT_EMPTY_CLASS}
          >
            <SocialIcon name="chat-circle" size={22} className="text-ink-2" />
            <span className="t-body-sm text-ink-2">{SOCIAL.home.chatsEmpty}</span>
          </Link>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {chats.map((chat, index) => {
              const peerId = chat.peerIds[0];
              const photo = peerId ? faces.get(peerId) : null;
              return (
                <Link
                  key={chat.conversationId}
                  href={socialDmHref(chat.conversationId)}
                  data-social-chat-row={chat.conversationId}
                  className={index === 0 ? SOCIAL_CHAT_ROW_MUTED_CLASS : SOCIAL_CHAT_ROW_CLASS}
                >
                  <span className={SOCIAL_AVATAR_32_CLASS}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
                      <img src={photo} alt="" className="size-full object-cover" />
                    ) : (
                      socialInitials(chat.label)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-body-sm font-medium text-ink">{chat.label}</span>
                    {chat.preview ? (
                      <span className="block truncate text-[12px] text-ink-2">{chat.preview}</span>
                    ) : null}
                  </span>
                  <SocialIcon
                    name="chat-circle"
                    size={SOCIAL_ICON_SIZE_SHARE}
                    className="shrink-0 text-ink-3"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
