import { Suspense } from "react";
import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { SocialExploreResultsSkeleton } from "@/components/social/social-skeletons";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadExploreMedia, loadExploreSearch } from "@/lib/social-feed";
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
  return (
    <>
      {results.truncated ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-explore-truncated="">
          {SOCIAL.explore.truncated}
        </InlineNotice>
      ) : null}
      <ul data-social-explore-results="" className="flex flex-col gap-[var(--space-3)]">
        {results.hits.map((hit) => (
          <li key={hit.id}>
            <Link href={hit.href} className="flex flex-col gap-1">
              <span className="t-body font-medium text-ink">{hit.title}</span>
              {hit.subtitle ? <span className="t-body-sm text-ink-3">{hit.subtitle}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
