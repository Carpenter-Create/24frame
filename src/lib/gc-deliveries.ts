import { buildQuery } from "@/lib/catalog-view";
import {
  DELIVERY_STATUS_FILTERS,
  isCanonicalUuid,
  parseDeliveryStatusFilter,
  type DeliveryStatusFilter,
} from "@/lib/deliveries-browse";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";

// Staff /gc/deliveries — staff-wide Licensing Status (all titles / all orgs).
// Client nest copy stays on DASHBOARD_LICENSING. Href stays /gc/deliveries.
export const GC_LICENSING_STATUS = {
  title: "Licensing Status",
  intro: "Licensing status across all clients. Status is set by hand.",
  empty: "No licensing status yet.",
  actionLabel: "View titles",
  actionHref: "/titles",
  filterMiss: "No licensing status matches these filters.",
  showAll: "Show all",
  statusFilterLabel: "Filter by status",
  vendorFilterLabel: "Filter by vendor",
  vendorAll: "All",
} as const;

export const GC_DELIVERIES_EMPTY = {
  title: GC_LICENSING_STATUS.empty,
  actionLabel: GC_LICENSING_STATUS.actionLabel,
  actionHref: GC_LICENSING_STATUS.actionHref,
} as const;

export const GC_LICENSING_VENDOR_ALL = "all";

export { DELIVERY_STATUS_FILTERS, parseDeliveryStatusFilter };
export type { DeliveryStatusFilter };

export type GcLicensingVendor = { id: string; name: string };

type QueryValue = string | string[] | undefined;

export function parseGcLicensingVendorFilter(v: QueryValue): string | null {
  if (typeof v !== "string") return null;
  if (v === "" || v === GC_LICENSING_VENDOR_ALL) return null;
  if (!isCanonicalUuid(v)) return null;
  return v.toLowerCase();
}

export function gcLicensingHasFilters(
  status: DeliveryStatusFilter,
  vendor: string | null,
): boolean {
  return status !== "all" || vendor !== null;
}

export function buildGcLicensingQuery(opts: {
  status: DeliveryStatusFilter;
  vendor: string | null;
}): string {
  return buildQuery({
    status: opts.status === "all" ? undefined : opts.status,
    vendor: opts.vendor ?? undefined,
  });
}

export function gcLicensingHref(
  status: DeliveryStatusFilter,
  vendor: string | null,
): string {
  return `/gc/deliveries${buildGcLicensingQuery({ status, vendor })}`;
}

export function gcLicensingShowAllHref(): string {
  return gcLicensingHref("all", null);
}

export function gcLicensingVendorOptions(
  vendors: readonly GcLicensingVendor[],
): { key: string; label: string }[] {
  return [
    { key: GC_LICENSING_VENDOR_ALL, label: GC_LICENSING_STATUS.vendorAll },
    ...vendors.map((vendor) => ({ key: vendor.id, label: vendor.name })),
  ];
}

export function gcLicensingVendorLabel(
  vendor: string | null,
  vendors: readonly GcLicensingVendor[],
): string {
  if (!vendor) return GC_LICENSING_STATUS.vendorAll;
  return vendors.find((row) => row.id.toLowerCase() === vendor)?.name ?? GC_LICENSING_STATUS.vendorAll;
}

// Honesty copy when a companion list hits the probe cap. A short list that looks
// finished is the failure — same contract as the catalog truncation notice.
export const GC_DELIVERIES_TRUNCATED = {
  grants: `Showing the first ${UNPAGINATED_MAX} active grants. More exist — this list is not complete.`,
  companions:
    "Portal records for the deliveries on this page were cut off. Links, sessions, or the access log may be incomplete.",
} as const;
