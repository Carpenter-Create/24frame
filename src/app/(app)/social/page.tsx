import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialPostCompose } from "@/components/social/social-forms";
import { SocialNeedProfile, SocialPostCard } from "@/components/social/social-ui";
import { SOCIAL } from "@/lib/social";
import {
  loadGroupsByIds,
  loadLikedPostIds,
  loadOwnProfile,
  loadProfilesByIds,
  loadVisiblePosts,
} from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialHomePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);
  const posts = await loadVisiblePosts(supabase);
  const authors = await loadProfilesByIds(
    supabase,
    [...new Set(posts.map((post) => post.author_id))],
  );
  const groups = await loadGroupsByIds(
    supabase,
    [...new Set(posts.map((post) => post.group_id).filter((id): id is string => !!id))],
  );
  const liked = profile
    ? await loadLikedPostIds(supabase, ctx.user.id, posts.map((post) => post.id))
    : new Set<string>();

  return (
    <div data-social-home="">
      <PageHeader title={SOCIAL.home.title} subtitle={SOCIAL.home.subtitle} />
      {profile ? <SocialPostCompose /> : <SocialNeedProfile />}
      {posts.length === 0 ? (
        <HouseEmpty>{SOCIAL.home.empty}</HouseEmpty>
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
                  groupSlug: group?.slug ?? null,
                  groupName: group?.name ?? null,
                  canLike: !!profile,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
