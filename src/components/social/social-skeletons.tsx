import { Skeleton } from "@/components/layout/skeleton";
import {
  SOCIAL_AVATAR_PROFILE_CLASS,
  SOCIAL_AVATAR_SM_CLASS,
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_CREATE_CARD_CLASS,
  SOCIAL_CREATE_WELL_CLASS,
  SOCIAL_FEED_ROW_CLASS,
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_FOR_YOU_RAIL_CLASS,
  SOCIAL_HOME_CENTER_CLASS,
  SOCIAL_HOME_LAYOUT_CLASS,
  SOCIAL_HOME_STORY_CARD_CLASS,
  SOCIAL_PROFILE_GRID_CLASS,
  SOCIAL_PROFILE_TILE_CLASS,
  SOCIAL_STORY_CARD_CLASS,
  SOCIAL_STORY_VIEWER_CLASS,
} from "@/lib/social-chrome";

function SocialForYouSkeleton() {
  return (
    <aside data-social-for-you-skeleton="" className={SOCIAL_FOR_YOU_RAIL_CLASS}>
      <Skeleton className="h-4 w-24" />
      <div className={SOCIAL_FOR_YOU_CARD_CLASS}>
        <Skeleton className="h-14 w-full rounded-[8px]" />
        <Skeleton className="h-14 w-full rounded-[8px]" />
      </div>
    </aside>
  );
}

function SocialStoriesRailSkeleton({
  count = 5,
  tall = false,
}: {
  count?: number;
  tall?: boolean;
}) {
  return (
    <div data-social-stories-skeleton="" className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={tall ? SOCIAL_HOME_STORY_CARD_CLASS : SOCIAL_STORY_CARD_CLASS} />
      ))}
    </div>
  );
}

export function SocialHomeSkeleton() {
  return (
    <div data-social-home-skeleton="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <div className={SOCIAL_COMPOSER_CLASS}>
          <div className="flex items-center gap-2.5">
            <Skeleton className={SOCIAL_AVATAR_SM_CLASS} />
            <Skeleton className="h-10 min-w-0 flex-1 rounded-[20px]" />
          </div>
        </div>
        <SocialStoriesRailSkeleton tall />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={SOCIAL_FEED_ROW_CLASS}>
            <div className="flex gap-2">
              <Skeleton className={SOCIAL_AVATAR_SM_CLASS} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-[8px]" />
          </div>
        ))}
      </div>
      <SocialForYouSkeleton />
    </div>
  );
}

export function SocialProfileSkeleton() {
  return (
    <div data-social-profile-skeleton="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <div className="flex items-start gap-3 md:gap-4">
          <Skeleton className={SOCIAL_AVATAR_PROFILE_CLASS} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-7 w-24 rounded-[8px]" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className={SOCIAL_PROFILE_GRID_CLASS}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={SOCIAL_PROFILE_TILE_CLASS} />
          ))}
        </div>
      </div>
      <SocialForYouSkeleton />
    </div>
  );
}

export function SocialCreateSkeleton() {
  return (
    <div data-social-create-skeleton="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <div className={SOCIAL_CREATE_CARD_CLASS}>
          <Skeleton className="h-8 w-32" />
          <Skeleton className={SOCIAL_CREATE_WELL_CLASS} />
        </div>
      </div>
      <SocialForYouSkeleton />
    </div>
  );
}

export function SocialStoriesSkeleton() {
  return (
    <div data-social-stories-index-skeleton="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <SocialStoriesRailSkeleton />
      </div>
      <SocialForYouSkeleton />
    </div>
  );
}

export function SocialStoryViewerSkeleton() {
  return (
    <div data-social-story-viewer-skeleton="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <SocialStoriesRailSkeleton />
        <div className={SOCIAL_STORY_VIEWER_CLASS}>
          <Skeleton className="h-[520px] w-full rounded-[16px]" />
        </div>
      </div>
      <SocialForYouSkeleton />
    </div>
  );
}

export function SocialExploreSkeleton() {
  return (
    <div data-social-explore-skeleton="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex flex-col gap-2 pb-6">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
      <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export function SocialDmsSkeleton() {
  return (
    <div data-social-dms-skeleton="" className="flex flex-col gap-[var(--space-4)]">
      <div className="flex flex-col gap-2 pb-6">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-[var(--space-3)] border-b border-hairline py-[var(--space-4)]"
        >
          <Skeleton className="size-12 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
