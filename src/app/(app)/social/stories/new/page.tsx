import { redirect } from "next/navigation";

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
    <div
      data-social-story-new=""
      className="flex min-h-[70vh] flex-col justify-end md:min-h-[640px] md:items-center md:justify-center"
    >
      <h1 className="sr-only">{SOCIAL.stories.createCta}</h1>
      <SocialStoryCompose />
    </div>
  );
}
