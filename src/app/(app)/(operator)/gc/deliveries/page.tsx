import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusFilter } from "@/components/layout/status-filter";
import {
  GC_DELIVERIES_EMPTY,
  GC_DELIVERIES_TRUNCATED,
  GC_LICENSING_STATUS,
  DELIVERY_STATUS_FILTERS,
  gcLicensingHasFilters,
  gcLicensingHref,
  gcLicensingShowAllHref,
  parseDeliveryStatusFilter,
  parseGcLicensingVendorFilter,
} from "@/lib/gc-deliveries";
import {
  loadGcDeliveryCompanions,
  portalCompanionsTruncated,
  uniqueIds,
} from "@/lib/gc-deliveries-companions";
import { HOUSE_CARD_PAD, HOUSE_MODULE_CLASS, HOUSE_RELATED_GAP_CLASS } from "@/lib/house-shell";
import { cn } from "@/lib/cn";
import { DeliveryControls } from "./delivery-controls";
import { NewDeliveryForm } from "./new-delivery-form";
import { ExportPanel } from "./export-panel";
import { LicensingVendorFilter } from "./licensing-vendor-filter";
import { PortalLinks, type Master, type PortalLink, type PortalSession, type PortalAccessEvent } from "./portal-links";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";

export default async function GcDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  const statusFilter = parseDeliveryStatusFilter(sp.status);
  const vendorFilter = parseGcLicensingVendorFilter(sp.vendor);
  const supabase = await createClient();
  let deliveriesQuery = supabase
    .from("deliveries")
    .select("id, territory, status, vendor_id, title_id, titles(title, catalog_id), vendors(name), organizations(name)")
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

  // group deliveries → export options (endpoint → its titles)
  const byVendor = new Map<string, { id: string; name: string; titles: Map<string, string> }>();
  for (const d of list) {
    if (!d.vendors || !d.titles) continue;
    const v = byVendor.get(d.vendor_id) ?? { id: d.vendor_id, name: d.vendors.name, titles: new Map() };
    v.titles.set(d.title_id, `${d.titles.catalog_id ?? ""} · ${d.titles.title}`);
    byVendor.set(d.vendor_id, v);
  }
  const exportVendors = [...byVendor.values()].map((v) => ({
    id: v.id, name: v.name, titles: [...v.titles].map(([id, label]) => ({ id, label })),
  }));

  // Only APPROVED titles are deliverable (assembly line: review → approved → deliver).
  // A title reaches in_delivery only after GC approves it; live = already on ≥1 platform.
  const { data: titleRows } = await supabase
    .from("titles").select("id, title, catalog_id").in("status", ["in_delivery", "live"]).order("title").range(...rangeFor(UNPAGINATED_MAX));
  // Create-form vendors stay active-only. The licensing lens needs inactive
  // partners too — their rows still exist on this page after deactivation.
  const { data: vendorRows } = await supabase
    .from("vendors").select("id, name, active").order("name").range(...rangeFor(UNPAGINATED_MAX));
  // Companions were unbounded: PostgREST max_rows=1000 returned a short list that
  // looked finished. Class 2: IN the page/picker ids (already ≤200 / ≤500) + probe
  // so truncation is visible. Class 1 deliveries/titles/vendors bounds stay as-is.
  const companions = await loadGcDeliveryCompanions(supabase, {
    formTitleIds: uniqueIds((titleRows ?? []).map((t) => t.id)),
    pageTitleIds: uniqueIds(list.map((d) => d.title_id)),
    pageDeliveryIds: uniqueIds(list.map((d) => d.id)),
  });
  const titleOpts = (titleRows ?? []).map((t) => ({ id: t.id, label: `${t.catalog_id} · ${t.title}` }));
  const vendorOpts = (vendorRows ?? []).filter((v) => v.active).map((v) => ({ id: v.id, name: v.name }));
  const vendorFilterOpts = (vendorRows ?? []).map((v) => ({ id: v.id, name: v.name }));
  const grantsByTitle: Record<string, { id: string; label: string }[]> = {};
  for (const g of companions.grants.rows) {
    (grantsByTitle[g.title_id] ??= []).push({
      id: g.id,
      label: `${g.rights_type} · ${g.territory_mode}${g.territories?.length ? " " + g.territories.join(",") : ""}`,
    });
  }

  const mastersByTitle: Record<string, Master[]> = {};
  for (const a of companions.masters.rows) {
    (mastersByTitle[a.title_id] ??= []).push({
      id: a.id, original_filename: a.original_filename, bytes: a.bytes,
    });
  }

  const linksByDelivery: Record<string, PortalLink[]> = {};
  for (const l of companions.links.rows) {
    if (!l.delivery_id || !l.asset_id) continue; // master_download rows always set both
    (linksByDelivery[l.delivery_id] ??= []).push({
      id: l.id, asset_id: l.asset_id, expires_at: l.expires_at, revoked_at: l.revoked_at,
    });
  }

  const sessions: PortalSession[] = companions.sessions.rows;
  const eventsByLink: Record<string, PortalAccessEvent[]> = {};
  for (const e of companions.events.rows) {
    (eventsByLink[e.link_id] ??= []).push(e);
  }
  const grantsTruncated = companions.grants.truncated;
  const portalTruncated = portalCompanionsTruncated(companions);
  const filtered = gcLicensingHasFilters(statusFilter, vendorFilter);
  const emptyCopy = filtered ? GC_LICENSING_STATUS.filterMiss : GC_DELIVERIES_EMPTY.title;
  const emptyHref = filtered ? gcLicensingShowAllHref() : GC_DELIVERIES_EMPTY.actionHref;
  const emptyLabel = filtered ? GC_LICENSING_STATUS.showAll : GC_DELIVERIES_EMPTY.actionLabel;

  return (
    <div data-gc-licensing-status="">
      <h1 className="t-subhead text-ink pb-1">{GC_LICENSING_STATUS.title}</h1>
      <p className="t-body-sm text-ink-3 pb-6">{GC_LICENSING_STATUS.intro}</p>

      {grantsTruncated ? (
        <InlineNotice tone="info" className="mb-4" data-gc-deliveries-truncated="grants">
          {GC_DELIVERIES_TRUNCATED.grants}
        </InlineNotice>
      ) : null}

      <div className="mb-8 max-w-xl">
        <NewDeliveryForm titles={titleOpts} vendors={vendorOpts} grantsByTitle={grantsByTitle} />
      </div>

      <div className="mb-8 max-w-xl">
        <ExportPanel vendors={exportVendors} />
      </div>

      {portalTruncated ? (
        <InlineNotice tone="info" className="mb-4" data-gc-deliveries-truncated="companions">
          {GC_DELIVERIES_TRUNCATED.companions}
        </InlineNotice>
      ) : null}

      <div
        className={cn("flex flex-wrap items-center justify-between pb-4", HOUSE_RELATED_GAP_CLASS)}
        data-gc-licensing-filters=""
      >
        <StatusFilter
          current={statusFilter}
          options={DELIVERY_STATUS_FILTERS}
          hrefFor={(key) => gcLicensingHref(key, vendorFilter)}
        />
        <LicensingVendorFilter status={statusFilter} vendor={vendorFilter} vendors={vendorFilterOpts} />
      </div>

      {list.length === 0 ? (
        <div className={cn(HOUSE_MODULE_CLASS, HOUSE_CARD_PAD)} data-gc-licensing-empty="">
          <p className="t-body-sm text-ink-3">{emptyCopy}</p>
          <Link
            href={emptyHref}
            className="t-body-sm text-accent transition-colors hover:underline"
          >
            {emptyLabel}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((d) => {
            const links = linksByDelivery[d.id] ?? [];
            const events = links.flatMap((l) => eventsByLink[l.id] ?? []);
            return (
              <article key={d.id} className={HOUSE_MODULE_CLASS} data-gc-licensing-row={d.id}>
                <div className={cn(HOUSE_CARD_PAD, "flex flex-col gap-3")}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="t-body font-medium text-ink">{d.titles?.title ?? "—"}</span>
                      <span className="t-body-sm text-ink-3">
                        {d.titles?.catalog_id} · {d.vendors?.name} · {d.territory} · {d.organizations?.name}
                      </span>
                    </div>
                    <DeliveryControls deliveryId={d.id} status={d.status} />
                  </div>
                  <PortalLinks
                    deliveryId={d.id}
                    masters={mastersByTitle[d.title_id] ?? []}
                    links={links}
                    sessions={sessions}
                    events={events}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
