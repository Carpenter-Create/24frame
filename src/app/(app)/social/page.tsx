import { redirect } from "next/navigation";

import { TextAction } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialOnboardingChecklist } from "@/components/social/social-checklist";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialHomeComposer } from "@/components/social/social-home-composer";
import { SocialHomeTabs } from "@/components/social/social-home-tabs";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SocialPostCard } from "@/components/social/social-ui";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS, SOCIAL_PILL_ACTIVE_CLASS, SOCIAL_PILL_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { parseSocialCategoryParam, SOCIAL_CATEGORY_ALL, SOCIAL_CATEGORY_PARAM } from "@/lib/social-categories";
import { followingAuthorIds, socialChecklistItems } from "@/lib/social-home";
import {
  SOCIAL_FOLLOWING_WALL_CURSOR_PARAM,
  parseFollowingWallCursorParam,
  socialFollowingWallHref,
} from "@/lib/social-home-bounds";
import { parseSocialHomeLane, SOCIAL, SOCIAL_HOME_LANE_PARAM, SOCIAL_ROUTES } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadFollowingPosts,
  loadGroupsByIds,
  loadLikedPostIds,
  loadLiveStories,
  loadOwnPostFacts,
  loadProfilesByIds,
  loadSuggestedPeople,
  loadViewedStoryIds,
} from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [ctx, sp] = await Promise.all([getOrgContext(), searchParams]);
  if (!ctx) redirect("/login");
  const topic = parseSocialCategoryParam(sp[SOCIAL_CATEGORY_PARAM]);
  const category = topic === SOCIAL_CATEGORY_ALL ? null : topic;
  const cursor = parseFollowingWallCursorParam(sp[SOCIAL_FOLLOWING_WALL_CURSOR_PARAM]);
  const lane = parseSocialHomeLane(sp[SOCIAL_HOME_LANE_PARAM]);

  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const followees = profile
    ? await loadFolloweeIds(supabase, ctx.user.id)
    : { ids: [] as string[], truncated: false };
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [wall, storiesPage, suggested, facts] = await Promise.all([
    profile
      ? loadFollowingPosts(supabase, authorIds, { category, cursor })
      : Promise.resolve({ posts: [], truncated: false, nextCursor: null }),
    loadLiveStories(supabase, authorIds),
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]),
    profile ? loadOwnPostFacts(supabase, ctx.user.id) : Promise.resolve(null),
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
  const checklist = profile
    ? socialChecklistItems({
        hasPhoto: !!photoUrl,
        hasBio: !!profile.bio?.trim(),
        hasIntro: facts?.hasIntro ?? false,
        hasPost: facts?.hasPost ?? false,
        hasStory: facts?.hasStory ?? false,
      })
    : [];

  return (
    <div data-social-home="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <h1 className="sr-only">{SOCIAL.home.title}</h1>
        <p className="sr-only">{SOCIAL.home.subtitle}</p>
        {profile ? (
          <SocialHomeComposer authorName={profile.display_name} authorPhotoUrl={photoUrl} />
        ) : null}
        <SocialStoriesRail cards={rail} authors={authors} faces={faces} canCreate={!!profile} />
        {storiesPage.truncated ? (
          <InlineNotice tone="info" data-social-stories-truncated="">
            {SOCIAL.home.truncatedStories}
          </InlineNotice>
        ) : null}
        {followees.truncated ? (
          <InlineNotice tone="info" data-social-followees-truncated="">
            {SOCIAL.home.truncatedFollowees}
          </InlineNotice>
        ) : null}
        {lane === "following" && profile ? (
          <div data-social-home-setup="" className="lg:hidden">
            <SocialOnboardingChecklist items={checklist} />
          </div>
        ) : null}
        <SocialHomeTabs active={lane} />
        {lane === "for-you" ? (
          <div data-social-for-you-lane="" className="flex flex-col gap-3">
            {suggested.length === 0 ? (
              <SocialEmpty
                icon="users"
                title={SOCIAL.forYou.people}
                hint={SOCIAL.home.emptyHint}
                action={{ href: SOCIAL_ROUTES.explore, label: SOCIAL.home.goExplore }}
              />
            ) : null}
            <SocialForYouRail people={suggested} faces={faces} layout="lane" />
          </div>
        ) : (
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
            {posts.length === 0 ? (
              <div data-social-following-empty="" className="flex flex-col gap-3">
                <div data-social-empty-lenses="" className="hidden md:block">
                  <span className={`${SOCIAL_PILL_CLASS} ${SOCIAL_PILL_ACTIVE_CLASS}`}>{SOCIAL_CATEGORY_ALL}</span>
                </div>
                <div className="md:hidden">
                  <SocialEmpty
                    icon="users"
                    title={SOCIAL.home.empty}
                    hint={SOCIAL.home.emptyHint}
                    action={{ href: SOCIAL_ROUTES.explore, label: SOCIAL.home.goExplore }}
                  />
                </div>
                <div className="hidden md:block">
                  <SocialEmpty icon="image" title={SOCIAL.home.emptyQuiet} />
                </div>
              </div>
            ) : (
              <div data-social-feed="" className="flex flex-col">
                {posts.map((post) => {
                  const author = authors.get(post.author_id);
                  const group = post.group_id ? groups.get(post.group_id) : null;
                  return (
                    <SocialPostCard
                      key={post.id}
                      post={{
                        id: post.id,
                        body: post.body,
                        likeCount: post.like_count,
                        liked: liked.has(post.id),
                        createdAt: post.created_at,
                        authorId: post.author_id,
                        authorHandle: author?.handle ?? null,
                        authorName: author?.display_name ?? "Member",
                        authorPhotoUrl: faces.get(post.author_id) ?? null,
                        groupSlug: group?.slug ?? null,
                        groupName: group?.name ?? null,
                        canLike: !!profile,
                        media: media.get(post.id) ?? [],
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {lane === "following" ? (
        <SocialForYouRail people={suggested} faces={faces} checklist={profile ? checklist : []} />
      ) : null}
    </div>
  );
}
