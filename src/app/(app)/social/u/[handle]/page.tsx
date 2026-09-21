import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SocialActivityHistory } from "@/components/social/social-activity-history";
import { SocialFollowButton } from "@/components/social/social-engagement";
import { SocialQueryBound } from "@/components/social/social-query-bound";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialProfileTabs } from "@/components/social/social-profile-tabs";
import { SocialShareButton } from "@/components/social/social-share-button";
import {
  SocialHighlights,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SocialWelcomeVideo } from "@/components/social/social-welcome-video";
import { SOCIAL_PAGE_CLASS, SOCIAL_PROFILE_CENTER_CLASS } from "@/lib/social-chrome";
import {
  socialAvatarFaces,
  socialAvatarHref,
  socialMediaHref,
  socialMediaProxiesByPostId,
} from "@/lib/social-edge";
import {
  isLegacySocialProfilePostsTab,
  parseProfileHandleParam,
  parseSocialProfileTab,
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
  socialMemberHref,
  socialPersonLabel,
  socialProfileCanonicalUrl,
  socialProfileCasingRedirect,
  socialProfileLegacyPostsTabHref,
  socialRelativeTime,
  socialStoryHref,
} from "@/lib/social";
import {
  parseSocialActivityPill,
  SOCIAL_ACTIVITY_PILL_PARAM,
  socialProfileViewHref,
} from "@/lib/social-activity";
import {
  loadAuthorActivityComments,
  loadAuthorActivityPosts,
  loadLikedPostIds,
  loadLiveStories,
  loadProfileMutuals,
  loadProfilesByIds,
} from "@/lib/social-feed";
import { loadCachedIsFollowing, loadCachedProfileSocialCounts, loadCachedSocialProfileByHandle } from "@/lib/social-hot-reads";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";

export const runtime = "edge";

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
  const rawTab = sp[SOCIAL_PROFILE_TAB_PARAM];
  const tab = parseSocialProfileTab(rawTab);
  const activity = parseSocialActivityPill(sp[SOCIAL_ACTIVITY_PILL_PARAM]);
  const own = await ensureOwnSocialProfile(supabase, ctx.user);
  // Null is a missing handle or an RLS-hidden row — same empty state.
  const member = handle ? await loadCachedSocialProfileByHandle(supabase, handle) : null;
  const legacyPosts = isLegacySocialProfilePostsTab(rawTab);

  if (member) {
    const canonical = socialProfileCasingRedirect(handle, member.handle);
    if (canonical || legacyPosts) {
      const destBase = canonical ?? socialMemberHref(member.handle);
      redirect(
        legacyPosts
          ? socialProfileLegacyPostsTabHref(destBase)
          : socialProfileViewHref(destBase, tab, activity),
      );
    }
  } else if (legacyPosts && handle) {
    redirect(socialProfileLegacyPostsTabHref(socialMemberHref(handle)));
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
  const photoUrl = socialAvatarHref(member.id);
  const welcomeUrl = member.welcome_video_key ? socialMediaHref(member.welcome_video_key) : null;
  const coverUrl = member.cover_key ? socialMediaHref(member.cover_key) : null;
  const liveStories = (await loadLiveStories(supabase, [member.id])).stories;
  const following = own && !isSelf ? await loadCachedIsFollowing(supabase, ctx.user.id, member.id) : false;
  const commentsPage =
    tab === "activity" && activity === "comments"
      ? await loadAuthorActivityComments(supabase, member.id)
      : { items: [], truncated: false };
  const filtered =
    tab === "activity" && activity !== "comments"
      ? await loadAuthorActivityPosts(supabase, member.id, activity)
      : { posts: [], truncated: false };
  const commentParentPosts = commentsPage.items.map((item) => item.post);
  const cardPosts =
    tab === "activity" && activity === "comments"
      ? commentParentPosts
      : filtered.posts;
  const parentAuthors =
    tab === "activity" && activity === "comments"
      ? await loadProfilesByIds(
          supabase,
          [...new Set(commentParentPosts.map((post) => post.author_id))],
        )
      : new Map();
  const media = socialMediaProxiesByPostId(cardPosts);
  const liked = own
    ? await loadLikedPostIds(
        supabase,
        ctx.user.id,
        cardPosts.map((post) => post.id),
      )
    : new Set<string>();
  const parentFaces =
    tab === "activity" && activity === "comments"
      ? socialAvatarFaces([...parentAuthors.keys()])
      : new Map();
  const counts = await loadCachedProfileSocialCounts(supabase, member.id);
  const mutuals = isSelf ? null : await loadProfileMutuals(supabase, ctx.user.id, member.id);
  const mutualFaces =
    mutuals && mutuals.people.length > 0
      ? socialAvatarFaces(mutuals.people.map((person) => person.id))
      : new Map();
  const highlightCards = liveStories.map((story) => ({
    id: story.id,
    href: socialStoryHref(story.id),
    label: socialRelativeTime(story.created_at),
    photoUrl,
  }));
  const profileHref = socialMemberHref(member.handle);

  return (
    <div data-social-member="" className={SOCIAL_PROFILE_CENTER_CLASS}>
        <h1 className="sr-only">
          {socialPersonLabel({ handle: member.handle, displayName: member.display_name })}
        </h1>
        <SocialQueryBound
          profile={member}
          counts={counts}
          follow={own && !isSelf ? { viewerId: ctx.user.id, targetId: member.id, following } : null}
        />
        <SocialProfileIdentity
          name={member.display_name}
          handle={member.handle}
          photoUrl={photoUrl}
          coverUrl={coverUrl}
          bio={member.bio}
          roles={member.crafts}
          topics={member.topics}
          websiteUrl={member.website_url}
          imdbUrl={member.imdb_url}
          ring={liveStories.length > 0 ? "live" : null}
          profileId={member.id}
          stats={counts}
          mutuals={
            mutuals && mutuals.people.length > 0
              ? {
                  people: mutuals.people.map((person) => ({
                    ...person,
                    photoUrl: mutualFaces.get(person.id) ?? null,
                  })),
                  extra: mutuals.extra,
                }
              : null
          }
          actions={
            isSelf ? (
              <SocialShareButton handle={member.handle} stretch />
            ) : own ? (
              <>
                <SocialFollowButton
                  followeeId={member.id}
                  handle={member.handle}
                  following={following}
                  viewerId={ctx.user.id}
                  stretch
                />
                <SocialShareButton handle={member.handle} stretch />
              </>
            ) : undefined
          }
        />
        {welcomeUrl ? <SocialWelcomeVideo src={welcomeUrl} /> : null}
        <SocialProfileTabs baseHref={profileHref} active={tab} />
        {tab === "credits" ? (
          <SocialEmpty
            icon="film-slate"
            title={SOCIAL.profile.creditsEmpty}
            hint={SOCIAL.profile.creditsEmptyHint}
          />
        ) : tab === "highlights" ? (
          highlightCards.length > 0 ? (
            <SocialHighlights cards={highlightCards} />
          ) : (
            <SocialEmpty icon="image" title={SOCIAL.profile.highlightsEmpty} hint={SOCIAL.profile.highlightsEmptyHint} />
          )
        ) : (
          <SocialActivityHistory
            baseHref={profileHref}
            pill={activity}
            truncated={activity === "comments" ? commentsPage.truncated : filtered.truncated}
            posts={filtered.posts.map((post) =>
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
            comments={commentsPage.items.map((item) => {
              const author = parentAuthors.get(item.post.author_id);
              return {
                commentId: item.comment.id,
                body: item.comment.body,
                commentedAt: item.comment.created_at,
                post: socialAuthorPostCard({
                  post: item.post,
                  authorHandle: author?.handle ?? member.handle,
                  authorName: socialPersonLabel({
                    handle: author?.handle ?? member.handle,
                    displayName: author?.display_name ?? member.display_name,
                  }),
                  authorPhotoUrl: parentFaces.get(item.post.author_id) ?? photoUrl,
                  liked: liked.has(item.post.id),
                  canLike: !!own,
                  media: media.get(item.post.id) ?? [],
                }),
              };
            })}
          />
        )}
    </div>
  );
}
