"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialFeedVideo } from "@/components/social/social-feed-video";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SOCIAL } from "@/lib/social";

// Send-story DM craft v1.1. One card. Video is SocialFeedVideo — Mux when
// the item has a playback id, otherwise the native video that host already
// renders. Tap fullscreens that host. No second player. No lightbox.

function fullscreenSameHost(well: HTMLElement) {
  const player = well.querySelector("[data-social-mux-player], video");
  const node = player instanceof HTMLElement ? player : well;
  if (typeof node.requestFullscreen === "function") {
    void node.requestFullscreen();
  }
}

export function SocialDmStoryShare({
  authorName,
  authorPhotoUrl,
  unavailable,
  kind,
  url,
  playbackId,
  href,
}: {
  authorName: string;
  authorPhotoUrl: string | null;
  unavailable: boolean;
  kind: "image" | "video" | null;
  url: string | null;
  playbackId?: string;
  href: string | null;
}) {
  const well = "relative aspect-[9/16] w-full overflow-hidden bg-surface-muted";
  let media: ReactNode = null;
  if (unavailable || !url || !kind) {
    media = (
      <p className={`${well} flex items-center justify-center px-[8px] text-center t-body-sm text-ink-2 break-words`}>
        {SOCIAL.dms.storyUnavailable}
      </p>
    );
  } else if (kind === "video") {
    media = (
      <div
        data-social-dm-story-video=""
        className={well}
        onClick={(event) => fullscreenSameHost(event.currentTarget)}
      >
        <SocialFeedVideo
          item={{ url, playbackId }}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    );
  } else if (href) {
    media = (
      <Link href={href} data-social-dm-story-photo="" className={`${well} block`}>
        <SocialMediaImage src={url} sizes="168px" alt="" />
      </Link>
    );
  } else {
    media = (
      <div data-social-dm-story-photo="" className={well}>
        <SocialMediaImage src={url} sizes="168px" alt="" />
      </div>
    );
  }

  return (
    <article
      data-social-dm-story-share=""
      className="w-[168px] shrink-0 overflow-hidden rounded-[8px] bg-surface"
    >
      {media}
      {authorName ? (
        <footer className="flex items-center gap-[8px] p-[8px]">
          <SocialAvatar name={authorName} photoUrl={authorPhotoUrl} size="sm" className="size-6" />
          <div className="min-w-0">
            <p className="break-words t-body-sm text-ink">{authorName}</p>
            <p className="t-label text-ink-3">{SOCIAL.dms.storyMeta}</p>
          </div>
        </footer>
      ) : null}
    </article>
  );
}
