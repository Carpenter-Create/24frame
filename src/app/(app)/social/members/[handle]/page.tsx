import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialFollowButton, SocialMessageButton } from "@/components/social/social-forms";
import { SocialAvatar, SocialNeedProfile } from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import { loadIsFollowing, loadLiveStories, loadOwnProfile } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialMemberPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { handle } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("id, handle, display_name, status")
    .eq("handle", decodeURIComponent(handle))
    .maybeSingle();
  const own = await loadOwnProfile(supabase, ctx.user.id);

  if (!member) {
    return (
      <div data-social-member-missing="">
        <PageHeader title={SOCIAL.member.title} />
        <HouseEmpty>{SOCIAL.member.missing}</HouseEmpty>
      </div>
    );
  }

  const isSelf = member.id === ctx.user.id;
  const photoUrl = await signedAvatarUrl(member.id);
  const liveStories = await loadLiveStories(supabase, [member.id]);
  const following = own && !isSelf ? await loadIsFollowing(supabase, ctx.user.id, member.id) : false;

  return (
    <div data-social-member="">
      <PageHeader title={member.display_name} subtitle={`@${member.handle}`} />
      <div className="flex flex-col gap-[var(--space-4)]">
        <SocialAvatar
          name={member.display_name}
          photoUrl={photoUrl}
          ring={liveStories.length > 0 ? "live" : null}
        />
        {isSelf ? null : own ? (
          <>
            <SocialFollowButton followeeId={member.id} handle={member.handle} following={following} />
            <SocialMessageButton peerId={member.id} />
          </>
        ) : (
          <SocialNeedProfile />
        )}
      </div>
    </div>
  );
}
