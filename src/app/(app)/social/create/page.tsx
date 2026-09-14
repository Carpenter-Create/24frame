import { redirect } from "next/navigation";

import { SocialCreateCompose } from "@/components/social/social-forms";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { parseSocialCreateKind, SOCIAL } from "@/lib/social";
import { loadFolloweeIds, loadSuggestedPeople } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const [ctx, sp] = await Promise.all([
    getOrgContext(),
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  if (!ctx) redirect("/login");
  const initialKind = parseSocialCreateKind(sp.kind);
  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const [photoUrl, followees] = await Promise.all([
    profile ? signedAvatarUrl(profile.id) : Promise.resolve(null),
    profile
      ? loadFolloweeIds(supabase, ctx.user.id)
      : Promise.resolve({ ids: [] as string[], truncated: false }),
  ]);
  const suggested = await loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]);
  const faces = suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();

  return (
    <div data-social-create="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <h1 className="sr-only">{SOCIAL.create.title}</h1>
        <SocialCreateCompose
          authorName={profile?.display_name ?? SOCIAL.home.you}
          authorHandle={profile?.handle ?? null}
          authorPhotoUrl={photoUrl}
          initialKind={initialKind}
        />
      </div>
      <SocialForYouRail people={suggested} faces={faces} />
    </div>
  );
}
