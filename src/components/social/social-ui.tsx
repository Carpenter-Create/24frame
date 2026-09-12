import Link from "next/link";

import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import { SOCIAL, SOCIAL_ROUTES, socialGroupHref, socialMemberHref, socialInitials } from "@/lib/social";
import { SocialLikeButton } from "./social-forms";

export function SocialNeedProfile() {
  return (
    <div data-social-need-profile="" className="flex flex-col gap-[var(--space-2)]">
      <HouseEmpty>{SOCIAL.cta.needProfile}</HouseEmpty>
      <TextAction href={SOCIAL_ROUTES.profile}>{SOCIAL.cta.profileHrefLabel}</TextAction>
    </div>
  );
}

export function SocialAvatar({ name }: { name: string }) {
  return (
    <div data-social-avatar="" className={IDENTITY_AVATAR_CLASS}>
      {socialInitials(name)}
    </div>
  );
}

export type SocialPostCardModel = {
  id: string;
  body: string | null;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  authorId: string;
  authorHandle: string | null;
  authorName: string;
  groupSlug: string | null;
  groupName: string | null;
  canLike: boolean;
};

export function SocialPostCard({ post }: { post: SocialPostCardModel }) {
  return (
    <article
      data-social-post={post.id}
      className="flex flex-col gap-[var(--space-3)] border-b border-hairline py-[var(--space-4)]"
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <SocialAvatar name={post.authorName} />
        <div className="min-w-0">
          {post.authorHandle ? (
            <Link href={socialMemberHref(post.authorHandle)} className="t-body font-medium text-ink">
              {post.authorName}
            </Link>
          ) : (
            <p className="t-body font-medium text-ink">{post.authorName}</p>
          )}
          {post.groupSlug && post.groupName ? (
            <Link href={socialGroupHref(post.groupSlug)} className="t-body-sm text-ink-3">
              {post.groupName}
            </Link>
          ) : null}
        </div>
      </div>
      <p className="t-body text-ink whitespace-pre-wrap">{post.body}</p>
      {post.canLike ? (
        <SocialLikeButton
          postId={post.id}
          liked={post.liked}
          likeCount={post.likeCount}
          groupSlug={post.groupSlug ?? undefined}
        />
      ) : (
        <p className="t-body-sm text-ink-3">
          {post.likeCount} {SOCIAL.post.likes}
        </p>
      )}
    </article>
  );
}
