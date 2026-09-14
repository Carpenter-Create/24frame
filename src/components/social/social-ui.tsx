import type { ReactNode } from "react";
import Link from "next/link";

import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import {
  displayHandle,
  SOCIAL,
  SOCIAL_ROUTES,
  socialGroupHref,
  socialMemberHref,
  socialInitials,
} from "@/lib/social";
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
  ring = null,
}: {
  name: string;
  photoUrl?: string | null;
  ring?: "unseen" | "live" | null;
}) {
  return (
    <div
      data-social-avatar=""
      data-social-avatar-ring={ring ?? undefined}
      className={cn(
        IDENTITY_AVATAR_CLASS,
        photoUrl ? "overflow-hidden" : null,
        ring ? "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]" : null,
      )}
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

export type SocialPostMediaItem = {
  kind: "image" | "video";
  url: string;
};

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
  media: SocialPostMediaItem[];
};

export function SocialPostMedia({ items }: { items: readonly SocialPostMediaItem[] }) {
  if (items.length === 0) return null;
  return (
    <div data-social-post-media="" className="flex flex-col gap-[var(--space-2)]">
      {items.map((item) =>
        item.kind === "video" ? (
          <video
            key={item.url}
            data-social-post-video=""
            controls
            preload="metadata"
            src={item.url}
            className="w-full rounded-[var(--radius)] bg-surface-muted"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the member media lane
          <img
            key={item.url}
            data-social-post-image=""
            src={item.url}
            alt=""
            className="w-full rounded-[var(--radius)] object-cover"
          />
        ),
      )}
    </div>
  );
}

export function SocialProfileIdentity({
  name,
  handle,
  photoUrl,
  bio,
  ring = null,
  photoAction,
  children,
}: {
  name: string;
  handle: string;
  photoUrl?: string | null;
  bio?: string | null;
  ring?: "unseen" | "live" | null;
  photoAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div data-social-profile-identity="" className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-4)]">
        <SocialAvatar name={name} photoUrl={photoUrl} ring={ring} />
        <div className="min-w-0">
          <p className="t-body font-medium text-ink">{name}</p>
          <p className="t-body-sm text-ink-3">{displayHandle(handle)}</p>
        </div>
        {photoAction}
      </div>
      {bio?.trim() ? (
        <p data-social-profile-bio="" className="t-body text-ink whitespace-pre-wrap">
          {bio}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function SocialAuthorHistory({
  posts,
  truncated,
}: {
  posts: readonly SocialPostCardModel[];
  truncated: boolean;
}) {
  return (
    <div data-social-author-history="">
      {posts.length === 0 ? (
        <div data-social-author-empty="">
          <HouseEmpty>{SOCIAL.profile.postsEmpty}</HouseEmpty>
        </div>
      ) : (
        <div data-social-author-posts="">
          {posts.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {truncated ? (
        <InlineNotice data-social-author-truncated="">{SOCIAL.profile.postsTruncated}</InlineNotice>
      ) : null}
    </div>
  );
}

export function socialAuthorPostCard(input: {
  post: {
    id: string;
    body: string | null;
    author_id: string;
    like_count: number;
    created_at: string;
  };
  authorHandle: string;
  authorName: string;
  authorPhotoUrl: string | null;
  liked: boolean;
  canLike: boolean;
  media: SocialPostMediaItem[];
}): SocialPostCardModel {
  return {
    id: input.post.id,
    body: input.post.body,
    likeCount: input.post.like_count,
    liked: input.liked,
    createdAt: input.post.created_at,
    authorId: input.post.author_id,
    authorHandle: input.authorHandle,
    authorName: input.authorName,
    authorPhotoUrl: input.authorPhotoUrl,
    groupSlug: null,
    groupName: null,
    canLike: input.canLike,
    media: input.media,
  };
}

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
      {post.body ? <p className="t-body text-ink whitespace-pre-wrap">{post.body}</p> : null}
      <SocialPostMedia items={post.media} />
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
