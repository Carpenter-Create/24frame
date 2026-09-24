"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/cn";
import { SOCIAL_MUX_PLAYER_CLASS } from "@/lib/social-chrome";
import {
  SOCIAL_MUX_PLAYBACK_ROUTE,
  socialMuxPlaybackTokensFromJson,
  socialMuxThumbnailUrl,
  type SocialMuxPlaybackTokens,
} from "@/lib/social-mux";

// Mux Player is browser-only. SSR paints the host so feed tests stay
// static. Tokens are minted on the Node route after GC-P1-4 signed policy.
// Adaptive Auto — no quality Settings control in v1.

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

export function SocialMuxPlayer({
  playbackId,
  className,
}: {
  playbackId: string;
  className?: string;
}) {
  const [mint, setMint] = useState<{ playbackId: string; tokens: SocialMuxPlaybackTokens } | null>(null);
  const tokens = mint?.playbackId === playbackId ? mint.tokens : null;

  useEffect(() => {
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
  }, [playbackId]);

  return (
    <div
      data-social-mux-player={playbackId}
      data-social-mux-playback={tokens ? "signed" : "pending"}
      data-social-post-video=""
      className={cn(SOCIAL_MUX_PLAYER_CLASS, className)}
    >
      {tokens ? (
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
      ) : null}
    </div>
  );
}
