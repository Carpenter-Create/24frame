import Link from "next/link";
import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadExploreSearch } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [ctx, sp] = await Promise.all([getOrgContext(), searchParams]);
  if (!ctx) redirect("/login");
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const supabase = await createClient();
  const results = q
    ? await loadExploreSearch(supabase, q)
    : { hits: [], truncated: false, peopleTruncated: false, postsTruncated: false };
  const hits = results.hits;

  return (
    <div data-social-explore="">
      <PageHeader title={SOCIAL.explore.title} subtitle={SOCIAL.explore.subtitle} />
      <form data-social-explore-search="" action={SOCIAL_ROUTES.explore} method="get" className="pb-[var(--space-6)]">
        <label className="sr-only" htmlFor="social-explore-q">
          {SOCIAL.explore.search}
        </label>
        <input
          id="social-explore-q"
          name="q"
          defaultValue={q}
          placeholder={SOCIAL.explore.searchPlaceholder}
          className="w-full rounded-[var(--radius)] border border-hairline bg-surface px-3 py-2 t-body text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
      </form>
      {q ? (
        hits.length === 0 ? (
          <HouseEmpty>{SOCIAL.explore.noResults}</HouseEmpty>
        ) : (
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
        )
      ) : (
        <div data-social-explore-trending="">
          <HouseEmpty>{SOCIAL.explore.empty}</HouseEmpty>
        </div>
      )}
    </div>
  );
}
