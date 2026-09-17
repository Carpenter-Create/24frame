import type { DeliveryBrowseRow } from "@/lib/deliveries-browse";
import { titleClientPath } from "@/lib/title-public-id";
import { catalogStillSrc } from "@/lib/titles-catalog";

// Company-admin `/dashboard` Licensing status. Nested title → endpoint
// composition from existing deliveries. No licensing_* tables, no Filmhub
// Licensed/Removed domain, no readiness buckets. View all → /titles.

export const DASHBOARD_LICENSING = {
  title: "Licensing status",
  empty: "No submissions yet.",
  viewAllHref: "/titles",
} as const;

export const DASHBOARD_LICENSING_TITLE_CAP = 3;

export type LicensingTitle = {
  id: string;
  title: string;
  catalog_id?: string | null;
};

export type LicensingEndpointRow = {
  deliveryId: string;
  endpoint: string;
  territory: string;
  status: string;
  updatedAt: string | null;
};

export type LicensingTitleGroup = {
  id: string;
  title: string;
  href: string;
  stillUrl: string | null;
  endpoints: LicensingEndpointRow[];
};

export type LicensingStatusSnapshot = {
  groups: LicensingTitleGroup[];
};

function deliveryRecency(row: DeliveryBrowseRow): string {
  return row.updated_at ?? "";
}

/**
 * Titles with at least one submitted endpoint, newest activity first.
 * Cap ~3 titles. Every endpoint on those titles is nested.
 */
export function buildLicensingStatus(input: {
  titles: readonly LicensingTitle[];
  deliveries: readonly DeliveryBrowseRow[];
  stills?: ReadonlyMap<string, string | null>;
}): LicensingStatusSnapshot {
  const titleById = new Map(input.titles.map((title) => [title.id, title]));
  const byTitle = new Map<string, DeliveryBrowseRow[]>();
  for (const row of input.deliveries) {
    if (!titleById.has(row.title_id)) continue;
    const list = byTitle.get(row.title_id) ?? [];
    list.push(row);
    byTitle.set(row.title_id, list);
  }

  const groups = [...byTitle.entries()]
    .map(([titleId, rows]) => {
      const title = titleById.get(titleId);
      if (!title) return null;
      const endpoints = [...rows]
        .sort((a, b) => (deliveryRecency(a) < deliveryRecency(b) ? 1 : -1))
        .map((row) => ({
          deliveryId: row.delivery_id,
          endpoint: row.vendor_name,
          territory: row.territory,
          status: row.status,
          updatedAt: row.updated_at,
        }));
      const latest = endpoints[0]?.updatedAt ?? "";
      return {
        latest,
        group: {
          id: title.id,
          title: title.title,
          href: titleClientPath(title.catalog_id),
          stillUrl: catalogStillSrc(input.stills?.get(title.id) ?? null),
          endpoints,
        } satisfies LicensingTitleGroup,
      };
    })
    .filter((row): row is { latest: string; group: LicensingTitleGroup } => row != null)
    .sort((a, b) => (a.latest < b.latest ? 1 : -1))
    .slice(0, DASHBOARD_LICENSING_TITLE_CAP)
    .map((row) => row.group);

  return { groups };
}
