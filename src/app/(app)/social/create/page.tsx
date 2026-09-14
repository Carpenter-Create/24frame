import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SocialCreateCompose } from "@/components/social/social-forms";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCreatePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  await ensureOwnSocialProfile(supabase, ctx.user);

  return (
    <div data-social-create="">
      <PageHeader title={SOCIAL.create.title} subtitle={SOCIAL.create.subtitle} />
      <SocialCreateCompose />
    </div>
  );
}
