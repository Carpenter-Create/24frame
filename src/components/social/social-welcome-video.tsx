import { SOCIAL_WELCOME_VIDEO_CLASS } from "@/lib/social-chrome";

// Presence only. The profile column has no Mux playback id, so the band
// is an empty face. It does not take a media URL.
export function SocialWelcomeVideo({ present }: { present: boolean }) {
  if (!present) return null;
  return (
    <section data-social-welcome-video="" className={SOCIAL_WELCOME_VIDEO_CLASS}>
      <div data-social-video-closed="" className="aspect-video w-full bg-surface-muted" />
    </section>
  );
}
