"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialMuxPlayer } from "@/components/social/social-mux-player";
import { SOCIAL } from "@/lib/social";
import { POST_SHARE_CARD_WIDTH_CLASS } from "@/lib/social-post-share";
import type { SocialMuxPlaybackPolicy } from "@/lib/social-mux";

// Post share card. Media, author, caption snip. Video is Mux-only.
// Side alignment lives on the thread group. This card does not center itself.

function AuthorRow({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl: string | null;
}) {
  const label = authorName || SOCIAL.dms.postMeta;
  return (
    <div data-social-dm-post-author="" className="flex min-w-0 items-center gap-2">
      <SocialAvatar name={label} photoUrl={authorPhotoUrl} size="sm" className="size-6" />
      <p className="min-w-0 break-words t-body-sm font-medium text-ink">{label}</p>
    </div>
  );
}

export function SocialDmPostShare({
  authorName,
  authorPhotoUrl,
  caption,
  kind,
  url,
  playbackId,
  playbackPolicy,
  href,
}: {
  authorName: string;
  authorPhotoUrl: string | null;
  caption: string | null;
  kind: "image" | "video" | null;
  url: string | null;
  playbackId?: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
  href: string;
}) {
  const frame = "absolute inset-0 size-full overflow-hidden bg-[#0A0A0B]";
  let media: ReactNode = null;
  if (kind === "video" && playbackId) {
    media = (
      <div data-social-dm-post-video="" className={`relative aspect-square ${POST_SHARE_CARD_WIDTH_CLASS}`}>
        <div className={frame}>
          <SocialMuxPlayer
            playbackId={playbackId}
            playbackPolicy={playbackPolicy}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    );
  } else if (kind === "image" && url) {
    media = (
      <Link href={href} data-social-dm-post-photo="" className={`relative block aspect-square ${POST_SHARE_CARD_WIDTH_CLASS}`}>
        <div className={frame}>
          <SocialMediaImage src={url} sizes="240px" alt="" />
        </div>
      </Link>
    );
  }

  const copy = (
    <div className="flex flex-col gap-2 p-2">
      <AuthorRow authorName={authorName} authorPhotoUrl={authorPhotoUrl} />
      {caption ? (
        <p data-social-dm-post-caption="" className="break-words t-body-sm text-ink">
          {caption}
        </p>
      ) : null}
      {!media && !caption ? (
        <p className="break-words t-body-sm text-ink-2">{SOCIAL.dms.postUnavailable}</p>
      ) : null}
    </div>
  );

  return (
    <article
      data-social-dm-post-share=""
      className={`${POST_SHARE_CARD_WIDTH_CLASS} shrink-0 overflow-hidden rounded-[8px] border border-hairline bg-surface`}
    >
      {media}
      <Link href={href} data-social-dm-post-open="" className="block">
        {copy}
      </Link>
    </article>
  );
}
