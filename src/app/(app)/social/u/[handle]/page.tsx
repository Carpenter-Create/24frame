import { redirect } from "next/navigation";

import { SocialFollowButton } from "@/components/social/social-forms";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialShareButton } from "@/components/social/social-share-button";
import {
  SocialAuthorHistory,
  SocialHighlights,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { parseProfileHandleParam, SOCIAL, SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";
import {
  loadAuthorPosts,
  loadIsFollowing,
  loadLikedPostIds,
  loadLiveStories,
  loadProfileSocialCounts,
} from "@/lib/social-feed";
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
      <div data-social-member-missing="" className={SOCIAL_PAGE_CLASS}>
        <h1 className="sr-only">{SOCIAL.member.title}</h1>
        <SocialEmpty
          icon="warning-circle"
          eyebrow={SOCIAL.member.notFoundCode}
          title={SOCIAL.member.notFound}
          hint={SOCIAL.member.notFoundHint}
          action={{ href: SOCIAL_ROUTES.home, label: SOCIAL.member.goHome }}
          secondary={{ href: SOCIAL_ROUTES.explore, label: SOCIAL.member.goExplore }}
        >
          <p className="sr-only">{SOCIAL.member.missing}</p>
        </SocialEmpty>
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
  const counts = await loadProfileSocialCounts(supabase, member.id);

  return (
    <div data-social-member="" className={SOCIAL_PAGE_CLASS}>
      <h1 className="sr-only">{member.display_name}</h1>
      <div className="flex flex-col gap-[var(--space-6)]">
        <SocialProfileIdentity
          name={member.display_name}
          handle={member.handle}
          photoUrl={photoUrl}
          bio={member.bio}
          ring={liveStories.length > 0 ? "live" : null}
          stats={counts}
          actions={
            isSelf ? (
              <SocialShareButton handle={member.handle} />
            ) : own ? (
              <>
                <SocialFollowButton followeeId={member.id} handle={member.handle} following={following} />
                <SocialShareButton handle={member.handle} />
              </>
            ) : null
          }
        />
        <SocialHighlights
          cards={liveStories.map((story) => ({
            id: story.id,
            href: socialStoryHref(story.id),
            label: socialRelativeTime(story.created_at),
            photoUrl,
          }))}
        />
        <SocialAuthorHistory
          truncated={history.truncated}
          emptyHint={SOCIAL.profile.postsEmptyHint}
          emptyAction={{ href: SOCIAL_ROUTES.create, label: SOCIAL.profile.sharePost }}
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
