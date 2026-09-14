import { redirect } from "next/navigation";

import { SocialCreateCompose } from "@/components/social/social-forms";
import { SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCreatePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const photoUrl = profile ? await signedAvatarUrl(profile.id) : null;

  return (
    <div data-social-create="" className={SOCIAL_PAGE_CLASS}>
      <h1 className="sr-only">{SOCIAL.create.title}</h1>
      <SocialCreateCompose
        authorName={profile?.display_name ?? SOCIAL.home.you}
        authorPhotoUrl={photoUrl}
      />
    </div>
  );
}
