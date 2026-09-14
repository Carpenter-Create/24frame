import Link from "next/link";

import { SocialStoryReply } from "@/components/social/social-forms";
import { SocialAvatar, SocialPostMedia, type SocialPostMediaItem } from "@/components/social/social-ui";
import { SocialIcon } from "@/components/social/social-icon";
import { SOCIAL, SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";

export function SocialStoryViewer({
  storyId,
  authorId,
  authorName,
  authorPhotoUrl,
  createdAt,
  body,
  media,
  prevId,
  nextId,
  index,
  total,
  canReply,
}: {
  storyId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  createdAt: string;
  body: string | null;
  media: readonly SocialPostMediaItem[];
  prevId: string | null;
  nextId: string | null;
  index: number;
  total: number;
  canReply: boolean;
}) {
  const bars = Math.max(total, 1);

  return (
    <article
      data-social-story-viewer={storyId}
      className="mx-auto flex w-full max-w-[420px] flex-col gap-[var(--space-4)] rounded-[16px] border border-hairline bg-surface p-[var(--space-4)]"
    >
      <div className="flex gap-1" data-social-story-progress="">
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            className={
              i <= index
                ? "h-0.5 flex-1 rounded-full bg-accent"
                : "h-0.5 flex-1 rounded-full bg-hairline"
            }
          />
        ))}
      </div>
      <div className="flex items-center gap-[var(--space-3)]">
        <SocialAvatar name={authorName} photoUrl={authorPhotoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="t-body-sm font-medium text-ink">{authorName}</p>
          <p className="t-body-sm text-ink-2">{socialRelativeTime(createdAt)}</p>
        </div>
        <Link
          href={SOCIAL_ROUTES.stories}
          aria-label="Close"
          className="flex size-8 items-center justify-center text-ink-2"
        >
          <SocialIcon name="x" size={20} />
        </Link>
      </div>
      <div className="relative flex min-h-[360px] items-center justify-center rounded-[8px] bg-surface-muted">
        {prevId ? (
          <Link
            href={socialStoryHref(prevId)}
            aria-label="Previous story"
            className="absolute left-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center text-ink-2"
          >
            <SocialIcon name="caret-left" size={28} />
          </Link>
        ) : null}
        {nextId ? (
          <Link
            href={socialStoryHref(nextId)}
            aria-label="Next story"
            className="absolute right-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center text-ink-2"
          >
            <SocialIcon name="caret-right" size={28} />
          </Link>
        ) : null}
        {media.length > 0 ? (
          <SocialPostMedia items={media} />
        ) : (
          <div className="flex flex-col items-center gap-[var(--space-2)] px-[var(--space-6)] text-center">
            <span className="size-10 rounded-[8px] bg-hairline" />
            {body ? <p className="t-body text-ink whitespace-pre-wrap">{body}</p> : null}
          </div>
        )}
      </div>
      {body && media.length > 0 ? (
        <p className="t-body text-ink whitespace-pre-wrap">{body}</p>
      ) : null}
      <div className="flex items-center gap-[var(--space-3)]">
        {canReply ? <SocialStoryReply peerId={authorId} /> : <div className="flex-1" />}
        <span data-social-story-heart="" className="flex size-10 items-center justify-center text-ink-2">
          <SocialIcon name="heart" size={22} />
        </span>
      </div>
    </article>
  );
}
