import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SocialStoryViewer } from "@/components/social/social-story-viewer";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaItems } from "@/lib/s3-social-media";
import { followingAuthorIds } from "@/lib/social-home";
import { isStoryLive } from "@/lib/social-stories";
import { SOCIAL, SOCIAL_ROUTES, socialPersonLabel } from "@/lib/social";
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
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireSocialSession(), params]);
  const { ctx, supabase } = session;
  const story = await loadStoryById(supabase, id);
  if (!story) {
    return (
      <div data-social-story-missing="" className={SOCIAL_PAGE_CLASS}>
        <h1 className="sr-only">{SOCIAL.stories.title}</h1>
        <SocialEmpty
          icon="warning-circle"
          title={SOCIAL.stories.missing}
          action={{ href: SOCIAL_ROUTES.home, label: SOCIAL.member.goHome }}
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
          action={{ href: SOCIAL_ROUTES.home, label: SOCIAL.member.goHome }}
        />
      </div>
    );
  }

  const [profile, followees] = await Promise.all([
    ensureOwnSocialProfile(supabase, ctx.user),
    loadFolloweeIds(supabase, ctx.user.id),
  ]);
  if (profile) await markSocialStoryViewed(story.id);
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [authorStoriesPage, railPage, suggested] = await Promise.all([
    loadLiveStories(supabase, [story.author_id]),
    loadLiveStories(supabase, authorIds),
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids], {
      topics: profile?.topics ?? [],
      crafts: profile?.crafts ?? [],
    }),
  ]);
  const sequence = [...authorStoriesPage.stories].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
  );
  const index = Math.max(0, sequence.findIndex((row) => row.id === story.id));
  const prevId = sequence[index - 1]?.id ?? null;
  const nextId = sequence[index + 1]?.id ?? null;
  const peopleIds = [
    ...new Set([
      story.author_id,
      ctx.user.id,
      ...railPage.stories.map((row) => row.author_id),
      ...suggested.map((person) => person.id),
    ]),
  ];
  const [viewed, authors, photoUrl, media, faces] = await Promise.all([
    profile
      ? loadViewedStoryIds(
          supabase,
          ctx.user.id,
          railPage.stories.map((row) => row.id),
        )
      : Promise.resolve(new Set<string>()),
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrl(story.author_id),
    signedSocialMediaItems(story.media, story.author_id, "stories"),
    signedAvatarUrls(peopleIds),
  ]);
  const rail = groupStoryRail(railPage.stories, viewed);
  const author = authors.get(story.author_id);
  const name = socialPersonLabel({
    handle: author?.handle ?? "",
    displayName: author?.display_name,
  });

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
