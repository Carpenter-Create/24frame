import { redirect } from "next/navigation";

import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SocialStoryViewer } from "@/components/social/social-story-viewer";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaItems } from "@/lib/s3-social-media";
import { followingAuthorIds } from "@/lib/social-home";
import { isStoryLive } from "@/lib/social-stories";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadLiveStories,
  loadProfilesByIds,
  loadStoryById,
  loadSuggestedPeople,
  loadViewedStoryIds,
} from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
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
      <div data-social-story-missing="" className={SOCIAL_PAGE_CLASS}>
        <h1 className="sr-only">{SOCIAL.stories.title}</h1>
        <SocialEmpty
          icon="warning-circle"
          title={SOCIAL.stories.missing}
          action={{ href: SOCIAL_ROUTES.stories, label: SOCIAL.member.goHome }}
        />
      </div>
    );
  }
  if (!isStoryLive(story.expires_at)) {
    return (
      <div data-social-story-expired="" className={SOCIAL_PAGE_CLASS}>
        <h1 className="sr-only">{SOCIAL.stories.title}</h1>
        <SocialEmpty
          icon="warning-circle"
          title={SOCIAL.stories.expired}
          action={{ href: SOCIAL_ROUTES.stories, label: SOCIAL.member.goHome }}
        />
      </div>
    );
  }

  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  if (profile) await markSocialStoryViewed(story.id);

  const followees = profile
    ? await loadFolloweeIds(supabase, ctx.user.id)
    : { ids: [] as string[] };
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [authorStoriesPage, railPage, suggested] = await Promise.all([
    loadLiveStories(supabase, [story.author_id]),
    loadLiveStories(supabase, authorIds),
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]),
  ]);
  const sequence = [...authorStoriesPage.stories].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
  );
  const index = Math.max(0, sequence.findIndex((row) => row.id === story.id));
  const prevId = sequence[index - 1]?.id ?? null;
  const nextId = sequence[index + 1]?.id ?? null;
  const viewed = profile
    ? await loadViewedStoryIds(
        supabase,
        ctx.user.id,
        railPage.stories.map((row) => row.id),
      )
    : new Set<string>();
  const rail = groupStoryRail(railPage.stories, viewed);
  const peopleIds = [
    ...new Set([
      story.author_id,
      ctx.user.id,
      ...rail.map((card) => card.authorId),
      ...suggested.map((person) => person.id),
    ]),
  ];
  const [authors, photoUrl, media, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrl(story.author_id),
    signedSocialMediaItems(story.media, story.author_id, "stories"),
    signedAvatarUrls(peopleIds),
  ]);
  const author = authors.get(story.author_id);
  const name = author?.display_name ?? "Member";

  return (
    <div data-social-story={story.id} className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <h1 className="sr-only">{name}</h1>
        <SocialStoriesRail
          cards={rail}
          authors={authors}
          faces={faces}
          canCreate={!!profile}
          surface="stories"
        />
        <SocialStoryViewer
          storyId={story.id}
          authorId={story.author_id}
          authorName={name}
          authorPhotoUrl={photoUrl}
          createdAt={story.created_at}
          body={story.body}
          media={media}
          prevId={prevId}
          nextId={nextId}
          index={index}
          total={Math.max(sequence.length, 1)}
          canReply={!!profile && story.author_id !== ctx.user.id}
        />
      </div>
      <SocialForYouRail people={suggested} faces={faces} />
    </div>
  );
}
