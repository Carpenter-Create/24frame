import { Suspense } from "react";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { SocialIcon } from "@/components/social/social-icon";
import { SocialMediaImage } from "@/components/social/social-media-image";
import { SocialExploreResultsSkeleton } from "@/components/social/social-skeletons";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import {
  SOCIAL_PROFILE_GRID_CLASS,
  SOCIAL_PROFILE_PLAY_CLASS,
  SOCIAL_PROFILE_TILE_CLASS,
} from "@/lib/social-chrome";
import { socialMediaProxiesByPostId } from "@/lib/social-edge";
import { SOCIAL_ICON_SIZE_PROFILE_PLAY } from "@/lib/social-icons";
import { SOCIAL_PROFILE_TILE_IMAGE_SIZES, socialVideoDisplaySrc } from "@/lib/social-media-display";
import { loadExploreMedia, loadExploreSearch, type SocialExploreHit } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

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
    <div data-social-explore="">
      <PageHeader title={SOCIAL.explore.title} subtitle={SOCIAL.explore.subtitle} />
      <form data-social-explore-search="" action={SOCIAL_ROUTES.explore} method="get" className="pb-[var(--space-6)]">
        <label className="sr-only" htmlFor="social-explore-q">
          {SOCIAL.explore.search}
        </label>
        <Input
          id="social-explore-q"
          name="q"
          defaultValue={q}
          placeholder={SOCIAL.explore.searchPlaceholder}
        />
      </form>
      {q ? (
        <Suspense fallback={<SocialExploreResultsSkeleton />}>
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

  if (results.hits.length === 0) {
    return (
      <div data-social-explore-trending="">
        <HouseEmpty>{SOCIAL.explore.empty}</HouseEmpty>
      </div>
    );
  }

  return (
    <div data-social-explore-trending="" data-social-explore-media="" className="flex flex-col gap-3">
      <SocialExploreHitList results={results} />
    </div>
  );
}

async function SocialExploreHits({ session, q }: { session: SocialSession; q: string }) {
  const profile = await ensureOwnSocialProfile(session.supabase, session.ctx.user);
  const results = await loadExploreSearch(session.supabase, q, {
    topics: profile?.topics ?? [],
    crafts: profile?.crafts ?? [],
  });

  if (results.hits.length === 0) {
    return <HouseEmpty>{SOCIAL.explore.noResults}</HouseEmpty>;
  }

  return <SocialExploreHitList results={results} />;
}

function SocialExploreHitList({
  results,
}: {
  results: Awaited<ReturnType<typeof loadExploreSearch>>;
}) {
  const mediaByPost = socialMediaProxiesByPostId(
    results.hits.map((hit) => ({ id: hit.id, author_id: hit.authorId, media: hit.media })),
  );
  const mediaHits = results.hits.filter((hit) => (mediaByPost.get(hit.id) ?? []).length > 0);
  const textHits = results.hits.filter((hit) => (mediaByPost.get(hit.id) ?? []).length === 0);

  return (
    <>
      {results.truncated ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-explore-truncated="">
          {SOCIAL.explore.truncated}
        </InlineNotice>
      ) : null}
      {mediaHits.length > 0 ? (
        <div data-social-explore-grid="" className={SOCIAL_PROFILE_GRID_CLASS}>
          {mediaHits.map((hit) => (
            <SocialExploreMediaTile key={hit.id} hit={hit} media={mediaByPost.get(hit.id) ?? []} />
          ))}
        </div>
      ) : null}
      {textHits.length > 0 ? (
        <ul data-social-explore-results="" className="flex flex-col gap-[var(--space-3)]">
          {textHits.map((hit) => (
            <li key={hit.id}>
              <span className="t-body font-medium text-ink">{hit.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function SocialExploreMediaTile({
  hit,
  media,
}: {
  hit: SocialExploreHit;
  media: { kind: "image" | "video"; url: string }[];
}) {
  const first = media[0];
  return (
    <article data-social-explore-tile={hit.id} className={SOCIAL_PROFILE_TILE_CLASS}>
      {first.kind === "video" ? (
        <video
          data-social-explore-video=""
          preload="metadata"
          src={socialVideoDisplaySrc(first.url)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div data-social-explore-image="" className="absolute inset-0">
          <SocialMediaImage src={first.url} sizes={SOCIAL_PROFILE_TILE_IMAGE_SIZES} />
        </div>
      )}
      {first.kind === "video" ? (
        <span data-social-profile-play="" className={SOCIAL_PROFILE_PLAY_CLASS}>
          <SocialIcon name="play" size={SOCIAL_ICON_SIZE_PROFILE_PLAY} active />
        </span>
      ) : null}
    </article>
  );
}
