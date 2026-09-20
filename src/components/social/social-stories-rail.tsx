import Link from "next/link";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialIcon } from "@/components/social/social-icon";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { cn } from "@/lib/cn";
import {
  SOCIAL_HOME_STORY_CARD_CLASS,
  SOCIAL_HOME_STORY_CREATE_FACE_CLASS,
  SOCIAL_HOME_STORY_CREATE_LABEL_CLASS,
  SOCIAL_HOME_STORY_FACE_RING_CLASS,
  SOCIAL_HOME_STORY_NAME_CLASS,
  SOCIAL_HOME_STORY_PLUS_CLASS,
  SOCIAL_STORIES_CARD_CLASS,
  SOCIAL_STORIES_FACE_CLASS,
  SOCIAL_STORIES_MEDIA_CLASS,
  SOCIAL_STORIES_PLUS_WELL_CLASS,
  SOCIAL_STORY_CREATE_LABEL_TYPE_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_STORY_PLUS } from "@/lib/social-icons";
import type { SocialStoryRailCard } from "@/lib/social-feed";
import { SOCIAL_STORY_CARD_IMAGE_SIZES } from "@/lib/social-media-display";
import { SOCIAL, SOCIAL_ROUTES, socialInitials, socialPersonLabel, socialStoryHref } from "@/lib/social";

function storyLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[1]?.[0]) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0] ?? name;
}

function HomeTallStoriesRail({
  cards,
  authors,
  faces,
  canCreate,
  createName,
  createPhotoUrl,
}: {
  cards: readonly SocialStoryRailCard[];
  authors: ReadonlyMap<string, { display_name: string; handle?: string }>;
  faces: ReadonlyMap<string, string | null>;
  canCreate: boolean;
  createName?: string | null;
  createPhotoUrl?: string | null;
}) {
  return (
    <div
      data-social-stories=""
      data-social-stories-surface="home"
      data-social-stories-tall=""
      className="overflow-x-auto"
    >
      <div className="flex w-max gap-2 pb-2">
        {canCreate ? (
          <Link
            href={SOCIAL_ROUTES.storiesNew}
            data-social-story-create=""
            aria-label={SOCIAL.stories.create}
            className={SOCIAL_HOME_STORY_CARD_CLASS}
          >
            <span className={SOCIAL_HOME_STORY_CREATE_FACE_CLASS}>
              <SocialAvatar
                name={createName ?? SOCIAL.home.you}
                photoUrl={createPhotoUrl}
                size="lg"
              />
            </span>
            <span className={SOCIAL_HOME_STORY_PLUS_CLASS}>
              <SocialIcon
                name="plus"
                active
                size={SOCIAL_ICON_SIZE_STORY_PLUS}
                className="text-accent-contrast"
              />
            </span>
            <span className={SOCIAL_HOME_STORY_CREATE_LABEL_CLASS}>{SOCIAL.stories.create}</span>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = socialPersonLabel({
            handle: author?.handle ?? "",
            displayName: author?.display_name,
          });
          const photo = faces.get(card.authorId);
          return (
            <Link
              key={card.authorId}
              href={socialStoryHref(card.latest.id)}
              data-social-story-card={card.authorId}
              data-social-story-unseen={card.unseen ? "" : undefined}
              className={SOCIAL_HOME_STORY_CARD_CLASS}
            >
              <span data-social-story-media="" className="absolute inset-0 bg-surface-muted">
                {photo ? (
                  <SocialMediaImage src={photo} sizes={SOCIAL_STORY_CARD_IMAGE_SIZES} />
                ) : (
                  <span className="flex size-full items-center justify-center t-body font-semibold text-ink-2">
                    {socialInitials(name)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  SOCIAL_HOME_STORY_FACE_RING_CLASS,
                  card.unseen ? "border-accent" : "border-hairline",
                )}
              >
                <SocialAvatar
                  name={name}
                  photoUrl={photo ?? null}
                  size="sm"
                  className="size-full"
                />
              </span>
              <span className={SOCIAL_HOME_STORY_NAME_CLASS}>{storyLabel(name)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SocialStoriesRail({
  cards,
  authors,
  faces,
  canCreate,
  createName,
  createPhotoUrl,
  surface = "home",
}: {
  cards: readonly SocialStoryRailCard[];
  authors: ReadonlyMap<string, { display_name: string; handle?: string }>;
  faces: ReadonlyMap<string, string | null>;
  canCreate: boolean;
  createName?: string | null;
  createPhotoUrl?: string | null;
  surface?: "home" | "stories";
}) {
  if (surface === "home") {
    return (
      <HomeTallStoriesRail
        cards={cards}
        authors={authors}
        faces={faces}
        canCreate={canCreate}
        createName={createName}
        createPhotoUrl={createPhotoUrl}
      />
    );
  }

  const cardClass = SOCIAL_STORIES_CARD_CLASS;
  const faceClass = SOCIAL_STORIES_FACE_CLASS;
  const mediaClass = SOCIAL_STORIES_MEDIA_CLASS;

  return (
    <div data-social-stories="" data-social-stories-surface={surface} className="overflow-x-auto">
      <div className="hidden w-max gap-3 pb-2 md:flex">
        {canCreate ? (
          <Link
            href={SOCIAL_ROUTES.storiesNew}
            data-social-story-create=""
            aria-label={SOCIAL.stories.create}
            className="flex w-[112px] shrink-0 flex-col items-center gap-1.5"
          >
            <div className={cn(cardClass, "bg-hairline")}>
              <div className={cn(faceClass, "bg-surface-muted")}>
                <span className={SOCIAL_STORIES_PLUS_WELL_CLASS}>
                  <SocialIcon
                    name="plus"
                    active
                    size={SOCIAL_ICON_SIZE_STORY_PLUS}
                    className="text-accent-contrast"
                  />
                </span>
                <p className={cn("text-center", SOCIAL_STORY_CREATE_LABEL_TYPE_CLASS)}>
                  {SOCIAL.stories.create}
                </p>
              </div>
            </div>
            <p className="t-label font-medium text-ink">{SOCIAL.stories.you}</p>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = socialPersonLabel({
            handle: author?.handle ?? "",
            displayName: author?.display_name,
          });
          const photo = faces.get(card.authorId);
          return (
            <Link
              key={card.authorId}
              href={socialStoryHref(card.latest.id)}
              data-social-story-card={card.authorId}
              data-social-story-unseen={card.unseen ? "" : undefined}
              className="flex w-[112px] shrink-0 flex-col items-center gap-1.5"
            >
              <div className={cn(cardClass, card.unseen ? "bg-accent" : "bg-hairline")}>
                <div data-social-story-media="" className={mediaClass}>
                  {photo ? <SocialMediaImage src={photo} sizes={SOCIAL_STORY_CARD_IMAGE_SIZES} /> : null}
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
            <span className="flex size-[68px] items-center justify-center rounded-full border-[3px] border-hairline">
              <span className="flex size-[58px] items-center justify-center rounded-full bg-surface-muted">
                <span className={SOCIAL_STORIES_PLUS_WELL_CLASS}>
                  <SocialIcon
                    name="plus"
                    active
                    size={SOCIAL_ICON_SIZE_STORY_PLUS}
                    className="text-accent-contrast"
                  />
                </span>
              </span>
            </span>
            <p className="text-[10px] font-medium text-ink">{SOCIAL.stories.you}</p>
          </Link>
        ) : null}
        {cards.map((card) => {
          const author = authors.get(card.authorId);
          const name = socialPersonLabel({
            handle: author?.handle ?? "",
            displayName: author?.display_name,
          });
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
                <span className="relative flex size-[58px] items-center justify-center overflow-hidden rounded-full bg-surface-muted">
                  <SocialAvatar name={name} photoUrl={photo ?? null} size="sm" className="size-full" />
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
