import { Suspense } from "react";

import { TextAction } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialHomeComposer } from "@/components/social/social-home-composer";
import { SocialHomeTabs } from "@/components/social/social-home-tabs";
import { SocialHomeTopics } from "@/components/social/social-home-topics";
import {
  SocialForYouSkeleton,
  SocialHomeCenterSkeleton,
} from "@/components/social/social-skeletons";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SocialOptimisticFeed } from "@/components/social/social-optimistic-feed";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PILL_ACTIVE_CLASS, SOCIAL_PILL_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrls, signedSocialMediaByPostId } from "@/lib/social-edge";
import { SocialFollowingWallBound } from "@/components/social/social-following-wall-bound";
import {
  parseSocialCategoryParam,
  SOCIAL_CATEGORY_ALL,
  SOCIAL_CATEGORY_PARAM,
  type SocialCategoryLabel,
  type SocialCategoryTopic,
} from "@/lib/social-categories";
import { latestDiscoverableCourse, loadDiscoverableCourses } from "@/lib/courses";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { followingAuthorIds, SOCIAL_HOME_STACK_LOCK } from "@/lib/social-home";
import {
  SOCIAL_FOLLOWING_WALL_CURSOR_PARAM,
  encodeFollowingWallCursor,
  parseFollowingWallCursorParam,
  socialFollowingWallHref,
  type FollowingWallCursor,
} from "@/lib/social-home-bounds";
import {
  groupStoryRail,
  loadGroupsByIds,
  loadLikedPostIds,
  loadLiveStories,
  loadProfilesByIds,
  loadSuggestedPeople,
  loadViewedStoryIds,
  type SocialFollowingWallPage,
  type SocialPostRow,
  type SocialProfileRow,
  type SocialSuggestedPerson,
} from "@/lib/social-feed";
import { parseSocialHomeLane, SOCIAL, SOCIAL_HOME_LANE_PARAM, socialPersonLabel, socialSearchHref, type SocialHomeLane } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { loadCachedFolloweeIds, loadCachedFollowingPosts } from "@/lib/social-hot-reads";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

export default async function SocialHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, sp] = await Promise.all([requireSocialSession(), searchParams]);
  const topic = parseSocialCategoryParam(sp[SOCIAL_CATEGORY_PARAM]);
  const category = topic === SOCIAL_CATEGORY_ALL ? null : topic;
  const cursor = parseFollowingWallCursorParam(sp[SOCIAL_FOLLOWING_WALL_CURSOR_PARAM]);
  const lane = parseSocialHomeLane(sp[SOCIAL_HOME_LANE_PARAM]);

  return (
    <div data-social-home="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <Suspense fallback={<SocialHomeCenterSkeleton />}>
        <SocialHomeCenter session={session} category={category} cursor={cursor} lane={lane} topic={topic} />
      </Suspense>
      {lane === "following" ? (
        <Suspense fallback={<SocialForYouSkeleton />}>
          <SocialHomeForYouSlot session={session} />
        </Suspense>
      ) : null}
    </div>
  );
}

async function loadHomeProfile(session: SocialSession) {
  const [profile, followees] = await Promise.all([
    ensureOwnSocialProfile(session.supabase, session.ctx.user),
    loadCachedFolloweeIds(session.supabase, session.ctx.user.id),
  ]);
  return { profile, followees };
}

async function SocialHomeForYouSlot({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const { profile, followees } = await loadHomeProfile(session);
  const interest = { topics: profile?.topics ?? [], crafts: profile?.crafts ?? [] };
  const [suggested, catalog] = await Promise.all([
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids], interest),
    loadDiscoverableCourses(supabase),
  ]);
  const latestCourse = catalog.failed ? null : latestDiscoverableCourse(catalog.courses, interest);
  const [faces, courseCovers] = await Promise.all([
    suggested.length > 0 ? signedAvatarUrls(suggested.map((person) => person.id)) : Promise.resolve(new Map()),
    latestCourse ? signedEducationCoverUrls([latestCourse]) : Promise.resolve(new Map<string, string>()),
  ]);
  return (
    <SocialForYouRail
      people={suggested}
      faces={faces}
      latestCourse={latestCourse}
      latestCourseCoverUrl={latestCourse ? courseCovers.get(latestCourse.id) ?? null : null}
    />
  );
}

async function SocialHomeCenter({
  session,
  category,
  cursor,
  lane,
  topic,
}: {
  session: SocialSession;
  category: SocialCategoryTopic | null;
  cursor: FollowingWallCursor | null;
  lane: SocialHomeLane;
  topic: SocialCategoryLabel;
}) {
  const { ctx, supabase } = session;
  const { profile, followees } = await loadHomeProfile(session);
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [wall, storiesPage, suggested] = await Promise.all([
    profile
      ? loadCachedFollowingPosts(supabase, ctx.user.id, authorIds, { category, cursor })
      : Promise.resolve({ posts: [], truncated: false, nextCursor: null }),
    loadLiveStories(supabase, authorIds),
    lane === "for-you"
      ? loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids], {
          topics: profile?.topics ?? [],
          crafts: profile?.crafts ?? [],
        })
      : Promise.resolve([]),
  ]);
  const posts = wall.posts;
  const stories = storiesPage.stories;
  const storyIds = stories.map((story) => story.id);
  const peopleIds = [
    ...new Set([
      ctx.user.id,
      ...posts.map((post) => post.author_id),
      ...stories.map((story) => story.author_id),
      ...suggested.map((person) => person.id),
    ]),
  ];
  const [viewed, authors, faces, media, groups, liked] = await Promise.all([
    profile ? loadViewedStoryIds(supabase, ctx.user.id, storyIds) : Promise.resolve(new Set<string>()),
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
    signedSocialMediaByPostId(posts),
    loadGroupsByIds(
      supabase,
      [...new Set(posts.map((post) => post.group_id).filter((id): id is string => !!id))],
    ),
    profile
      ? loadLikedPostIds(supabase, ctx.user.id, posts.map((post) => post.id))
      : Promise.resolve(new Set<string>()),
  ]);
  const rail = groupStoryRail(stories, viewed);
  const photoUrl = faces.get(ctx.user.id) ?? null;

  return (
    <div data-social-home-stack={SOCIAL_HOME_STACK_LOCK} className={SOCIAL_HOME_CENTER_CLASS}>
      <div className="sr-only">
        <h1>{SOCIAL.home.title}</h1>
        <p>{SOCIAL.home.subtitle}</p>
      </div>
      {profile ? (
        <SocialHomeComposer authorName={profile.display_name} authorPhotoUrl={photoUrl} />
      ) : null}
      <SocialStoriesRail
        cards={rail}
        authors={authors}
        faces={faces}
        canCreate={!!profile}
        createName={profile?.display_name}
        createPhotoUrl={photoUrl}
      />
      {storiesPage.truncated ? (
        <InlineNotice tone="info" data-social-stories-truncated="">
          {SOCIAL.home.truncatedStories}
        </InlineNotice>
      ) : null}
      <SocialHomeTopics active={topic} />
      {followees.truncated ? (
        <InlineNotice tone="info" data-social-followees-truncated="">
          {SOCIAL.home.truncatedFollowees}
        </InlineNotice>
      ) : null}
      <SocialHomeTabs active={lane} />
      {lane === "for-you" ? (
        <SocialHomeForYouLane suggested={suggested} faces={faces} />
      ) : (
        <SocialFollowingWallBound
          viewerId={ctx.user.id}
          topic={topic}
          cursor={
            cursor
              ? encodeFollowingWallCursor({ created_at: cursor.createdAt, id: cursor.id })
              : null
          }
          wall={wall}
        >
          <SocialHomeFollowingWall
            wall={wall}
            posts={posts}
            authors={authors}
            faces={faces}
            groups={groups}
            liked={liked}
            media={media}
            profile={profile}
            topic={topic}
          />
        </SocialFollowingWallBound>
      )}
    </div>
  );
}

function SocialHomeForYouLane({
  suggested,
  faces,
}: {
  suggested: SocialSuggestedPerson[];
  faces: ReadonlyMap<string, string | null>;
}) {
  return (
    <div data-social-for-you-lane="" className="flex flex-col gap-3">
      {suggested.length === 0 ? (
        <SocialEmpty
          icon="users"
          title={SOCIAL.forYou.people}
          hint={SOCIAL.home.emptyHint}
          action={{ href: socialSearchHref({ intent: "people" }), label: SOCIAL.home.findPeople }}
        />
      ) : null}
      <SocialForYouRail people={suggested} faces={faces} layout="lane" />
    </div>
  );
}

function SocialHomeFollowingWall({
  wall,
  posts,
  authors,
  faces,
  groups,
  liked,
  media,
  profile,
  topic,
}: {
  wall: SocialFollowingWallPage;
  posts: SocialPostRow[];
  authors: Map<string, SocialProfileRow>;
  faces: ReadonlyMap<string, string | null>;
  groups: Map<string, { slug: string; name: string }>;
  liked: Set<string>;
  media: Awaited<ReturnType<typeof signedSocialMediaByPostId>>;
  profile: SocialProfileRow | null;
  topic: SocialCategoryLabel;
}) {
  return (
    <>
      {wall.truncated ? (
        <div data-social-wall-truncated="" className="flex flex-col gap-[var(--space-3)]">
          <InlineNotice tone="info">{SOCIAL.home.truncatedWall}</InlineNotice>
          {wall.nextCursor ? (
            <TextAction href={socialFollowingWallHref({ topic, after: wall.nextCursor })} data-social-wall-older="">
              {SOCIAL.home.olderPosts}
            </TextAction>
          ) : null}
        </div>
      ) : null}
      <SocialOptimisticFeed
        topic={topic}
        posts={posts.map((post) => {
          const author = authors.get(post.author_id);
          const group = post.group_id ? groups.get(post.group_id) : null;
          return {
            id: post.id,
            body: post.body,
            likeCount: post.like_count,
            commentCount: post.comment_count,
            liked: liked.has(post.id),
            createdAt: post.created_at,
            authorId: post.author_id,
            authorHandle: author?.handle ?? null,
            authorName: socialPersonLabel({
              handle: author?.handle ?? "",
              displayName: author?.display_name,
            }),
            authorPhotoUrl: faces.get(post.author_id) ?? null,
            groupSlug: group?.slug ?? null,
            groupName: group?.name ?? null,
            canLike: !!profile,
            media: media.get(post.id) ?? [],
          };
        })}
        empty={
          <div data-social-following-empty="" className="flex flex-col gap-3">
            <div data-social-empty-lenses="" className="hidden md:block">
              <span className={`${SOCIAL_PILL_CLASS} ${SOCIAL_PILL_ACTIVE_CLASS}`}>{SOCIAL_CATEGORY_ALL}</span>
            </div>
            <div className="md:hidden">
              <SocialEmpty
                icon="users"
                title={SOCIAL.home.empty}
                hint={SOCIAL.home.emptyHint}
                action={{ href: socialSearchHref({ intent: "people" }), label: SOCIAL.home.findPeople }}
              />
            </div>
            <div className="hidden md:block">
              <SocialEmpty icon="image" title={SOCIAL.home.emptyQuiet} />
            </div>
          </div>
        }
      />
    </>
  );
}
