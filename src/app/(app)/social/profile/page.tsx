import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialBioForm, SocialProfileCreateForm } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { displayHandle, SOCIAL } from "@/lib/social";
import { loadLiveStories } from "@/lib/social-feed";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfilePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const { profile, error: ensureError } = await ensureOwnSocialProfileResult(supabase, ctx.user);
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
              <p className="t-body-sm text-ink-3">{displayHandle(profile.handle)}</p>
            </div>
          </div>
          <SocialProfileCreateForm handle={profile.handle} displayName={profile.display_name} />
          <SocialBioForm bio={profile.bio ?? ""} />
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          {ensureError ? <InlineNotice tone="error">{ensureError}</InlineNotice> : null}
          <SocialProfileCreateForm />
        </div>
      )}
    </div>
  );
}
