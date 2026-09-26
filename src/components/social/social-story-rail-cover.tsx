import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialStoryMuxThumb } from "@/components/social/social-story-mux-thumb";
import { SOCIAL_STORY_CARD_IMAGE_SIZES } from "@/lib/social-media-display";
import { socialStoryRailCover } from "@/lib/social-edge";

// Home tall card fill. Story stills only. Video is not a native src.
// loading=eager: the rail is overflow-x. iOS Safari's lazy loader misses
// those images and paints the broken-image glyph on a card that is on screen.

export function SocialStoryRailCover({
  media,
  authorId,
}: {
  media: unknown;
  authorId: string;
}) {
  const cover = socialStoryRailCover(media, authorId);
  if (cover?.playbackId) {
    return (
      <SocialStoryMuxThumb
        playbackId={cover.playbackId}
        playbackPolicy={cover.playbackPolicy}
        url={cover.url}
      />
    );
  }
  if (!cover || cover.kind !== "image" || !cover.url) {
    if (cover?.kind === "video") {
      return <div data-social-video-closed="" className="absolute inset-0 size-full object-cover" />;
    }
    return null;
  }
  return (
    <SocialMediaImage
      src={cover.url}
      sizes={SOCIAL_STORY_CARD_IMAGE_SIZES}
      alt=""
      loading="eager"
      className="absolute inset-0 size-full object-cover"
    />
  );
}
