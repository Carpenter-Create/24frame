import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import { SocialStoryViewer, type SocialStoryNeighbor } from "@/components/social/social-story-viewer";
import { SOCIAL_STORY_STAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrl, signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaItems } from "@/lib/s3-social-media";
import { socialStoryRailCover } from "@/lib/social-edge";
import { followingAuthorIds } from "@/lib/social-home";
import { isStoryLive } from "@/lib/social-stories";
import { SOCIAL, SOCIAL_ROUTES, socialPersonLabel } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadLiveStories,
  loadProfilesByIds,
  loadStoryById,
  loadViewedStoryIds,
  type SocialStoryRailCard,
} from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { sortStoryTrayOldestFirst, type SocialStoryTrayAuthor } from "@/lib/social-story-tray";
import { markSocialStoryViewed } from "@/app/(app)/social/actions";
import { requireSocialSession } from "@/lib/social-session";

function StoryUnavailable({
  marker,
  title,
}: {
  marker: "missing" | "expired";
  title: string;
}) {
  return (
    <div
      data-social-story-unavailable=""
      data-social-story-missing={marker === "missing" ? "" : undefined}
      data-social-story-expired={marker === "expired" ? "" : undefined}
      className={SOCIAL_STORY_STAGE_CLASS}
    >
      <h1 className="sr-only">{SOCIAL.stories.title}</h1>
      <Link
        href={SOCIAL_ROUTES.home}
        aria-label={SOCIAL.stories.close}
        className="absolute right-4 top-4 flex size-12 items-center justify-center text-band-ink"
      >
        <SocialIcon name="x" size={22} />
      </Link>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="t-body text-band-ink">{title}</p>
        <Link href={SOCIAL_ROUTES.home} className="t-body-sm text-band-ink">
          {SOCIAL.member.goHome}
        </Link>
      </div>
    </div>
  );
}

export default async function SocialStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([requireSocialSession(), params]);
  const { ctx, supabase } = session;
  const story = await loadStoryById(supabase, id);
  if (!story) {
    return <StoryUnavailable marker="missing" title={SOCIAL.stories.missing} />;
  }
  if (!isStoryLive(story.expires_at)) {
    return <StoryUnavailable marker="expired" title={SOCIAL.stories.expired} />;
  }

  const [profile, followees] = await Promise.all([
    ensureOwnSocialProfile(supabase, ctx.user),
    loadFolloweeIds(supabase, ctx.user.id),
  ]);
  if (profile) await markSocialStoryViewed(story.id);
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [authorStoriesPage, railPage] = await Promise.all([
    loadLiveStories(supabase, [story.author_id]),
    loadLiveStories(supabase, authorIds),
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
  const storyRows = new Map(railPage.stories.map((row) => [row.id, row]));
  for (const row of authorStoriesPage.stories) storyRows.set(row.id, row);
  storyRows.set(story.id, story);
  const signedEntries = await Promise.all(
    [...storyRows.values()].map(async (row) => ({
      id: row.id,
      media: await signedSocialMediaItems(row.media, row.author_id, "stories"),
    })),
  );
  const mediaById = new Map(signedEntries.map((entry) => [entry.id, entry.media]));
  const railIds = rail.map((card) => card.authorId);
  const authorOrder = railIds.includes(story.author_id) ? railIds : [story.author_id, ...railIds];
  const tray: SocialStoryTrayAuthor[] = authorOrder.flatMap((id) => {
    const rows = [...storyRows.values()].filter((row) => row.author_id === id);
    if (rows.length === 0) return [];
    const card = rail.find((entry) => entry.authorId === id);
    const person = authors.get(id);
    const coverSource = card?.latest ?? rows[0];
    const cover = coverSource ? socialStoryRailCover(coverSource.media, id) : null;
    return [
      {
        authorId: id,
        authorName: socialPersonLabel({
          handle: person?.handle ?? "",
          displayName: person?.display_name,
        }),
        authorPhotoUrl: faces.get(id) ?? null,
        unseen: card?.unseen ?? false,
        coverUrl: cover?.url ?? null,
        coverKind: cover?.kind ?? null,
        items: sortStoryTrayOldestFirst(
          rows.map((row) => ({
            id: row.id,
            createdAt: row.created_at,
            body: row.body,
            media: mediaById.get(row.id) ?? [],
          })),
        ),
      },
    ];
  });
  const author = authors.get(story.author_id);
  const name = socialPersonLabel({
    handle: author?.handle ?? "",
    displayName: author?.display_name,
  });
  const authorAt = rail.findIndex((card) => card.authorId === story.author_id);
  const neighbor = (card: SocialStoryRailCard | undefined): SocialStoryNeighbor | null => {
    if (!card) return null;
    const person = authors.get(card.authorId);
    const cover = socialStoryRailCover(card.latest.media, card.authorId);
    return {
      storyId: card.latest.id,
      authorName: socialPersonLabel({
        handle: person?.handle ?? "",
        displayName: person?.display_name,
      }),
      authorPhotoUrl: faces.get(card.authorId) ?? null,
      createdAt: card.latest.created_at,
      unseen: card.unseen,
      coverUrl: cover?.url ?? null,
      coverKind: cover?.kind ?? null,
    };
  };

  return (
    <div data-social-story={story.id}>
      <h1 className="sr-only">{name}</h1>
      <SocialStoryViewer
        key={story.id}
        storyId={story.id}
        authorId={story.author_id}
        authorName={name}
        authorPhotoUrl={photoUrl}
        createdAt={story.created_at}
        body={story.body}
        media={media}
        prevId={prevId}
        nextId={nextId}
        prevAuthor={neighbor(authorAt > 0 ? rail[authorAt - 1] : undefined)}
        nextAuthor={neighbor(authorAt >= 0 ? rail[authorAt + 1] : undefined)}
        index={index}
        total={Math.max(sequence.length, 1)}
        canReply={!!profile}
        tray={tray}
        selfId={ctx.user.id}
      />
    </div>
  );
}
