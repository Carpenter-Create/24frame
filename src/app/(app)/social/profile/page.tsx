import { redirect } from "next/navigation";
import Link from "next/link";

import { InlineNotice } from "@/components/ui/inline-notice";
import {
  SocialBioForm,
  SocialProfileCreateForm,
  SocialProfilePhotoForm,
} from "@/components/social/social-forms";
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
import { SOCIAL_ACTION_CLASS, SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import {
  parseSocialProfileTab,
  SOCIAL,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
  socialRelativeTime,
  socialStoryHref,
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
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const [ctx, sp] = await Promise.all([
    getOrgContext(),
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  if (!ctx) redirect("/login");
  const tab = parseSocialProfileTab(sp[SOCIAL_PROFILE_TAB_PARAM]);
  const supabase = await createClient();
  const { profile, error: ensureError } = await ensureOwnSocialProfileResult(supabase, ctx.user);

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

  const [photoUrl, liveStoriesPage, history, counts, followees] = await Promise.all([
    signedAvatarUrl(profile.id),
    loadLiveStories(supabase, [profile.id]),
    loadAuthorPosts(supabase, profile.id),
    loadProfileSocialCounts(supabase, profile.id),
    loadFolloweeIds(supabase, ctx.user.id),
  ]);
  const liveStories = liveStoriesPage.stories;
  const [media, liked, suggested] = await Promise.all([
    signedSocialMediaByPostId(history.posts),
    loadLikedPostIds(
      supabase,
      ctx.user.id,
      history.posts.map((post) => post.id),
    ),
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]),
  ]);
  const faces =
    suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();

  const highlightCards = liveStories.map((story) => ({
    id: story.id,
    href: socialStoryHref(story.id),
    label: socialRelativeTime(story.created_at),
    photoUrl,
  }));

  return (
    <div data-social-profile="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <h1 className="sr-only">{SOCIAL.profile.title}</h1>
        <SocialProfileIdentity
          name={profile.display_name}
          handle={profile.handle}
          photoUrl={photoUrl}
          bio={profile.bio?.trim() ? profile.bio : SOCIAL.profile.ownFace}
          ring={liveStories.length > 0 ? "live" : null}
          stats={counts ?? undefined}
          actions={() => (
            <>
              <Link href="#social-profile-edit" className={`${SOCIAL_ACTION_CLASS} min-w-0 flex-1 text-center md:flex-none`}>
                {SOCIAL.profile.edit}
              </Link>
              <SocialShareButton handle={profile.handle} stretch />
            </>
          )}
        />
        <SocialProfileTabs baseHref={SOCIAL_ROUTES.profile} active={tab} />
        {tab === "highlights" ? (
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
              emptyAction={{ href: SOCIAL_ROUTES.create, label: SOCIAL.profile.sharePost }}
              posts={history.posts.map((post) =>
                socialAuthorPostCard({
                  post,
                  authorHandle: profile.handle,
                  authorName: profile.display_name,
                  authorPhotoUrl: photoUrl,
                  liked: liked.has(post.id),
                  canLike: true,
                  media: media.get(post.id) ?? [],
                }),
              )}
            />
          </>
        )}
        <details id="social-profile-edit" className="flex flex-col gap-[var(--space-4)]">
          <summary className="t-body-sm text-ink-2">{SOCIAL.profile.edit}</summary>
          <SocialProfilePhotoForm />
          <SocialProfileCreateForm handle={profile.handle} displayName={profile.display_name} />
          <SocialBioForm bio={profile.bio ?? ""} />
        </details>
      </div>
      <SocialForYouRail people={suggested} faces={faces} />
    </div>
  );
}
