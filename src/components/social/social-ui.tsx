import Link from "next/link";

import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { cn } from "@/lib/cn";
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

export function SocialAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  return (
    <div
      data-social-avatar=""
      className={cn(IDENTITY_AVATAR_CLASS, photoUrl ? "overflow-hidden" : null)}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        socialInitials(name)
      )}
    </div>
  );
}

export function SocialConversationFaces({
  people,
}: {
  people: readonly { name: string; photoUrl?: string | null }[];
}) {
  if (people.length <= 1) {
    const only = people[0];
    return <SocialAvatar name={only?.name ?? "Member"} photoUrl={only?.photoUrl} />;
  }

  const shown = people.slice(0, 2);
  return (
    <div data-social-conversation-faces="" className="relative size-12 shrink-0">
      <div className="absolute left-0 top-0 origin-top-left scale-75">
        <SocialAvatar name={shown[0].name} photoUrl={shown[0].photoUrl} />
      </div>
      <div className="absolute right-0 bottom-0 origin-bottom-right scale-75">
        <SocialAvatar name={shown[1].name} photoUrl={shown[1].photoUrl} />
      </div>
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
  authorPhotoUrl: string | null;
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
        <SocialAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} />
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
