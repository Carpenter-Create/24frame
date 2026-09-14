import Link from "next/link";

import { SocialAvatar } from "@/components/social/social-ui";
import { cn } from "@/lib/cn";
import type { SocialStoryRailCard } from "@/lib/social-feed";
import { SOCIAL, SOCIAL_ROUTES, socialStoryHref } from "@/lib/social";

export function SocialStoriesRail({
  cards,
  authors,
  faces,
  canCreate,
}: {
  cards: readonly SocialStoryRailCard[];
  authors: ReadonlyMap<string, { display_name: string; handle?: string }>;
  faces: ReadonlyMap<string, string | null>;
  canCreate: boolean;
}) {
  return (
    <div
      data-social-stories=""
      className="-mx-[var(--content-inset)] overflow-x-auto px-[var(--content-inset)]"
    >
      <div className="flex w-max gap-[var(--space-3)] pb-[var(--space-4)]">
        {canCreate ? (
          <Link
            href={SOCIAL_ROUTES.storiesNew}
            data-social-story-create=""
            className="flex w-[5.5rem] shrink-0 flex-col gap-[var(--space-2)]"
          >
            <div className="flex aspect-[9/16] items-center justify-center rounded-[var(--radius)] bg-surface-muted t-body text-ink-2">
              +
            </div>
            <p className="t-body-sm text-ink-2">{SOCIAL.stories.create}</p>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = author?.display_name ?? "Member";
          return (
            <Link
              key={card.authorId}
              href={socialStoryHref(card.latest.id)}
              data-social-story-card={card.authorId}
              data-social-story-unseen={card.unseen ? "" : undefined}
              className="flex w-[5.5rem] shrink-0 flex-col gap-[var(--space-2)]"
            >
              <div
                className={cn(
                  "flex aspect-[9/16] items-end justify-center rounded-[var(--radius)] bg-surface-muted p-[var(--space-2)]",
                  card.unseen ? "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]" : null,
                )}
              >
                <SocialAvatar name={name} photoUrl={faces.get(card.authorId)} ring={card.unseen ? "unseen" : null} />
              </div>
              <p className="truncate t-body-sm text-ink-2">{name}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
