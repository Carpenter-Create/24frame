import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialDmComposePicker } from "@/components/social/social-dm-compose-picker";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialDmComposePage() {
  const session = await requireSocialSession();
  const profile = await ensureOwnSocialProfile(session.supabase, session.ctx.user);

  return (
    <div data-social-dm-new="">
      <PageHeader
        title={SOCIAL.dms.newMessage}
        backLink={{ href: SOCIAL_ROUTES.dms, label: SOCIAL.dms.title }}
      />
      {profile ? <SocialDmComposePicker /> : <HouseEmpty>{SOCIAL.dms.noProfileCta}</HouseEmpty>}
    </div>
  );
}
