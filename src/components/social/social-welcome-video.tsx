import { SOCIAL_WELCOME_VIDEO_CLASS } from "@/lib/social-chrome";
import { socialVideoDisplaySrc } from "@/lib/social-media-display";
import { SOCIAL } from "@/lib/social";

export function SocialWelcomeVideo({ src }: { src: string }) {
  if (!src) return null;
  return (
    <section data-social-welcome-video="" className={SOCIAL_WELCOME_VIDEO_CLASS}>
      <video
        data-social-welcome-video-player=""
        src={socialVideoDisplaySrc(src)}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-surface-muted object-contain"
      >
        {SOCIAL.profile.welcomeVideo}
      </video>
    </section>
  );
}
