import type { ReactNode } from "react";
import Link from "next/link";

import { TextAction } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  SOCIAL_ACTION_CLASS,
  SOCIAL_ACTION_SECONDARY_CLASS,
  SOCIAL_FEED_ROW_CLASS,
  SOCIAL_HIGHLIGHT_RING_CLASS,
  SOCIAL_PROFILE_GRID_CLASS,
  SOCIAL_PROFILE_HEAD_CLASS,
  SOCIAL_PROFILE_ROLES_LINE_CLASS,
  SOCIAL_PROFILE_TILE_CLASS,
  SOCIAL_TOPIC_CHIP_CLASS,
} from "@/lib/social-chrome";
import {
  displayHandle,
  SOCIAL,
  SOCIAL_ROUTES,
  socialGroupHref,
  socialMemberHref,
  socialPersonIdentity,
  socialRelativeTime,
} from "@/lib/social";
import {
  socialFollowedByLine,
  SOCIAL_MUTUALS_FACE_CAP,
  type SocialProfileMutuals,
} from "@/lib/social-profile-mutuals";
import { socialProfilePublicLinks } from "@/lib/social-profile-links";
import { socialProfileRolesLine } from "@/lib/social-profile-roles";
import { parseSocialProfileTopics } from "@/lib/social-profile-topics";
import {
  SOCIAL_POST_IMAGE_SIZES,
  SOCIAL_PROFILE_TILE_IMAGE_SIZES,
} from "@/lib/social-media-display";
import { SocialAvatar } from "./social-avatar";
import { SocialFeedVideo } from "./social-feed-video";
import { SocialLikeButton, SocialLikeCount } from "./social-engagement";
import { SocialProfileStats } from "./social-profile-stats";
import { SocialEmpty } from "./social-empty";
import { SocialIcon } from "./social-icon";
import { SocialMediaImage } from "./social-media-image";
import { SocialProfileLinkRow } from "./social-profile-links";

export { SocialAvatar } from "./social-avatar";

export function SocialNeedProfile() {
  return (
    <div data-social-need-profile="" className="flex flex-col gap-[var(--space-2)]">
      <SocialEmpty icon="user" title={SOCIAL.cta.needProfile} />
      <TextAction href={SOCIAL_ROUTES.profile}>{SOCIAL.cta.profileHrefLabel}</TextAction>
    </div>
  );
}

export function SocialPersonRow({
  handle,
  displayName,
  photoUrl,
  href,
  size = "sm",
}: {
  handle: string;
  displayName?: string | null;
  photoUrl?: string | null;
  href?: string;
  size?: "sm" | "md";
}) {
  const person = socialPersonIdentity({ handle, displayName });
  const stack = (
    <>
      <SocialAvatar name={person.avatarName} photoUrl={photoUrl} size={size} />
      <span className="min-w-0">
        <span data-social-person-handle="" className="block break-words text-[12px] font-semibold text-ink">
          {person.handleLabel}
        </span>
        {person.name ? (
          <span data-social-person-name="" className="block break-words text-[11px] text-ink-2">
            {person.name}
          </span>
        ) : null}
      </span>
    </>
  );
  const className = "flex min-w-0 items-center gap-[10px]";
  return href ? (
    <Link href={href} data-social-person-row="" className={className}>
      {stack}
    </Link>
  ) : (
    <span data-social-person-row="" className={className}>
      {stack}
    </span>
  );
}

export function SocialConversationFaces({
  people,
}: {
  people: readonly { name: string; photoUrl?: string | null }[];
}) {
  if (people.length <= 1) {
    const only = people[0];
    return <SocialAvatar name={only?.name || "?"} photoUrl={only?.photoUrl} />;
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
  playbackId?: string;
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
    <div data-social-post-media="" className="flex flex-col gap-2">
      {items.map((item) =>
        item.kind === "video" ? (
          <SocialFeedVideo
            key={item.playbackId ?? item.url}
            item={item}
            className="h-[360px] w-full rounded-[8px] bg-surface-muted object-cover"
          />
        ) : (
          <div
            key={item.url}
            data-social-post-image=""
            className="relative h-[360px] w-full overflow-hidden rounded-[8px] bg-surface-muted"
          >
            <SocialMediaImage src={item.url} sizes={SOCIAL_POST_IMAGE_SIZES} />
          </div>
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
  roles,
  topics,
  websiteUrl,
  imdbUrl,
  ring = null,
  photoAction,
  profileId,
  stats,
  mutuals = null,
  actions,
  children,
}: {
  name: string;
  handle: string;
  photoUrl?: string | null;
  bio?: string | null;
  roles?: readonly string[] | null;
  topics?: readonly string[] | null;
  websiteUrl?: string | null;
  imdbUrl?: string | null;
  ring?: "unseen" | "live" | null;
  photoAction?: ReactNode;
  profileId?: string;
  stats?: { posts: number; followers: number; following: number };
  mutuals?: SocialProfileMutuals | null;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const person = socialPersonIdentity({ handle, displayName: name });
  const rolesLine = socialProfileRolesLine(roles ?? []);
  const interestTopics = parseSocialProfileTopics(topics ?? []);
  const links = socialProfilePublicLinks({ websiteUrl, imdbUrl });
  const followedBy = mutuals
    ? socialFollowedByLine(
        mutuals.people.slice(0, SOCIAL_MUTUALS_FACE_CAP).map((peer) => peer.label),
        mutuals.extra,
      )
    : null;
  const actionRow = actions ? (
    <div className="flex w-full items-center gap-2">
      {actions}
      {photoAction}
    </div>
  ) : photoAction ? (
    <div className="flex w-full items-center gap-2">{photoAction}</div>
  ) : null;

  return (
    <div data-social-profile-identity="" className="flex flex-col gap-3">
      <div data-social-profile-head="" className={SOCIAL_PROFILE_HEAD_CLASS}>
        <SocialAvatar name={person.avatarName} photoUrl={photoUrl} ring={ring} size="profile" />
        {stats ? <SocialProfileStats profileId={profileId} handle={handle} stats={stats} /> : null}
      </div>
      <div data-social-profile-copy="" className="min-w-0">
        <p
          data-social-profile-handle=""
          className="break-words text-[18px] font-semibold text-ink md:text-[22px]"
        >
          {person.handleLabel}
        </p>
        {person.name ? (
          <p data-social-profile-name="" className="mt-1 break-words t-body-sm text-ink-2">
            {person.name}
          </p>
        ) : null}
        {rolesLine ? (
          <p data-social-profile-roles="" className={SOCIAL_PROFILE_ROLES_LINE_CLASS}>
            {rolesLine}
          </p>
        ) : null}
        {bio?.trim() ? (
          <p data-social-profile-bio="" className="mt-2 t-body-sm text-ink whitespace-pre-wrap md:t-body">
            {bio}
          </p>
        ) : null}
        {interestTopics.length > 0 ? (
          <div data-social-profile-topics="" className="mt-2 flex flex-wrap gap-2">
            {interestTopics.map((topic) => (
              <span
                key={topic}
                data-social-profile-topic={topic}
                className={SOCIAL_TOPIC_CHIP_CLASS}
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}
        <SocialProfileLinkRow links={links} />
      </div>
      {actionRow}
      {followedBy ? (
        <div data-social-profile-mutuals="" className="flex min-w-0 items-center gap-2">
          <div data-social-profile-mutuals-faces="" className="flex shrink-0">
            {mutuals?.people.slice(0, SOCIAL_MUTUALS_FACE_CAP).map((peer, index) => (
              <SocialAvatar
                key={peer.id}
                name={peer.label}
                photoUrl={peer.photoUrl}
                size="sm"
                className={index === 0 ? undefined : "-ml-2"}
              />
            ))}
          </div>
          <p className="min-w-0 break-words t-body-sm text-ink-2">{followedBy}</p>
        </div>
      ) : null}
      {children}
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
    <div data-social-highlights="" className="flex flex-col gap-2">
      <div className="flex gap-3 overflow-x-auto">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            data-social-highlight={card.id}
            className="flex w-14 shrink-0 flex-col items-center gap-1"
          >
            <span className={SOCIAL_HIGHLIGHT_RING_CLASS}>
              {card.photoUrl ? (
                <SocialAvatar name={card.label} photoUrl={card.photoUrl} />
              ) : (
                <span className="block size-12 rounded-full bg-surface-muted" />
              )}
            </span>
            <span className="w-full truncate text-center t-label text-ink">{card.label}</span>
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
  emptySecondary,
}: {
  posts: readonly SocialPostCardModel[];
  truncated: boolean;
  emptyHint?: string;
  emptyAction?: { href: string; label: string };
  emptySecondary?: { href: string; label: string };
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
            secondary={emptySecondary}
          />
        </div>
      ) : (
        <div data-social-author-posts="" className="flex flex-col gap-[var(--space-4)]">
          {mediaPosts.length > 0 ? (
            <div
              data-social-profile-grid=""
              className={SOCIAL_PROFILE_GRID_CLASS}
            >
              {mediaPosts.map((post) => {
                const first = post.media[0];
                return (
                  <article
                    key={post.id}
                    data-social-post={post.id}
                    className={SOCIAL_PROFILE_TILE_CLASS}
                  >
                    {first.kind === "video" ? (
                      <SocialFeedVideo
                        item={first}
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <div data-social-post-image="" className="absolute inset-0">
                        <SocialMediaImage src={first.url} sizes={SOCIAL_PROFILE_TILE_IMAGE_SIZES} />
                      </div>
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
  const handle = post.authorHandle ? displayHandle(post.authorHandle).slice(1) : post.authorName;
  return (
    <article data-social-post={post.id}>
      <div className={cn(SOCIAL_FEED_ROW_CLASS, "hidden md:flex")}>
        <div className="flex items-center gap-2.5">
          <SocialAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} size="sm" />
          <div className="min-w-0">
            {post.authorHandle ? (
              <Link href={socialMemberHref(post.authorHandle)} className="t-body-sm font-semibold text-ink">
                {post.authorName}
              </Link>
            ) : (
              <p className="t-body-sm font-semibold text-ink">{post.authorName}</p>
            )}
            <p className="t-label text-ink-2">
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
        {media ? <SocialPostMedia items={post.media} /> : null}
        {post.body ? <p className="t-body text-ink whitespace-pre-wrap">{post.body}</p> : null}
        <div className="flex items-center gap-2 t-label text-ink-2">
          {media ? (
            <span className="font-medium text-ink-3">
              {post.media[0]?.kind === "video" ? SOCIAL.home.videoKind : SOCIAL.home.photoKind}
            </span>
          ) : (
            <span className="font-medium text-ink-3">{SOCIAL.create.text}</span>
          )}
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
      </div>
      <div data-social-post-mobile="" className="flex flex-col bg-surface md:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <SocialAvatar name={post.authorName} photoUrl={post.authorPhotoUrl} size="sm" />
          {post.authorHandle ? (
            <Link href={socialMemberHref(post.authorHandle)} className="t-body-sm font-semibold text-ink">
              {handle}
            </Link>
          ) : (
            <p className="t-body-sm font-semibold text-ink">{handle}</p>
          )}
        </div>
        {media ? (
          <div data-social-post-media="" className="-mx-0">
            {post.media[0]?.kind === "video" ? (
              <SocialFeedVideo
                item={post.media[0]}
                className="aspect-square w-full bg-surface-muted object-cover"
              />
            ) : post.media[0]?.url ? (
              <div
                data-social-post-image=""
                className="relative aspect-square w-full bg-surface-muted"
              >
                <SocialMediaImage src={post.media[0].url} sizes={SOCIAL_POST_IMAGE_SIZES} />
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-1 px-3 pb-2.5 pt-2">
          <div className="flex items-center gap-3.5">
            {post.canLike ? (
              <SocialLikeButton
                postId={post.id}
                liked={post.liked}
                likeCount={post.likeCount}
                groupSlug={post.groupSlug ?? undefined}
                icon
              />
            ) : (
              <SocialIcon name="heart" size={22} />
            )}
            <SocialIcon name="chat-circle" size={22} />
            <SocialIcon name="paper-plane-tilt" size={22} />
          </div>
          <SocialLikeCount postId={post.id} liked={post.liked} likeCount={post.likeCount} />
          {post.body ? (
            <p className="t-body-sm text-ink">
              <span className="font-semibold">{handle} </span>
              {post.body}
            </p>
          ) : null}
          {post.commentCount ? (
            <p className="t-body-sm text-ink-2">
              {post.commentCount} {SOCIAL.post.comments}
            </p>
          ) : null}
          <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-ink-3">
            {socialRelativeTime(post.createdAt)}
          </p>
        </div>
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
