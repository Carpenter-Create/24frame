"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/cn";
import { SOCIAL_MUX_PLAYER_CLASS } from "@/lib/social-chrome";
import {
  SOCIAL_MUX_PLAYBACK_ROUTE,
  socialMuxPlaybackRequiresTokens,
  socialMuxPlaybackTokensFromJson,
  socialMuxThumbnailUrl,
  type SocialMuxPlaybackPolicy,
  type SocialMuxPlaybackTokens,
} from "@/lib/social-mux";

// Mux Player is browser-only. SSR paints the host so feed tests stay
// static. Signed policy mints tokens on the Node route. Public policy
// and rows with no policy play the playback id alone.
// Adaptive Auto — no quality Settings control in v1.

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

export function SocialMuxPlayer({
  playbackId,
  playbackPolicy,
  className,
}: {
  playbackId: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
  className?: string;
}) {
  const signed = socialMuxPlaybackRequiresTokens(playbackPolicy);
  const [mint, setMint] = useState<{ playbackId: string; tokens: SocialMuxPlaybackTokens } | null>(null);
  const tokens = signed && mint?.playbackId === playbackId ? mint.tokens : null;

  useEffect(() => {
    if (!signed) return;
    const controller = new AbortController();
    void fetch(`${SOCIAL_MUX_PLAYBACK_ROUTE}?playbackId=${encodeURIComponent(playbackId)}`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        const next = socialMuxPlaybackTokensFromJson(body);
        if (next) setMint({ playbackId, tokens: next });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [playbackId, signed]);

  return (
    <div
      data-social-mux-player={playbackId}
      data-social-mux-playback={signed ? (tokens ? "signed" : "pending") : "public"}
      data-social-post-video=""
      className={cn(SOCIAL_MUX_PLAYER_CLASS, className)}
    >
      {signed ? (
        tokens ? (
          <MuxPlayer
            playbackId={playbackId}
            tokens={{
              playback: tokens.playback,
              thumbnail: tokens.thumbnail,
              storyboard: tokens.storyboard,
            }}
            streamType="on-demand"
            playsInline
            preload="metadata"
            poster={socialMuxThumbnailUrl(playbackId, tokens.thumbnail)}
            className="size-full object-cover"
            style={{ aspectRatio: "auto", width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null
      ) : (
        <MuxPlayer
          playbackId={playbackId}
          streamType="on-demand"
          playsInline
          preload="metadata"
          poster={socialMuxThumbnailUrl(playbackId)}
          className="size-full object-cover"
          style={{ aspectRatio: "auto", width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
