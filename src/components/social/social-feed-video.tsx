import { socialVideoDisplaySrc } from "@/lib/social-media-display";
import { socialMuxThumbnailUrl } from "@/lib/social-mux";
import { SocialMuxPlayer } from "./social-mux-player";

export type SocialFeedVideoItem = {
  url: string;
  playbackId?: string;
};

export function SocialFeedVideo({
  item,
  className,
}: {
  item: SocialFeedVideoItem;
  className?: string;
}) {
  if (item.playbackId) {
    return (
      <SocialMuxPlayer
        playbackId={item.playbackId}
        poster={item.url || socialMuxThumbnailUrl(item.playbackId)}
        className={className}
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
      className={className}
    />
  );
}
