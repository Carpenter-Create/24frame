import { redirect } from "next/navigation";
import Link from "next/link";

import { InlineNotice } from "@/components/ui/inline-notice";
import {
  SocialBioForm,
  SocialProfileCreateForm,
  SocialProfilePhotoForm,
} from "@/components/social/social-forms";
import { SocialShareButton } from "@/components/social/social-share-button";
import {
  SocialAuthorHistory,
  SocialHighlights,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { SOCIAL_ACTION_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { SOCIAL, SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";
import { loadAuthorPosts, loadLikedPostIds, loadLiveStories, loadProfileSocialCounts } from "@/lib/social-feed";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialProfilePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const { profile, error: ensureError } = await ensureOwnSocialProfileResult(supabase, ctx.user);
  const photoUrl = profile ? await signedAvatarUrl(profile.id) : null;
  const liveStories = profile ? (await loadLiveStories(supabase, [profile.id])).stories : [];
  const history = profile ? await loadAuthorPosts(supabase, profile.id) : { posts: [], truncated: false };
  const media = profile ? await signedSocialMediaByPostId(history.posts) : new Map();
  const liked = profile
    ? await loadLikedPostIds(
        supabase,
        ctx.user.id,
        history.posts.map((post) => post.id),
      )
    : new Set<string>();
  const counts = profile ? await loadProfileSocialCounts(supabase, profile.id) : null;

  return (
    <div data-social-profile="" className={SOCIAL_PAGE_CLASS}>
      <h1 className="sr-only">{SOCIAL.profile.title}</h1>
      {profile ? (
        <div className="flex flex-col gap-[var(--space-6)]">
          <SocialProfileIdentity
            name={profile.display_name}
            handle={profile.handle}
            photoUrl={photoUrl}
            bio={profile.bio?.trim() ? profile.bio : SOCIAL.profile.ownFace}
            ring={liveStories.length > 0 ? "live" : null}
            stats={counts ?? undefined}
            actions={
              <>
                <Link href="#social-profile-edit" className={SOCIAL_ACTION_CLASS}>
                  {SOCIAL.profile.edit}
                </Link>
                <SocialShareButton handle={profile.handle} />
              </>
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
          <details id="social-profile-edit" className="flex flex-col gap-[var(--space-4)]">
            <summary className="t-body-sm text-ink-2">{SOCIAL.profile.edit}</summary>
            <SocialProfilePhotoForm />
            <SocialProfileCreateForm handle={profile.handle} displayName={profile.display_name} />
            <SocialBioForm bio={profile.bio ?? ""} />
          </details>
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
