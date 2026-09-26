import Link from "next/link";
import { Suspense } from "react";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { SocialIcon } from "@/components/social/social-icon";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialStoryMuxThumb } from "@/components/social/social-story-mux-thumb";
import { SocialExploreGridSkeleton } from "@/components/social/social-skeletons";
import { SOCIAL, SOCIAL_ROUTES, socialPostHref } from "@/lib/social";
import {
  SOCIAL_EXPLORE_CELL_CLASS,
  SOCIAL_EXPLORE_CELL_MEDIA_CLASS,
  SOCIAL_EXPLORE_CHROME_CLASS,
  SOCIAL_EXPLORE_GRID_CLASS,
  SOCIAL_EXPLORE_PAGE_CLASS,
  SOCIAL_EXPLORE_STACK_CLASS,
  SOCIAL_HOME_CENTER_CLASS,
  SOCIAL_MOBILE_BLEED_CLASS,
} from "@/lib/social-chrome";
import { socialMediaProxiesByPostId, type SocialEdgeMediaItem } from "@/lib/social-edge";
import { socialFeedUsesCarousel } from "@/lib/social-feed-carousel";
import { SOCIAL_ICON_SIZE_EXPLORE_STACK, SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import { SOCIAL_EXPLORE_CELL_IMAGE_SIZES } from "@/lib/social-media-display";
import { loadExploreMedia, loadExploreSearch, type SocialExploreHit, type SocialExplorePage } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";
import { cn } from "@/lib/cn";

// Media discovery only. Trending and search share one grid.
// A cell opens the Home post at /social/p — caption-above, carousel,
// photo-scale immersive, and action align stay on SocialPostCard.
// docs/design-locks/social-explore-discovery-lock-v1.md
// Cites: social-mobile-full-bleed-lock-v1.md
//        social-feed-photo-scale-immersive-lock-v1.md
//        social-feed-text-media-caption-above-lock-v1.md
//        social-feed-multi-media-carousel-lock-v1.md
//        social-video-mux-only-lock-v1.md
//        social-home-post-actions-align-lock-v1.md

export const runtime = "edge";

export default async function SocialExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, sp] = await Promise.all([requireSocialSession(), searchParams]);
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  return (
    <div
      data-social-explore=""
      className={cn(SOCIAL_HOME_CENTER_CLASS, SOCIAL_EXPLORE_PAGE_CLASS, SOCIAL_MOBILE_BLEED_CLASS)}
    >
      <div className={SOCIAL_EXPLORE_CHROME_CLASS}>
        <PageHeader title={SOCIAL.explore.title} subtitle={SOCIAL.explore.subtitle} />
        <form data-social-explore-search="" action={SOCIAL_ROUTES.explore} method="get" className="pb-[var(--space-6)]">
          <label className="sr-only" htmlFor="social-explore-q">
            {SOCIAL.explore.search}
          </label>
          <div className="flex items-center gap-[var(--space-2)]">
            <Input
              id="social-explore-q"
              name="q"
              defaultValue={q}
              placeholder={SOCIAL.explore.searchPlaceholder}
              className="min-w-0 flex-1"
            />
            {q ? (
              <Link
                href={SOCIAL_ROUTES.explore}
                data-social-explore-clear=""
                aria-label={SOCIAL.explore.clearRecent}
                className="inline-flex size-10 shrink-0 items-center justify-center text-ink-2"
              >
                <SocialIcon name="x" size={SOCIAL_ICON_SIZE_HEADER} />
              </Link>
            ) : null}
          </div>
        </form>
      </div>
      {q ? (
        <Suspense fallback={<SocialExploreGridSkeleton />}>
          <SocialExploreHits session={session} q={q} />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <SocialExploreMedia session={session} />
        </Suspense>
      )}
    </div>
  );
}

async function SocialExploreMedia({ session }: { session: SocialSession }) {
  const profile = await ensureOwnSocialProfile(session.supabase, session.ctx.user);
  const results = await loadExploreMedia(session.supabase, {
    topics: profile?.topics ?? [],
    crafts: profile?.crafts ?? [],
  });
  return <SocialExploreHost key="explore-trending" results={results} mode="trending" />;
}

async function SocialExploreHits({ session, q }: { session: SocialSession; q: string }) {
  const profile = await ensureOwnSocialProfile(session.supabase, session.ctx.user);
  const results = await loadExploreSearch(session.supabase, q, {
    topics: profile?.topics ?? [],
    crafts: profile?.crafts ?? [],
  });
  return <SocialExploreHost key="explore-search" results={results} mode="search" />;
}

function SocialExploreHost({
  results,
  mode,
}: {
  results: SocialExplorePage;
  mode: "trending" | "search";
}) {
  const mediaByPost = socialMediaProxiesByPostId(
    results.hits.map((hit) => ({ id: hit.id, author_id: hit.authorId, media: hit.media })),
  );
  const mediaHits = results.hits.filter((hit) => (mediaByPost.get(hit.id) ?? []).length > 0);
  const empty = mode === "trending" ? SOCIAL.explore.empty : SOCIAL.explore.noResults;

  return (
    <div
      data-social-explore-trending={mode === "trending" ? "" : undefined}
      data-social-explore-query={mode === "search" ? "" : undefined}
    >
      {results.truncated ? (
        <div className={SOCIAL_EXPLORE_CHROME_CLASS}>
          <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-explore-truncated="">
            {SOCIAL.explore.truncated}
          </InlineNotice>
        </div>
      ) : null}
      {mediaHits.length === 0 ? (
        <div className={SOCIAL_EXPLORE_CHROME_CLASS}>
          <HouseEmpty>{empty}</HouseEmpty>
        </div>
      ) : (
        <div data-social-explore-grid="" data-social-explore-media="" className={SOCIAL_EXPLORE_GRID_CLASS}>
          {mediaHits.map((hit) => (
            <SocialExploreCell key={hit.id} hit={hit} media={mediaByPost.get(hit.id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function SocialExploreCell({
  hit,
  media,
}: {
  hit: SocialExploreHit;
  media: SocialEdgeMediaItem[];
}) {
  const first = media[0];
  if (!first) return null;
  const label = first.kind === "video" ? SOCIAL.post.viewVideo : SOCIAL.post.viewPhoto;
  return (
    <Link
      href={socialPostHref(hit.id)}
      data-social-explore-tile={hit.id}
      aria-label={label}
      className={SOCIAL_EXPLORE_CELL_CLASS}
    >
      {first.kind === "video" ? (
        first.playbackId ? (
          <SocialStoryMuxThumb
            playbackId={first.playbackId}
            playbackPolicy={first.playbackPolicy}
            url={first.url}
          />
        ) : (
          <span data-social-video-closed="" data-social-explore-video="" className="absolute inset-0" />
        )
      ) : (
        <span data-social-explore-image="" className="absolute inset-0">
          <SocialMediaImage
            src={first.url}
            sizes={SOCIAL_EXPLORE_CELL_IMAGE_SIZES}
            className={SOCIAL_EXPLORE_CELL_MEDIA_CLASS}
          />
        </span>
      )}
      {socialFeedUsesCarousel(media.length) ? (
        <span data-social-explore-stack="" className={SOCIAL_EXPLORE_STACK_CLASS}>
          <SocialIcon name="stack" size={SOCIAL_ICON_SIZE_EXPLORE_STACK} />
        </span>
      ) : null}
    </Link>
  );
}
