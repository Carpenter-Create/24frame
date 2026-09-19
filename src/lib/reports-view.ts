import {
  dashboardTitleStatusLabel,
  DASHBOARD_HOME_TOP_TITLES,
  topTitleActivity,
  type ClientHomeJustInItem,
  type ClientHomeTitle,
  type DashboardRankedTitle,
} from "@/lib/dashboard-home";
import {
  countNamedRows,
  isoInReportsPeriod,
  type ReportsCountRow,
  type ReportsPeriod,
  type ReportsUserOption,
} from "@/lib/reports";
import { TITLES_HREF } from "@/lib/title-public-id";
import { DELIVERY_STATUS_ROW_LABELS, type DeliveryStatus } from "@/lib/titles";

export type ReportsTitle = ClientHomeTitle & { created_by?: string | null };

export type ReportsDelivery = {
  delivery_id: string;
  title_id: string;
  title: string;
  vendor_name: string;
  territory: string;
  updated_at: string | null;
  status?: string;
};

export type ReportsDetailRow = {
  id: string;
  title: string;
  href: string;
  user: string | null;
  status: string | null;
  deliveries: number;
  lastAt: string | null;
};

export type ReportsCompositionRow = {
  name: string;
  count: number;
  cents: number | null;
};

function normalizeUserIds(userIds: string | readonly string[] | null | undefined): string[] {
  if (!userIds) return [];
  return typeof userIds === "string" ? [userIds] : [...userIds];
}

export function filterReportsTitles(
  titles: readonly ReportsTitle[],
  period: ReportsPeriod,
  userIds: string | readonly string[] | null,
): ReportsTitle[] {
  const scope = normalizeUserIds(userIds);
  return titles.filter((title) => {
    if (scope.length > 0 && (!title.created_by || !scope.includes(title.created_by))) return false;
    return isoInReportsPeriod(title.created_at, period);
  });
}

export function filterReportsDeliveries(
  deliveries: readonly ReportsDelivery[],
  period: ReportsPeriod,
  titleIds: ReadonlySet<string> | null,
): ReportsDelivery[] {
  return deliveries.filter((row) => {
    if (titleIds && !titleIds.has(row.title_id)) return false;
    if (!row.updated_at) return period.kind === "all";
    return isoInReportsPeriod(row.updated_at, period);
  });
}

export function reportsScopedTitleIds(
  titles: readonly ReportsTitle[],
  userIds: string | readonly string[] | null,
): Set<string> | null {
  const scope = normalizeUserIds(userIds);
  if (scope.length === 0) return null;
  return new Set(
    titles.filter((title) => title.created_by && scope.includes(title.created_by)).map((title) => title.id),
  );
}

export function reportsPlatformRows(deliveries: readonly ReportsDelivery[]): ReportsCountRow[] {
  return countNamedRows(deliveries.map((row) => ({ name: row.vendor_name })));
}

export function reportsTerritoryRows(deliveries: readonly ReportsDelivery[]): ReportsCountRow[] {
  return countNamedRows(deliveries.map((row) => ({ name: row.territory })));
}

export function reportsStatusRows(titles: readonly ReportsTitle[]): ReportsCountRow[] {
  return countNamedRows(
    titles.flatMap((title) => {
      const name = dashboardTitleStatusLabel(title.status);
      return name ? [{ name }] : [];
    }),
  );
}

export function reportsDeliveryStatusRows(deliveries: readonly ReportsDelivery[]): ReportsCountRow[] {
  return countNamedRows(
    deliveries.flatMap((row) => {
      if (!row.status || !Object.hasOwn(DELIVERY_STATUS_ROW_LABELS, row.status)) return [];
      return [{ name: DELIVERY_STATUS_ROW_LABELS[row.status as DeliveryStatus] }];
    }),
  );
}

export function reportsUserRows(
  titles: readonly ReportsTitle[],
  users: readonly ReportsUserOption[],
): ReportsCountRow[] {
  const labels = new Map(users.map((user) => [user.id, user.label]));
  return countNamedRows(
    titles.flatMap((title) => {
      if (!title.created_by) return [];
      const name = labels.get(title.created_by);
      return name ? [{ name }] : [];
    }),
  );
}

export function reportsCompositionRows(input: {
  contributions?: readonly { titleName: string; clientShareCents: number }[];
  platforms: readonly ReportsCountRow[];
}): ReportsCompositionRow[] {
  const contributions = input.contributions ?? [];
  if (contributions.length > 0) {
    return [...contributions]
      .sort((a, b) => b.clientShareCents - a.clientShareCents || a.titleName.localeCompare(b.titleName))
      .slice(0, DASHBOARD_HOME_TOP_TITLES)
      .map((row) => ({
        name: row.titleName,
        count: 1,
        cents: row.clientShareCents,
      }));
  }
  return input.platforms.slice(0, DASHBOARD_HOME_TOP_TITLES).map((row) => ({
    name: row.name,
    count: row.count,
    cents: null,
  }));
}

/** Newest titles already scoped to the selected period. Recency only — no invented rank. */
export function topReportsTitles(titles: readonly ReportsTitle[]): ClientHomeJustInItem[] {
  return [...titles]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, DASHBOARD_HOME_TOP_TITLES)
    .map((title) => ({
      id: title.id,
      title: title.title,
      status: title.status,
      created_at: title.created_at,
    }));
}

export function reportsRankedTitles(
  titles: readonly ReportsTitle[],
  deliveries: readonly ReportsDelivery[],
  now: Date,
): DashboardRankedTitle[] {
  return topTitleActivity(titles, deliveries, now);
}

export function reportsDetailRows(input: {
  titles: readonly ReportsTitle[];
  deliveries: readonly ReportsDelivery[];
  users: readonly ReportsUserOption[];
}): ReportsDetailRow[] {
  const labels = new Map(input.users.map((user) => [user.id, user.label]));
  const deliveryCounts = new Map<string, number>();
  const lastAt = new Map<string, string>();
  for (const row of input.deliveries) {
    deliveryCounts.set(row.title_id, (deliveryCounts.get(row.title_id) ?? 0) + 1);
    if (row.updated_at) {
      const prev = lastAt.get(row.title_id);
      if (!prev || prev < row.updated_at) lastAt.set(row.title_id, row.updated_at);
    }
  }
  return [...input.titles]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((title) => ({
      id: title.id,
      title: title.title,
      href: `${TITLES_HREF}/${title.id}`,
      user: title.created_by ? labels.get(title.created_by) ?? null : null,
      status: dashboardTitleStatusLabel(title.status),
      deliveries: deliveryCounts.get(title.id) ?? 0,
      lastAt: lastAt.get(title.id) ?? title.created_at,
    }));
}

export function reportsHasBody(input: {
  titles: readonly ReportsTitle[];
  deliveries: readonly ReportsDelivery[];
  hasMoney: boolean;
}): boolean {
  return input.titles.length > 0 || input.deliveries.length > 0 || input.hasMoney;
}
