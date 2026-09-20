import { Suspense } from "react";
import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { SocialSuggestedPeople } from "@/components/social/social-for-you";
import { SocialExploreResultsSkeleton } from "@/components/social/social-skeletons";
import { SocialPersonRow } from "@/components/social/social-ui";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { loadExploreSearch, loadFolloweeIds, loadSuggestedPeople } from "@/lib/social-feed";
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
        <Suspense fallback={<SocialExploreResultsSkeleton />}>
          <SocialExploreHits session={session} q={q} />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <SocialExploreSuggested session={session} />
        </Suspense>
      )}
    </div>
  );
}

async function SocialExploreSuggested({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const followees = await loadFolloweeIds(supabase, ctx.user.id);
  const suggested = await loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]);
  const faces =
    suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();

  if (suggested.length === 0) {
    return (
      <div data-social-explore-trending="">
        <HouseEmpty>{SOCIAL.explore.empty}</HouseEmpty>
      </div>
    );
  }

  return (
    <div data-social-explore-trending="" data-social-explore-suggested="" className="flex flex-col gap-3">
      <SocialSuggestedPeople people={suggested} faces={faces} />
    </div>
  );
}

async function SocialExploreHits({ session, q }: { session: SocialSession; q: string }) {
  const results = await loadExploreSearch(session.supabase, q);
  const hits = results.hits;
  const personIds = hits.filter((hit) => hit.kind === "person").map((hit) => hit.id);
  const faces = personIds.length > 0 ? await signedAvatarUrls(personIds) : new Map();

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
            {hit.kind === "person" && hit.handle ? (
              <SocialPersonRow
                handle={hit.handle}
                displayName={hit.displayName}
                photoUrl={faces.get(hit.id)}
                href={hit.href}
              />
            ) : (
              <Link href={hit.href} className="flex flex-col gap-1">
                <span className="t-body font-medium text-ink">{hit.title}</span>
                {hit.subtitle ? <span className="t-body-sm text-ink-3">{hit.subtitle}</span> : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
