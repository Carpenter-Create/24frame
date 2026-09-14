import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialAvatar, SocialPostMedia } from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaItems } from "@/lib/s3-social-media";
import { isStoryLive } from "@/lib/social-stories";
import { SOCIAL } from "@/lib/social";
import { loadOwnProfile, loadProfilesByIds, loadStoryById } from "@/lib/social-feed";
import { markSocialStoryViewed } from "@/app/(app)/social/actions";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const story = await loadStoryById(supabase, id);
  if (!story) {
    return (
      <div data-social-story-missing="">
        <PageHeader title={SOCIAL.stories.title} />
        <HouseEmpty>{SOCIAL.stories.missing}</HouseEmpty>
      </div>
    );
  }
  if (!isStoryLive(story.expires_at)) {
    return (
      <div data-social-story-expired="">
        <PageHeader title={SOCIAL.stories.title} />
        <HouseEmpty>{SOCIAL.stories.expired}</HouseEmpty>
      </div>
    );
  }

  const profile = await loadOwnProfile(supabase, ctx.user.id);
  if (profile) await markSocialStoryViewed(story.id);

  const authors = await loadProfilesByIds(supabase, [story.author_id]);
  const author = authors.get(story.author_id);
  const name = author?.display_name ?? "Member";
  const [photoUrl, media] = await Promise.all([
    signedAvatarUrl(story.author_id),
    signedSocialMediaItems(story.media),
  ]);

  return (
    <div data-social-story={story.id}>
      <PageHeader title={name} subtitle={SOCIAL.stories.title} />
      <div className="flex flex-col gap-[var(--space-4)]">
        <SocialAvatar name={name} photoUrl={photoUrl} ring="live" />
        {story.body ? <p className="t-body text-ink whitespace-pre-wrap">{story.body}</p> : null}
        <SocialPostMedia items={media} />
      </div>
    </div>
  );
}
