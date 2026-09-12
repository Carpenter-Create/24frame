import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialJoinGroupButton, SocialPostCompose } from "@/components/social/social-forms";
import { SocialNeedProfile, SocialPostCard } from "@/components/social/social-ui";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import {
  loadLikedPostIds,
  loadOwnProfile,
  loadProfilesByIds,
  loadVisiblePosts,
} from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { slug } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, slug, name, description, visibility, member_count")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();

  if (!group) {
    return (
      <div data-social-group-missing="">
        <PageHeader title={SOCIAL.group.wall} backLink={{ href: SOCIAL_ROUTES.groups }} />
        <HouseEmpty>{SOCIAL.group.notFound}</HouseEmpty>
      </div>
    );
  }

  const profile = await loadOwnProfile(supabase, ctx.user.id);
  const { data: membership } = profile
    ? await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", group.id)
        .eq("user_id", ctx.user.id)
        .maybeSingle()
    : { data: null };

  const { data: canJoin } = profile
    ? await supabase.rpc("can_self_join_group", { p_group: group.id, p_user: ctx.user.id })
    : { data: false };

  const posts = await loadVisiblePosts(supabase, group.id);
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const [authors, faces] = await Promise.all([
    loadProfilesByIds(supabase, authorIds),
    signedAvatarUrls(authorIds),
  ]);
  const liked = profile
    ? await loadLikedPostIds(supabase, ctx.user.id, posts.map((post) => post.id))
    : new Set<string>();

  return (
    <div data-social-group="">
      <PageHeader
        title={group.name}
        subtitle={group.description ?? `${group.member_count} ${SOCIAL.groups.members}`}
        backLink={{ href: SOCIAL_ROUTES.groups, label: SOCIAL.groups.title }}
      />
      {!profile ? <SocialNeedProfile /> : null}
      {profile && !membership && canJoin === true ? (
        <SocialJoinGroupButton groupId={group.id} groupSlug={group.slug} />
      ) : null}
      {membership ? (
        <SocialPostCompose groupId={group.id} groupSlug={group.slug} />
      ) : profile ? (
        <HouseEmpty>{SOCIAL.group.membersOnly}</HouseEmpty>
      ) : null}
      {posts.length === 0 ? (
        <HouseEmpty>{SOCIAL.group.empty}</HouseEmpty>
      ) : (
        posts.map((post) => {
          const author = authors.get(post.author_id);
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
                groupSlug: group.slug,
                groupName: group.name,
                canLike: !!profile,
              }}
            />
          );
        })
      )}
    </div>
  );
}
