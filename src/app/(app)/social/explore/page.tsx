import { Suspense } from "react";
import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { SocialExploreSkeleton } from "@/components/social/social-skeletons";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadExploreSearch } from "@/lib/social-feed";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

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
        <Suspense fallback={<SocialExploreSkeleton />}>
          <SocialExploreHits session={session} q={q} />
        </Suspense>
      ) : (
        <div data-social-explore-trending="">
          <HouseEmpty>{SOCIAL.explore.empty}</HouseEmpty>
        </div>
      )}
    </div>
  );
}

async function SocialExploreHits({ session, q }: { session: SocialSession; q: string }) {
  const results = await loadExploreSearch(session.supabase, q);
  const hits = results.hits;

  if (hits.length === 0) {
    return <HouseEmpty>{SOCIAL.explore.noResults}</HouseEmpty>;
  }

  return (
    <>
      {results.truncated ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-explore-truncated="">
          {SOCIAL.explore.truncated}
        </InlineNotice>
      ) : null}
      <ul data-social-explore-results="" className="flex flex-col gap-[var(--space-3)]">
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.id}`}>
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
