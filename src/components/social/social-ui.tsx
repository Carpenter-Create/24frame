import type { ReactNode } from "react";
import Link from "next/link";

import { TextAction } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import {
  SOCIAL_ACTION_CLASS,
  SOCIAL_ACTION_SECONDARY_CLASS,
  SOCIAL_AVATAR_LG_CLASS,
  SOCIAL_AVATAR_SM_CLASS,
  SOCIAL_CARD_CLASS,
  SOCIAL_CARD_MUTED_CLASS,
} from "@/lib/social-chrome";
import {
  displayHandle,
  formatSocialCount,
  SOCIAL,
  SOCIAL_ROUTES,
  socialGroupHref,
  socialMemberHref,
  socialInitials,
  socialProfilePublicHost,
  socialRelativeTime,
} from "@/lib/social";
import { SocialLikeButton } from "./social-forms";
import { SocialEmpty } from "./social-empty";

export function SocialNeedProfile() {
  return (
    <div data-social-need-profile="" className="flex flex-col gap-[var(--space-2)]">
      <SocialEmpty icon="user" title={SOCIAL.cta.needProfile} />
      <TextAction href={SOCIAL_ROUTES.profile}>{SOCIAL.cta.profileHrefLabel}</TextAction>
    </div>
  );
}

export function SocialAvatar({
  name,
  photoUrl,
  ring = null,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  ring?: "unseen" | "live" | null;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg" ? SOCIAL_AVATAR_LG_CLASS : size === "sm" ? SOCIAL_AVATAR_SM_CLASS : IDENTITY_AVATAR_CLASS;
  return (
    <div
      data-social-avatar=""
      data-social-avatar-ring={ring ?? undefined}
      className={cn(
        box,
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
  commentCount?: number;
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
            className="h-[360px] w-full rounded-[8px] bg-surface-muted object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the member media lane
          <img
            key={item.url}
            data-social-post-image=""
            src={item.url}
            alt=""
            className="h-[420px] w-full rounded-[8px] bg-surface-muted object-cover"
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
  stats,
  actions,
  children,
}: {
  name: string;
  handle: string;
  photoUrl?: string | null;
  bio?: string | null;
  ring?: "unseen" | "live" | null;
  photoAction?: ReactNode;
  stats?: { posts: number; followers: number; following: number };
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div data-social-profile-identity="" className="flex flex-col gap-[var(--space-6)] md:flex-row md:items-start">
      <SocialAvatar name={name} photoUrl={photoUrl} ring={ring} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
        <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-[length:var(--text-title)] font-semibold text-ink">{name}</p>
            <p className="t-body text-ink-2">{displayHandle(handle)}</p>
            <p className="t-body-sm text-ink-2">{socialProfilePublicHost(handle)}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-[var(--space-2)]">
            {actions}
            {photoAction}
          </div>
        </div>
        {bio?.trim() ? (
          <p data-social-profile-bio="" className="t-body text-ink whitespace-pre-wrap">
            {bio}
          </p>
        ) : null}
        {stats ? (
          <div data-social-profile-stats="" className="flex flex-wrap gap-[var(--space-6)] t-body">
            <p>
              <span className="font-semibold text-ink">{formatSocialCount(stats.posts)}</span>{" "}
              <span className="text-ink-2">{SOCIAL.profile.postsStat}</span>
            </p>
            <p>
              <span className="font-semibold text-ink">{formatSocialCount(stats.followers)}</span>{" "}
              <span className="text-ink-2">{SOCIAL.profile.followersStat}</span>
            </p>
            <p>
              <span className="font-semibold text-ink">{formatSocialCount(stats.following)}</span>{" "}
              <span className="text-ink-2">{SOCIAL.profile.followingStat}</span>
            </p>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function SocialHighlights({
  cards,
}: {
  cards: readonly { id: string; href: string; label: string; photoUrl?: string | null }[];
}) {
  if (cards.length === 0) return null;
  return (
    <div data-social-highlights="" className="flex flex-col gap-[var(--space-4)]">
      <div className="flex gap-[var(--space-4)] overflow-x-auto">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            data-social-highlight={card.id}
            className="flex w-16 shrink-0 flex-col items-center gap-[var(--space-2)]"
          >
            <span className="rounded-full border-2 border-accent p-[3px]">
              {card.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET
                <img src={card.photoUrl} alt="" className="size-14 rounded-full object-cover" />
              ) : (
                <span className="block size-14 rounded-full bg-surface-muted" />
              )}
            </span>
            <span className="w-full truncate text-center t-body-sm text-ink">{card.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function socialPostEngagement(post: SocialPostCardModel): string {
  const likes = `${post.likeCount} ${SOCIAL.post.likes}`;
  const comments = post.commentCount
    ? ` · ${post.commentCount} ${SOCIAL.post.comments}`
    : "";
  return `${likes}${comments}`;
}

export function SocialAuthorHistory({
  posts,
  truncated,
  emptyHint,
  emptyAction,
}: {
  posts: readonly SocialPostCardModel[];
  truncated: boolean;
  emptyHint?: string;
  emptyAction?: { href: string; label: string };
}) {
  const mediaPosts = posts.filter((post) => post.media.length > 0);
  const textPosts = posts.filter((post) => post.media.length === 0);
  return (
    <div data-social-author-history="" className="flex flex-col gap-[var(--space-4)]">
      {posts.length === 0 ? (
        <div data-social-author-empty="">
          <SocialEmpty
            icon="image"
            title={SOCIAL.profile.postsEmpty}
            hint={emptyHint ?? SOCIAL.profile.postsEmptyHint}
            action={emptyAction}
          />
        </div>
      ) : (
        <div data-social-author-posts="" className="flex flex-col gap-[var(--space-4)]">
          {mediaPosts.length > 0 ? (
            <div
              data-social-profile-grid=""
              className="grid grid-cols-2 gap-[var(--space-2)] md:grid-cols-3"
            >
              {mediaPosts.map((post) => {
                const first = post.media[0];
                return (
                  <article
                    key={post.id}
                    data-social-post={post.id}
                    className="relative flex h-[220px] flex-col justify-between overflow-hidden rounded-[8px] bg-surface-muted p-[var(--space-4)]"
                  >
                    {first.kind === "video" ? (
                      <video
                        data-social-post-video=""
                        preload="metadata"
                        src={first.url}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET
                      <img
                        data-social-post-image=""
                        src={first.url}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}
                    <p className="relative t-label font-medium uppercase tracking-[0.08em] text-ink-2">
                      {first.kind === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind}
                    </p>
                    {post.body ? (
                      <p className="relative line-clamp-2 t-body-sm text-ink">{post.body}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
          {textPosts.map((post) => (
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
    comment_count?: number;
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
    commentCount: input.post.comment_count,
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
  const media = post.media.length > 0;
  return (
    <article
      data-social-post={post.id}
      className={media ? SOCIAL_CARD_CLASS : SOCIAL_CARD_MUTED_CLASS}
    >
      {media ? <SocialPostMedia items={post.media} /> : null}
      <div className="flex items-center gap-[var(--space-3)]">
        <SocialAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} size="sm" />
        <div className="min-w-0">
          {post.authorHandle ? (
            <Link href={socialMemberHref(post.authorHandle)} className="t-body-sm font-medium text-ink">
              {post.authorName}
            </Link>
          ) : (
            <p className="t-body-sm font-medium text-ink">{post.authorName}</p>
          )}
          <p className="t-body-sm text-ink-2">
            {socialRelativeTime(post.createdAt)}
            {post.groupSlug && post.groupName ? (
              <>
                {" · "}
                <Link href={socialGroupHref(post.groupSlug)} className="text-ink-2">
                  {post.groupName}
                </Link>
              </>
            ) : (
              <> · {SOCIAL.follow.following}</>
            )}
          </p>
        </div>
      </div>
      {post.body ? <p className="t-body text-ink whitespace-pre-wrap">{post.body}</p> : null}
      <div className="flex items-center gap-[var(--space-4)] t-body-sm text-ink-2">
        {post.canLike ? (
          <SocialLikeButton
            postId={post.id}
            liked={post.liked}
            likeCount={post.likeCount}
            groupSlug={post.groupSlug ?? undefined}
          />
        ) : (
          <p>{socialPostEngagement(post)}</p>
        )}
      </div>
    </article>
  );
}

export function SocialProfileActions({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex flex-wrap items-center gap-[var(--space-2)]">{children}</div>;
}

export { SOCIAL_ACTION_CLASS, SOCIAL_ACTION_SECONDARY_CLASS };
