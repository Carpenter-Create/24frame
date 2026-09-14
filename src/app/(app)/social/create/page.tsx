import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SocialCreateCompose } from "@/components/social/social-forms";
import { SocialNeedProfile } from "@/components/social/social-ui";
import { SOCIAL } from "@/lib/social";
import { loadOwnProfile } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCreatePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);

  return (
    <div data-social-create="">
      <PageHeader title={SOCIAL.create.title} subtitle={SOCIAL.create.subtitle} />
      {profile ? <SocialCreateCompose /> : <SocialNeedProfile />}
    </div>
  );
}
