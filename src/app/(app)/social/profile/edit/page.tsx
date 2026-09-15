import { SocialProfileEditForm } from "@/components/social/social-profile-edit";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL_ROUTES } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";
import { redirect } from "next/navigation";

export default async function SocialProfileEditPage() {
  const { ctx, supabase } = await requireSocialSession();
  const [{ profile }, photoUrl] = await Promise.all([
    ensureOwnSocialProfileResult(supabase, ctx.user),
    signedAvatarUrl(ctx.user.id),
  ]);
  if (!profile) redirect(SOCIAL_ROUTES.profile);

  return (
    <SocialProfileEditForm
      handle={profile.handle}
      displayName={profile.display_name}
      bio={profile.bio ?? ""}
      photoUrl={photoUrl}
    />
  );
}
