import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SocialStoryCompose } from "@/components/social/social-forms";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialStoryCreatePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  await ensureOwnSocialProfile(supabase, ctx.user);

  return (
    <div data-social-story-new="">
      <PageHeader title={SOCIAL.stories.title} subtitle={SOCIAL.stories.subtitle} />
      <SocialStoryCompose />
    </div>
  );
}
