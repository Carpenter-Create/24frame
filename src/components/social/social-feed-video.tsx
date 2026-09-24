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
}: {
  item: SocialFeedVideoItem;
  className?: string;
}) {
  const fill = cn("size-full object-cover", className);
  if (item.playbackId) {
    return (
      <SocialMuxPlayer
        playbackId={item.playbackId}
        playbackPolicy={item.playbackPolicy}
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
