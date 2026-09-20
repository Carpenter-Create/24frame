import { SocialStoryCompose } from "@/components/social/social-forms";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { SOCIAL_NODE_RUNTIME } from "@/lib/social-edge";
import { requireSocialSession } from "@/lib/social-session";

export const runtime = SOCIAL_NODE_RUNTIME;

export default async function SocialStoryCreatePage() {
  const { ctx, supabase } = await requireSocialSession();
  await ensureOwnSocialProfile(supabase, ctx.user);

  return (
    <div
      data-social-story-new=""
      className="flex min-h-[70vh] flex-col items-center justify-end md:min-h-[640px] md:justify-center"
    >
      <h1 className="sr-only">{SOCIAL.stories.title}</h1>
      <SocialStoryCompose />
    </div>
  );
}
