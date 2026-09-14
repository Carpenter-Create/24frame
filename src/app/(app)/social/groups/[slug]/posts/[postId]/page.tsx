import Link from "next/link";
import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialLikeButton } from "@/components/social/social-forms";
import { SocialAvatar, SocialPostMedia } from "@/components/social/social-ui";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaItems } from "@/lib/s3-social-media";
import { SOCIAL, socialGroupHref, socialMemberHref } from "@/lib/social";
import { loadLikedPostIds } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { slug, postId } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, slug, name")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();
  const { data: post } = await supabase
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at, status, media")
    .eq("id", postId)
    .maybeSingle();

  if (!group || !post || post.group_id !== group.id) {
    return (
      <div data-social-post-missing="">
        <PageHeader title={SOCIAL.post.title} />
        <HouseEmpty>{SOCIAL.post.missing}</HouseEmpty>
      </div>
    );
  }

  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const { data: author } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("id", post.author_id)
    .maybeSingle();
  const [liked, photoUrl, media] = await Promise.all([
    profile ? loadLikedPostIds(supabase, ctx.user.id, [post.id]) : Promise.resolve(new Set<string>()),
    signedAvatarUrl(post.author_id),
    signedSocialMediaItems(post.media),
  ]);

  return (
    <div data-social-post-detail="">
      <PageHeader
        title={SOCIAL.post.title}
        backLink={{ href: socialGroupHref(group.slug), label: group.name }}
      />
      <article className="flex flex-col gap-[var(--space-4)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <SocialAvatar name={author?.display_name ?? "Member"} photoUrl={photoUrl} />
          {author ? (
            <Link href={socialMemberHref(author.handle)} className="t-body font-medium text-ink">
              {author.display_name}
            </Link>
          ) : (
            <p className="t-body font-medium text-ink">Member</p>
          )}
        </div>
        {post.body ? <p className="t-body text-ink whitespace-pre-wrap">{post.body}</p> : null}
        <SocialPostMedia items={media} />
        <SocialLikeButton
          postId={post.id}
          liked={liked.has(post.id)}
          likeCount={post.like_count}
          groupSlug={group.slug}
        />
      </article>
    </div>
  );
}
