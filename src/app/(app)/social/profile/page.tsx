import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  SocialBioForm,
  SocialProfileCreateForm,
  SocialProfilePhotoForm,
} from "@/components/social/social-forms";
import {
  SocialAuthorHistory,
  SocialProfileIdentity,
  socialAuthorPostCard,
} from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { SOCIAL } from "@/lib/social";
import { loadAuthorPosts, loadLikedPostIds, loadLiveStories } from "@/lib/social-feed";
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

  return (
    <div data-social-profile="">
      <PageHeader title={SOCIAL.profile.title} subtitle={SOCIAL.profile.subtitle} />
      {profile ? (
        <div className="flex flex-col gap-[var(--space-4)]">
          <SocialProfileIdentity
            name={profile.display_name}
            handle={profile.handle}
            photoUrl={photoUrl}
            bio={profile.bio}
            ring={liveStories.length > 0 ? "live" : null}
            photoAction={<SocialProfilePhotoForm />}
          />
          <SocialProfileCreateForm handle={profile.handle} displayName={profile.display_name} />
          <SocialBioForm bio={profile.bio ?? ""} />
          <SocialAuthorHistory
            truncated={history.truncated}
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
