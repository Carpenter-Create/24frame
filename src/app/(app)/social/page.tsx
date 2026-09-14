import { redirect } from "next/navigation";

import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialOnboardingChecklist } from "@/components/social/social-checklist";
import { SocialLensRow } from "@/components/social/social-lenses";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SocialPostCard } from "@/components/social/social-ui";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { parseSocialCategoryParam, SOCIAL_CATEGORY_ALL, SOCIAL_CATEGORY_PARAM } from "@/lib/social-categories";
import { followingAuthorIds, socialChecklistItems } from "@/lib/social-home";
import {
  SOCIAL_FOLLOWING_WALL_CURSOR_PARAM,
  parseFollowingWallCursorParam,
  socialFollowingWallHref,
} from "@/lib/social-home-bounds";
import { SOCIAL } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadFollowingPosts,
  loadGroupsByIds,
  loadLikedPostIds,
  loadLiveStories,
  loadOwnPostFacts,
  loadProfilesByIds,
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
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const topic = parseSocialCategoryParam(sp[SOCIAL_CATEGORY_PARAM]);
  const category = topic === SOCIAL_CATEGORY_ALL ? null : topic;
  const cursor = parseFollowingWallCursorParam(sp[SOCIAL_FOLLOWING_WALL_CURSOR_PARAM]);

  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const followees = profile
    ? await loadFolloweeIds(supabase, ctx.user.id)
    : { ids: [] as string[], truncated: false };
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [wall, storiesPage] = await Promise.all([
    profile
      ? loadFollowingPosts(supabase, authorIds, { category, cursor })
      : Promise.resolve({ posts: [], truncated: false, nextCursor: null }),
    loadLiveStories(supabase, authorIds),
  ]);
  const posts = wall.posts;
  const stories = storiesPage.stories;
  const storyIds = stories.map((story) => story.id);
  const viewed = profile ? await loadViewedStoryIds(supabase, ctx.user.id, storyIds) : new Set<string>();
  const rail = groupStoryRail(stories, viewed);
  const peopleIds = [
    ...new Set([ctx.user.id, ...posts.map((post) => post.author_id), ...rail.map((card) => card.authorId)]),
  ];
  const [authors, faces, media] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
    signedSocialMediaByPostId(posts),
  ]);
  const groups = await loadGroupsByIds(
    supabase,
    [...new Set(posts.map((post) => post.group_id).filter((id): id is string => !!id))],
  );
  const liked = profile
    ? await loadLikedPostIds(supabase, ctx.user.id, posts.map((post) => post.id))
    : new Set<string>();
  const facts = profile ? await loadOwnPostFacts(supabase, ctx.user.id) : null;
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
    <div data-social-home="">
      <PageHeader title={SOCIAL.home.title} subtitle={SOCIAL.home.subtitle} />
      <SocialStoriesRail cards={rail} authors={authors} faces={faces} canCreate={!!profile} />
      {storiesPage.truncated ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-stories-truncated="">
          {SOCIAL.home.truncatedStories}
        </InlineNotice>
      ) : null}
      {followees.truncated ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-followees-truncated="">
          {SOCIAL.home.truncatedFollowees}
        </InlineNotice>
      ) : null}
      {profile ? <SocialOnboardingChecklist items={checklist} /> : null}
      <SocialLensRow active={topic} />
      {wall.truncated ? (
        <div data-social-wall-truncated="" className="mb-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
          <InlineNotice tone="info">{SOCIAL.home.truncatedWall}</InlineNotice>
          {wall.nextCursor ? (
            <TextAction href={socialFollowingWallHref({ topic, after: wall.nextCursor })} data-social-wall-older="">
              {SOCIAL.home.olderPosts}
            </TextAction>
          ) : null}
        </div>
      ) : null}
      {posts.length === 0 ? (
        <div data-social-following-empty="">
          <HouseEmpty>{SOCIAL.home.empty}</HouseEmpty>
        </div>
      ) : (
        <div data-social-feed="">
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
    </div>
  );
}
