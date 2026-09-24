import { SocialMediaImage } from "@/components/social/social-media-image";
import { SOCIAL_STORY_CARD_IMAGE_SIZES, socialVideoDisplaySrc } from "@/lib/social-media-display";
import { socialStoryRailCover } from "@/lib/social-edge";

// Home tall card fill. Story media cover, not the profile photo.
// Video is a paused still on the same media path. No second CDN.

export function SocialStoryRailCover({
  media,
  authorId,
}: {
  media: unknown;
  authorId: string;
}) {
  const cover = socialStoryRailCover(media, authorId);
  if (!cover) return null;
  if (cover.kind === "video") {
    return (
      <video
        data-social-story-cover=""
        muted
        playsInline
        preload="metadata"
        src={socialVideoDisplaySrc(cover.url)}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
    );
  }
  return <SocialMediaImage src={cover.url} sizes={SOCIAL_STORY_CARD_IMAGE_SIZES} alt="" />;
}
