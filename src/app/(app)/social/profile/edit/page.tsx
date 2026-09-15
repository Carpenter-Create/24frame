import { redirect } from "next/navigation";

import { SocialProfileEditForm } from "@/components/social/social-profile-edit";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL_ROUTES } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfileEditPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { profile } = await ensureOwnSocialProfileResult(supabase, ctx.user);
  if (!profile) redirect(SOCIAL_ROUTES.profile);

  const photoUrl = await signedAvatarUrl(profile.id);

  return (
    <SocialProfileEditForm
      handle={profile.handle}
      displayName={profile.display_name}
      bio={profile.bio ?? ""}
      photoUrl={photoUrl}
    />
  );
}
