import Link from "next/link";

import { StatusChip } from "@/components/layout/status-chip";
import {
  CHANNEL_CARD_CLASS,
  CHANNEL_META_CLASS,
  CHANNEL_NAME_CLASS,
  CHANNEL_PLATE_CLASS,
  CHANNEL_TAGS_CLASS,
} from "@/lib/channel-card";
import { directoryInitials } from "@/lib/staff-directory";
import type { ChannelCardTag } from "@/lib/vendors-directory";

export type ChannelCardModel = {
  id: string;
  name: string;
  href: string;
  tags: readonly ChannelCardTag[];
  meta: string | null;
};

export function ChannelCard({ channel }: { channel: ChannelCardModel }) {
  return (
    <Link data-channel-card={channel.id} href={channel.href} className={CHANNEL_CARD_CLASS}>
      <span data-channel-card-plate="" className={CHANNEL_PLATE_CLASS}>
        {directoryInitials(channel.name)}
      </span>
      {channel.tags.length > 0 ? (
        <span data-channel-card-tags="" className={CHANNEL_TAGS_CLASS}>
          {channel.tags.map((tag) => (
            <StatusChip key={tag.label} label={tag.label} tone={tag.tone} />
          ))}
        </span>
      ) : null}
      <span className={CHANNEL_NAME_CLASS}>{channel.name}</span>
      {channel.meta ? <span className={CHANNEL_META_CLASS}>{channel.meta}</span> : null}
    </Link>
  );
}
