import { SOCIAL_WELCOME_VIDEO_CLASS } from "@/lib/social-chrome";
import { isSocialMuxId, type SocialMuxPlaybackPolicy } from "@/lib/social-mux";
import { SocialMuxPlayer } from "./social-mux-player";

// Welcome rows store an object key, not a playback id. Without a Mux id
// the band is an empty face. No raw mp4 in a video element.
export function SocialWelcomeVideo({
  src,
  playbackId,
  playbackPolicy,
}: {
  src: string;
  playbackId?: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
}) {
  if (!src && !playbackId) return null;
  return (
    <section data-social-welcome-video="" className={SOCIAL_WELCOME_VIDEO_CLASS}>
      {playbackId && isSocialMuxId(playbackId) ? (
        <SocialMuxPlayer playbackId={playbackId} playbackPolicy={playbackPolicy} className="aspect-video w-full" />
      ) : (
        <div data-social-video-closed="" className="aspect-video w-full bg-surface-muted" />
      )}
    </section>
  );
}
