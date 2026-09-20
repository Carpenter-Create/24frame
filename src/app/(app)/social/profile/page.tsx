import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialProfileCreateForm } from "@/components/social/social-forms";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialProfileTabs } from "@/components/social/social-profile-tabs";
import { SocialQueryBound } from "@/components/social/social-query-bound";
import { SocialShareButton } from "@/components/social/social-share-button";
import { SocialProfileCenterSkeleton } from "@/components/social/social-skeletons";
import { SocialOwnProfileFace } from "@/components/social/social-own-profile";
import {
  SocialAuthorHistory,
  SocialHighlights,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SOCIAL_ACTION_CLASS, SOCIAL_PAGE_CLASS, SOCIAL_PROFILE_CENTER_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId, signedSocialMediaUrl } from "@/lib/s3-social-media";
import {
  parseSocialProfileTab,
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
  socialCreateHref,
  socialPersonLabel,
  socialRelativeTime,
  socialStoryHref,
  type SocialProfileTab,
} from "@/lib/social";
import {
  loadAuthorPosts,
  loadLikedPostIds,
  loadLiveStories,
} from "@/lib/social-feed";
import { loadCachedProfileSocialCounts } from "@/lib/social-hot-reads";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import {
  mergeSocialProfileIdentity,
  readSocialProfileOptimisticCookie,
} from "@/lib/social-profile-edit";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

export const runtime = "nodejs";

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
    <div data-social-profile="" className={SOCIAL_PROFILE_CENTER_CLASS}>
      <Suspense fallback={<SocialProfileCenterSkeleton />}>
        <SocialProfileMain session={session} tab={tab} />
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

  const [photoUrl, liveStoriesPage, history, counts, welcomeUrl, jar] = await Promise.all([
    signedAvatarUrl(profile.id),
    loadLiveStories(supabase, [profile.id]),
    loadAuthorPosts(supabase, profile.id),
    loadCachedProfileSocialCounts(supabase, profile.id),
    profile.welcome_video_key ? signedSocialMediaUrl(profile.welcome_video_key) : Promise.resolve(null),
    cookies(),
  ]);
  const identity = mergeSocialProfileIdentity(
    {
      handle: profile.handle,
      displayName: profile.display_name,
      photoUrl,
      bio: profile.bio ?? "",
      crafts: profile.crafts ?? [],
      topics: profile.topics ?? [],
      websiteUrl: profile.website_url ?? null,
      imdbUrl: profile.imdb_url ?? null,
      welcomeVideoUrl: welcomeUrl,
    },
    readSocialProfileOptimisticCookie((name) => jar.get(name)?.value),
  );
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
    <>
      <h1 className="sr-only">{SOCIAL.profile.title}</h1>
      <SocialQueryBound profile={profile} counts={counts} />
      <SocialOwnProfileFace
        handle={identity.handle}
        displayName={identity.displayName}
        photoUrl={identity.photoUrl}
        bio={identity.bio}
        fallbackBio={SOCIAL.profile.ownFace}
        crafts={identity.crafts}
        topics={identity.topics}
        websiteUrl={identity.websiteUrl}
        imdbUrl={identity.imdbUrl}
        welcomeVideoUrl={identity.welcomeVideoUrl}
        ring={liveStories.length > 0 ? "live" : null}
        profileId={profile.id}
        stats={counts ?? undefined}
        actions={
          <>
            <Link href={SOCIAL_ROUTES.profileEdit} className={`${SOCIAL_ACTION_CLASS} min-w-0 flex-1 text-center md:flex-none`}>
              {SOCIAL.profile.edit}
            </Link>
            <SocialShareButton handle={identity.handle} stretch />
          </>
        }
      />
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
            emptySecondary={{ href: socialCreateHref("media"), label: SOCIAL.profile.sharePost }}
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
    </>
  );
}
