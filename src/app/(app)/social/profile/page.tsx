import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialBioForm, SocialProfileCreateForm } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import { loadLiveStories, loadOwnProfile } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfilePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);
  const photoUrl = profile ? await signedAvatarUrl(profile.id) : null;
  const liveStories = profile ? await loadLiveStories(supabase, [profile.id]) : [];

  return (
    <div data-social-profile="">
      <PageHeader title={SOCIAL.profile.title} subtitle={SOCIAL.profile.subtitle} />
      {profile ? (
        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center gap-[var(--space-4)]">
            <SocialAvatar
              name={profile.display_name}
              photoUrl={photoUrl}
              ring={liveStories.length > 0 ? "live" : null}
            />
            <div>
              <p className="t-body font-medium text-ink">{profile.display_name}</p>
              <p className="t-body-sm text-ink-3">@{profile.handle}</p>
            </div>
          </div>
          <SocialBioForm bio={profile.bio ?? ""} />
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          <HouseEmpty>{SOCIAL.profile.emptyBody}</HouseEmpty>
          <SocialProfileCreateForm />
        </div>
      )}
    </div>
  );
}
