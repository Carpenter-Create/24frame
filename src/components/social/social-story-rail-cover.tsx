import { SocialMediaImage } from "@/components/social/social-media-image";
import { SOCIAL_STORY_CARD_IMAGE_SIZES } from "@/lib/social-media-display";
import { socialStoryRailCover } from "@/lib/social-edge";

// Home tall card fill. Story stills only. Video is not a native src.

export function SocialStoryRailCover({
  media,
  authorId,
}: {
  media: unknown;
  authorId: string;
}) {
  const cover = socialStoryRailCover(media, authorId);
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
      className="absolute inset-0 size-full object-cover"
    />
  );
}
