import { Suspense } from "react";
import Link from "next/link";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialProfileCreateForm } from "@/components/social/social-forms";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialProfileTabs } from "@/components/social/social-profile-tabs";
import { SocialShareButton } from "@/components/social/social-share-button";
import { SocialForYouSkeleton, SocialProfileCenterSkeleton } from "@/components/social/social-skeletons";
import {
  SocialAuthorHistory,
  SocialHighlights,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SocialWelcomeVideo } from "@/components/social/social-welcome-video";
import { SOCIAL_ACTION_CLASS, SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId, signedSocialMediaUrl } from "@/lib/s3-social-media";
import {
  parseSocialProfileTab,
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
  socialPersonLabel,
  socialRelativeTime,
  socialStoryHref,
  type SocialProfileTab,
} from "@/lib/social";
import {
  loadAuthorPosts,
  loadFolloweeIds,
  loadLikedPostIds,
  loadLiveStories,
  loadProfileSocialCounts,
  loadSuggestedPeople,
} from "@/lib/social-feed";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

export default async function SocialProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const [session, sp] = await Promise.all([
    requireSocialSession(),
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const tab = parseSocialProfileTab(sp[SOCIAL_PROFILE_TAB_PARAM]);
  const { profile, error: ensureError } = await ensureOwnSocialProfileResult(session.supabase, session.ctx.user);

  if (!profile) {
    return (
      <div data-social-profile="" className={SOCIAL_PAGE_CLASS}>
        <h1 className="sr-only">{SOCIAL.profile.title}</h1>
        <div className="flex flex-col gap-[var(--space-4)]">
          {ensureError ? <InlineNotice tone="error">{ensureError}</InlineNotice> : null}
          <SocialProfileCreateForm />
        </div>
      </div>
    );
  }

  return (
    <div data-social-profile="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <Suspense fallback={<SocialProfileCenterSkeleton />}>
        <SocialProfileMain session={session} tab={tab} />
      </Suspense>
      <Suspense fallback={<SocialForYouSkeleton />}>
        <SocialProfileForYouSlot session={session} />
      </Suspense>
    </div>
  );
}

async function SocialProfileMain({
  session,
  tab,
}: {
  session: SocialSession;
  tab: SocialProfileTab;
}) {
  const { ctx, supabase } = session;
  const { profile } = await ensureOwnSocialProfileResult(supabase, ctx.user);
  if (!profile) return null;

  const [photoUrl, liveStoriesPage, history, counts, welcomeUrl] = await Promise.all([
    signedAvatarUrl(profile.id),
    loadLiveStories(supabase, [profile.id]),
    loadAuthorPosts(supabase, profile.id),
    loadProfileSocialCounts(supabase, profile.id),
    profile.welcome_video_key ? signedSocialMediaUrl(profile.welcome_video_key) : Promise.resolve(null),
  ]);
  const liveStories = liveStoriesPage.stories;
  const [media, liked] = await Promise.all([
    signedSocialMediaByPostId(history.posts),
    loadLikedPostIds(
      supabase,
      ctx.user.id,
      history.posts.map((post) => post.id),
    ),
  ]);

  const highlightCards = liveStories.map((story) => ({
    id: story.id,
    href: socialStoryHref(story.id),
    label: socialRelativeTime(story.created_at),
    photoUrl,
  }));

  return (
    <div className={SOCIAL_HOME_CENTER_CLASS}>
      <h1 className="sr-only">{SOCIAL.profile.title}</h1>
      <SocialProfileIdentity
        name={profile.display_name}
        handle={profile.handle}
        photoUrl={photoUrl}
        bio={profile.bio?.trim() ? profile.bio : SOCIAL.profile.ownFace}
        roles={profile.crafts}
        imdbUrl={profile.imdb_url}
        ring={liveStories.length > 0 ? "live" : null}
        stats={counts ?? undefined}
        actions={() => (
          <>
            <Link href={SOCIAL_ROUTES.profileEdit} className={`${SOCIAL_ACTION_CLASS} min-w-0 flex-1 text-center md:flex-none`}>
              {SOCIAL.profile.edit}
            </Link>
            <SocialShareButton handle={profile.handle} stretch />
          </>
        )}
      />
      {welcomeUrl ? <SocialWelcomeVideo src={welcomeUrl} /> : null}
      <SocialProfileTabs baseHref={SOCIAL_ROUTES.profile} active={tab} />
      {tab === "credits" ? (
        <SocialEmpty
          icon="film-slate"
          title={SOCIAL.profile.creditsEmpty}
          hint={SOCIAL.profile.creditsEmptyOwnHint}
        />
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
            emptyHint={SOCIAL.profile.postsEmptyOwnHint}
            emptyAction={{ href: SOCIAL_ROUTES.profileEdit, label: SOCIAL.profile.completeIdentity }}
            emptySecondary={{ href: SOCIAL_ROUTES.create, label: SOCIAL.profile.sharePost }}
            posts={history.posts.map((post) =>
              socialAuthorPostCard({
                post,
                authorHandle: profile.handle,
                authorName: socialPersonLabel({
                  handle: profile.handle,
                  displayName: profile.display_name,
                }),
                authorPhotoUrl: photoUrl,
                liked: liked.has(post.id),
                canLike: true,
                media: media.get(post.id) ?? [],
              }),
            )}
          />
        </>
      )}
    </div>
  );
}

async function SocialProfileForYouSlot({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const [{ profile }, followees] = await Promise.all([
    ensureOwnSocialProfileResult(supabase, ctx.user),
    loadFolloweeIds(supabase, ctx.user.id),
  ]);
  const suggested = await loadSuggestedPeople(
    supabase,
    [ctx.user.id, ...followees.ids],
    profile?.crafts ?? [],
  );
  const faces =
    suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();
  return <SocialForYouRail people={suggested} faces={faces} />;
}
