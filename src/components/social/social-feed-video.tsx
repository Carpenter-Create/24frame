import { cn } from "@/lib/cn";
import { socialVideoDisplaySrc } from "@/lib/social-media-display";
import type { SocialMuxPlaybackPolicy } from "@/lib/social-mux";
import { SocialMuxPlayer } from "./social-mux-player";

export type SocialFeedVideoItem = {
  url: string;
  playbackId?: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
};

export function SocialFeedVideo({
  item,
  className,
  fit = "cover",
}: {
  item: SocialFeedVideoItem;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const fill = cn(fit === "contain" ? "size-full object-contain" : "size-full object-cover", className);
  if (item.playbackId) {
    return (
      <SocialMuxPlayer
        playbackId={item.playbackId}
        playbackPolicy={item.playbackPolicy}
        fit={fit}
        className={fill}
      />
    );
  }
  return (
    <video
      data-social-post-video=""
      controls
      preload="metadata"
      playsInline
      src={socialVideoDisplaySrc(item.url)}
      className={fill}
    />
  );
}
