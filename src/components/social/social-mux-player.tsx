"use client";

import dynamic from "next/dynamic";

import { SOCIAL_MUX_PLAYER_CLASS } from "@/lib/social-chrome";
import { cn } from "@/lib/cn";

// Mux Player is browser-only. SSR paints the host so feed tests stay
// static. Adaptive Auto — no quality Settings control in v1.

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), { ssr: false });

export function SocialMuxPlayer({
  playbackId,
  className,
  poster,
}: {
  playbackId: string;
  className?: string;
  poster?: string;
}) {
  return (
    <div
      data-social-mux-player={playbackId}
      data-social-post-video=""
      className={cn(SOCIAL_MUX_PLAYER_CLASS, className)}
    >
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        playsInline
        preload="metadata"
        poster={poster}
        className="size-full object-cover"
        style={{ aspectRatio: "auto", width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}
