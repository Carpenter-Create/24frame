import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialFollowButton, SocialMessageButton } from "@/components/social/social-forms";
import {
  SocialAuthorHistory,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { displayHandle, parseProfileHandleParam, SOCIAL } from "@/lib/social";
import { loadAuthorPosts, loadIsFollowing, loadLikedPostIds, loadLiveStories } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialPublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { handle: raw } = await params;
  const handle = parseProfileHandleParam(raw);
  const supabase = await createClient();
  const own = await ensureOwnSocialProfile(supabase, ctx.user);
  // Null is a missing handle or an RLS-hidden row — same empty state.
  const { data: member } = handle
    ? await supabase
        .from("profiles")
        .select("id, handle, display_name, status, bio")
        .eq("handle", handle)
        .maybeSingle()
    : { data: null };

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
  const liveStories = (await loadLiveStories(supabase, [member.id])).stories;
  const following = own && !isSelf ? await loadIsFollowing(supabase, ctx.user.id, member.id) : false;
  const history = await loadAuthorPosts(supabase, member.id);
  const media = await signedSocialMediaByPostId(history.posts);
  const liked = own
    ? await loadLikedPostIds(
        supabase,
        ctx.user.id,
        history.posts.map((post) => post.id),
      )
    : new Set<string>();

  return (
    <div data-social-member="">
      <PageHeader title={member.display_name} subtitle={displayHandle(member.handle)} />
      <div className="flex flex-col gap-[var(--space-4)]">
        <SocialProfileIdentity
          name={member.display_name}
          handle={member.handle}
          photoUrl={photoUrl}
          bio={member.bio}
          ring={liveStories.length > 0 ? "live" : null}
        >
          {isSelf || !own ? null : (
            <>
              <SocialFollowButton followeeId={member.id} handle={member.handle} following={following} />
              <SocialMessageButton peerId={member.id} />
            </>
          )}
        </SocialProfileIdentity>
        <SocialAuthorHistory
          truncated={history.truncated}
          posts={history.posts.map((post) =>
            socialAuthorPostCard({
              post,
              authorHandle: member.handle,
              authorName: member.display_name,
              authorPhotoUrl: photoUrl,
              liked: liked.has(post.id),
              canLike: !!own,
              media: media.get(post.id) ?? [],
            }),
          )}
        />
      </div>
    </div>
  );
}
