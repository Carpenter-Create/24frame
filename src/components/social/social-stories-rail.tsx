import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import {
  SOCIAL_STORY_CARD_CLASS,
  SOCIAL_STORY_FACE_CLASS,
  SOCIAL_STORY_MEDIA_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_STORY_CREATE } from "@/lib/social-icons";
import type { SocialStoryRailCard } from "@/lib/social-feed";
import { SOCIAL, SOCIAL_ROUTES, socialInitials, socialStoryHref } from "@/lib/social";

function storyLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[1]?.[0]) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0] ?? name;
}

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
    <div data-social-stories="" className="overflow-x-auto">
      <div className="hidden w-max gap-3 pb-2 md:flex">
        {canCreate ? (
          <Link
            href={SOCIAL_ROUTES.storiesNew}
            data-social-story-create=""
            aria-label={SOCIAL.stories.create}
            className="flex w-[96px] shrink-0 flex-col items-center gap-1.5"
          >
            <div className={cn(SOCIAL_STORY_CARD_CLASS, "bg-accent")}>
              <div className={cn(SOCIAL_STORY_FACE_CLASS, "bg-surface-muted")}>
                <SocialIcon name="plus" size={SOCIAL_ICON_SIZE_STORY_CREATE} className="text-ink" />
              </div>
            </div>
            <p className="t-label font-medium text-ink">{SOCIAL.stories.you}</p>
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
              className="flex w-[96px] shrink-0 flex-col items-center gap-1.5"
            >
              <div className={cn(SOCIAL_STORY_CARD_CLASS, card.unseen ? "bg-accent" : "bg-hairline")}>
                <div data-social-story-media="" className={SOCIAL_STORY_MEDIA_CLASS}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
                    <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : null}
                </div>
              </div>
              <p className="w-full truncate text-center t-label font-medium text-ink">{storyLabel(name)}</p>
            </Link>
          );
        })}
      </div>
      <div data-social-stories-mobile="" className="flex w-max gap-3.5 pb-2 md:hidden">
        {canCreate ? (
          <Link
            href={SOCIAL_ROUTES.storiesNew}
            data-social-story-create=""
            aria-label={SOCIAL.stories.create}
            className="flex w-[68px] shrink-0 flex-col items-center gap-1"
          >
            <span className="flex size-[68px] items-center justify-center rounded-full border-[3px] border-accent">
              <span className="flex size-[58px] items-center justify-center rounded-full bg-surface-muted">
                <SocialIcon name="plus" size={22} className="text-ink" />
              </span>
            </span>
            <p className="text-[10px] font-medium text-ink">{SOCIAL.stories.yourStory}</p>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = author?.display_name ?? "Member";
          const photo = faces.get(card.authorId);
          return (
            <Link
              key={`m-${card.authorId}`}
              href={socialStoryHref(card.latest.id)}
              data-social-story-card={card.authorId}
              data-social-story-unseen={card.unseen ? "" : undefined}
              className="flex w-[68px] shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "flex size-[68px] items-center justify-center rounded-full border-[3px]",
                  card.unseen ? "border-accent" : "border-hairline",
                )}
              >
                <span className="relative flex size-[58px] items-center justify-center overflow-hidden rounded-full bg-surface-muted t-body-sm font-semibold text-ink">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET
                    <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    socialInitials(name)
                  )}
                </span>
              </span>
              <p className="w-full truncate text-center text-[10px] font-medium text-ink">{storyLabel(name)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
