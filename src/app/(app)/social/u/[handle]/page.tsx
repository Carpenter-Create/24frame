import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SocialFollowButton } from "@/components/social/social-forms";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialProfileTabs } from "@/components/social/social-profile-tabs";
import { SocialShareButton } from "@/components/social/social-share-button";
import {
  SocialAuthorHistory,
  SocialHighlights,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import {
  parseProfileHandleParam,
  parseSocialProfileTab,
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
  socialMemberHref,
  socialPersonLabel,
  socialProfileCanonicalUrl,
  socialProfileCasingRedirect,
  socialProfileTabHref,
  socialRelativeTime,
  socialStoryHref,
} from "@/lib/social";
import {
  loadAuthorPosts,
  loadFolloweeIds,
  loadIsFollowing,
  loadLikedPostIds,
  loadLiveStories,
  loadProfileSocialCounts,
  loadSuggestedPeople,
} from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = parseProfileHandleParam(raw);
  if (!handle) return {};
  return { alternates: { canonical: socialProfileCanonicalUrl(handle) } };
}

export default async function SocialPublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, { handle: raw }, sp] = await Promise.all([
    requireSocialSession(),
    params,
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const { ctx, supabase } = session;
  const handle = parseProfileHandleParam(raw);
  const tab = parseSocialProfileTab(sp[SOCIAL_PROFILE_TAB_PARAM]);
  const own = await ensureOwnSocialProfile(supabase, ctx.user);
  // Null is a missing handle or an RLS-hidden row — same empty state.
  const { data: member } = handle
    ? await supabase
        .from("profiles")
        .select("id, handle, display_name, status, bio")
        .eq("handle", handle)
        .maybeSingle()
    : { data: null };

  if (member) {
    const canonical = socialProfileCasingRedirect(handle, member.handle);
    if (canonical) {
      redirect(tab === "posts" ? canonical : socialProfileTabHref(canonical, tab));
    }
  }

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
  const followees = await loadFolloweeIds(supabase, ctx.user.id);
  const suggested = await loadSuggestedPeople(supabase, [ctx.user.id, member.id, ...followees.ids]);
  const faces = suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();
  const highlightCards = liveStories.map((story) => ({
    id: story.id,
    href: socialStoryHref(story.id),
    label: socialRelativeTime(story.created_at),
    photoUrl,
  }));
  const profileHref = socialMemberHref(member.handle);

  return (
    <div data-social-member="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <h1 className="sr-only">
          {socialPersonLabel({ handle: member.handle, displayName: member.display_name })}
        </h1>
        <SocialProfileIdentity
          name={member.display_name}
          handle={member.handle}
          photoUrl={photoUrl}
          bio={member.bio}
          ring={liveStories.length > 0 ? "live" : null}
          stats={counts}
          actions={
            isSelf
              ? () => <SocialShareButton handle={member.handle} stretch />
              : own
                ? () => (
                    <>
                      <SocialFollowButton
                        followeeId={member.id}
                        handle={member.handle}
                        following={following}
                        stretch
                      />
                      <SocialShareButton handle={member.handle} stretch />
                    </>
                  )
                : undefined
          }
        />
        <SocialProfileTabs baseHref={profileHref} active={tab} />
        {tab === "credits" ? (
          <SocialEmpty icon="film-slate" title={SOCIAL.profile.creditsEmpty} />
        ) : tab === "highlights" ? (
          highlightCards.length > 0 ? (
            <SocialHighlights cards={highlightCards} />
          ) : (
            <SocialEmpty icon="image" title={SOCIAL.profile.highlightsEmpty} hint={SOCIAL.profile.highlightsEmptyHint} />
          )
        ) : (
          <>
            <SocialHighlights cards={highlightCards} />
            <SocialAuthorHistory
              truncated={history.truncated}
              emptyHint={SOCIAL.profile.postsEmptyHint}
              emptyAction={{ href: SOCIAL_ROUTES.create, label: SOCIAL.profile.sharePost }}
              posts={history.posts.map((post) =>
                socialAuthorPostCard({
                  post,
                  authorHandle: member.handle,
                  authorName: socialPersonLabel({
                    handle: member.handle,
                    displayName: member.display_name,
                  }),
                  authorPhotoUrl: photoUrl,
                  liked: liked.has(post.id),
                  canLike: !!own,
                  media: media.get(post.id) ?? [],
                }),
              )}
            />
          </>
        )}
      </div>
      <SocialForYouRail people={suggested} faces={faces} />
    </div>
  );
}
