import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialGroupCreateForm } from "@/components/social/social-forms";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadOwnProfile } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialGroupNewPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);
  const { data: canCreate } = profile
    ? await supabase.rpc("has_capability", { p_user: ctx.user.id, p_cap: "create_group" })
    : { data: false };

  return (
    <div data-social-group-new="">
      <PageHeader
        title={SOCIAL.groupNew.title}
        backLink={{ href: SOCIAL_ROUTES.groups, label: SOCIAL.groups.title }}
      />
      {canCreate === true ? (
        <SocialGroupCreateForm />
      ) : (
        <div data-social-group-forbidden="">
          <HouseEmpty>{SOCIAL.groups.forbidden}</HouseEmpty>
        </div>
      )}
    </div>
  );
}
