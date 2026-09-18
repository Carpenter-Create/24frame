import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { titleArtworkUrls } from "@/lib/artwork";
import { SearchField } from "@/components/layout/search-field";
import { StatusFilter } from "@/components/layout/status-filter";
import { InlineNotice } from "@/components/ui/inline-notice";
import { LicensingStatusList } from "@/components/licensing/licensing-status-list";
import {
  GC_DELIVERIES_EMPTY,
  GC_DELIVERIES_TRUNCATED,
  GC_LICENSING_STATUS,
  DELIVERY_STATUS_FILTERS,
  filterLicensingGroups,
  gcLicensingHasFilters,
  gcLicensingHref,
  gcLicensingShowAllHref,
  groupLicensingTitles,
  parseDeliveryStatusFilter,
  parseGcLicensingVendorFilter,
} from "@/lib/gc-deliveries";
import {
  loadGcDeliveryCompanions,
  uniqueIds,
} from "@/lib/gc-deliveries-companions";
import {
  TITLES_TITLE_DESKTOP_CLASS,
  TITLES_TITLE_MOBILE_CLASS,
  catalogSearchQuery,
} from "@/lib/titles-catalog";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";

import { LicensingStatusFilter } from "./licensing-status-filter";
import { LicensingVendorFilter } from "./licensing-vendor-filter";

export default async function GcDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  const q = catalogSearchQuery(sp.q);
  const statusFilter = parseDeliveryStatusFilter(sp.status);
  const vendorFilter = parseGcLicensingVendorFilter(sp.vendor);
  const supabase = await createClient();
  let deliveriesQuery = supabase
    .from("deliveries")
    .select(
      "id, territory, status, vendor_id, title_id, created_at, titles(title, catalog_id, release_date), vendors(name)",
    )
    .order("created_at", { ascending: false });
  if (statusFilter !== "all") {
    deliveriesQuery = deliveriesQuery.eq("status", statusFilter);
  }
  if (vendorFilter) {
    deliveriesQuery = deliveriesQuery.eq("vendor_id", vendorFilter);
  }
  const { data: deliveries } = await deliveriesQuery
    // BOUNDED — all orgs; the largest list in the app.
    .range(...rangeFor(LIST_PAGE));
  const list = deliveries ?? [];

  // Avails-sourced deliver pool: live (Approved) + in_delivery (ready).
  // Parent identity is the Titles catalog row, not a Licensing-only card.
  const { data: titleRows } = await supabase
    .from("titles")
    .select("id, title, catalog_id, release_date")
    .in("status", ["in_delivery", "live"])
    .order("title")
    .range(...rangeFor(UNPAGINATED_MAX));
  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("active", true)
    .order("name")
    .range(...rangeFor(UNPAGINATED_MAX));
  const companions = await loadGcDeliveryCompanions(supabase, {
    formTitleIds: uniqueIds((titleRows ?? []).map((t) => t.id)),
    pageTitleIds: [],
    pageDeliveryIds: [],
  });
  const vendorOpts = (vendorRows ?? []).map((v) => ({ id: v.id, name: v.name }));
  const titleIds = uniqueIds([
    ...list.map((d) => d.title_id),
    ...(titleRows ?? []).map((t) => t.id),
  ]);
  const artwork = await titleArtworkUrls(supabase, titleIds.slice(0, LIST_PAGE));
  const stills = new Map<string, string | null>();
  for (const id of titleIds) {
    stills.set(id, artwork.get(id)?.banner ?? null);
  }

  const groups = filterLicensingGroups(
    groupLicensingTitles({
      deliveries: list,
      titles: titleRows ?? [],
      stills,
    }),
    { q, status: statusFilter, vendor: vendorFilter },
  );

  const grantsTruncated = companions.grants.truncated;
  const filtered = gcLicensingHasFilters(statusFilter, vendorFilter) || q.trim() !== "";
  const emptyCopy = q.trim()
    ? GC_LICENSING_STATUS.searchMiss(q.trim())
    : filtered
      ? GC_LICENSING_STATUS.filterMiss
      : GC_DELIVERIES_EMPTY.title;
  const emptyHref = filtered ? gcLicensingShowAllHref() : GC_DELIVERIES_EMPTY.actionHref;
  const emptyLabel = filtered ? GC_LICENSING_STATUS.showAll : GC_DELIVERIES_EMPTY.actionLabel;

  return (
    <div data-gc-licensing-status="">
      <header className="flex flex-row items-center justify-between gap-[var(--space-2)] pb-[var(--space-4)]">
        <h1>
          <span className={TITLES_TITLE_MOBILE_CLASS}>{GC_LICENSING_STATUS.title}</span>
          <span className={TITLES_TITLE_DESKTOP_CLASS}>{GC_LICENSING_STATUS.title}</span>
        </h1>
      </header>

      {grantsTruncated ? (
        <InlineNotice tone="info" className="mb-4" data-gc-deliveries-truncated="grants">
          {GC_DELIVERIES_TRUNCATED.grants}
        </InlineNotice>
      ) : null}

      <div className="flex flex-col gap-[var(--space-4)] pb-[var(--space-4)]">
        <div data-gc-licensing-search="" className="w-full [&_input]:w-full [&_input]:sm:w-full">
          <Suspense>
            <SearchField placeholder={GC_LICENSING_STATUS.searchPlaceholder} />
          </Suspense>
        </div>
        <div
          className="flex flex-col gap-[var(--space-2)] md:flex-row md:flex-wrap md:items-center md:justify-between"
          data-gc-licensing-filters=""
        >
          <div className="hidden md:flex" data-gc-licensing-status-chips="">
            <StatusFilter
              current={statusFilter}
              options={DELIVERY_STATUS_FILTERS}
              hrefFor={(key) => gcLicensingHref(key, vendorFilter, q)}
            />
          </div>
          <LicensingStatusFilter status={statusFilter} vendor={vendorFilter} q={q} />
          <LicensingVendorFilter
            status={statusFilter}
            vendor={vendorFilter}
            vendors={vendorOpts}
            q={q}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div
          className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-4)]"
          data-gc-licensing-empty=""
        >
          <p className="t-body-sm text-ink-3">{emptyCopy}</p>
          <Link
            href={emptyHref}
            className="t-body-sm text-accent transition-colors hover:underline"
          >
            {emptyLabel}
          </Link>
        </div>
      ) : (
        <LicensingStatusList groups={groups} />
      )}
    </div>
  );
}
