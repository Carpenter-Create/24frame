import { redirect } from "next/navigation";

import { SocialProfileBioEditor } from "@/components/social/social-profile-bio";
import { SOCIAL_ROUTES } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfileBioPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const supabase = await createClient();
  const { profile } = await ensureOwnSocialProfileResult(supabase, ctx.user);
  if (!profile) redirect(SOCIAL_ROUTES.profile);

  return <SocialProfileBioEditor bio={profile.bio ?? ""} />;
}
