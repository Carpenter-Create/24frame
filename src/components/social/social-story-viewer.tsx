import Link from "next/link";

import { SocialStoryReply } from "@/components/social/social-forms";
import { SocialAvatar, SocialPostMedia, type SocialPostMediaItem } from "@/components/social/social-ui";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_STORY_CARET_CLASS,
  SOCIAL_STORY_PROGRESS_BAR_CLASS,
  SOCIAL_STORY_VIEWER_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ROUTES, socialRelativeTime, socialStoryHref } from "@/lib/social";
import { cn } from "@/lib/cn";

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
    <article data-social-story-viewer={storyId} className={SOCIAL_STORY_VIEWER_CLASS}>
      <div className="flex gap-1" data-social-story-progress="">
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            className={cn(
              SOCIAL_STORY_PROGRESS_BAR_CLASS,
              i <= index ? "bg-accent" : "bg-hairline",
            )}
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
            className={cn(SOCIAL_STORY_CARET_CLASS, "left-2")}
          >
            <SocialIcon name="caret-left" size={20} />
          </Link>
        ) : null}
        {nextId ? (
          <Link
            href={socialStoryHref(nextId)}
            aria-label="Next story"
            className={cn(SOCIAL_STORY_CARET_CLASS, "right-2")}
          >
            <SocialIcon name="caret-right" size={20} />
          </Link>
        ) : null}
        {media.length > 0 ? (
          <SocialPostMedia items={media} />
        ) : (
          <div className="flex flex-col items-center gap-[var(--space-2)] px-[var(--space-6)] text-center">
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
          <SocialIcon name="heart" size={20} />
        </span>
      </div>
    </article>
  );
}
