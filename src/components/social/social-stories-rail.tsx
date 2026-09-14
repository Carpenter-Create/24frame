import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import {
  SOCIAL_STORY_CARD_CLASS,
  SOCIAL_STORY_FACE_CLASS,
} from "@/lib/social-chrome";
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
            className="flex w-[112px] shrink-0 flex-col items-center gap-[var(--space-2)]"
          >
            <div className={cn(SOCIAL_STORY_CARD_CLASS, "bg-hairline")}>
              <div className={cn(SOCIAL_STORY_FACE_CLASS, "bg-surface")}>
                <SocialIcon name="plus" size={28} className="text-accent" />
                <p className="t-body-sm font-medium text-ink">{SOCIAL.stories.create}</p>
              </div>
            </div>
            <p className="t-body-sm text-ink">{SOCIAL.stories.you}</p>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = author?.display_name ?? "Member";
          const photo = faces.get(card.authorId);
          return (
            <Link
              key={card.authorId}
              href={socialStoryHref(card.latest.id)}
              data-social-story-card={card.authorId}
              data-social-story-unseen={card.unseen ? "" : undefined}
              className="flex w-[112px] shrink-0 flex-col items-center gap-[var(--space-2)]"
            >
              <div className={cn(SOCIAL_STORY_CARD_CLASS, card.unseen ? "bg-accent" : "bg-hairline")}>
                <div className={cn(SOCIAL_STORY_FACE_CLASS, "bg-surface-muted")}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
                    <img src={photo} alt="" className="size-10 rounded-[8px] object-cover" />
                  ) : (
                    <div className="size-10 rounded-[8px] bg-hairline" />
                  )}
                  <p className="truncate t-label font-medium text-ink-2">{name}</p>
                </div>
              </div>
              <p className="w-full truncate text-center t-body-sm text-ink">{name}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
