import { clientHomeSnapshot, type ClientHomeFinding, type ClientHomeTitle } from "@/lib/dashboard-home";
import { countNamedRows, isoInReportsPeriod, type ReportsCountRow, type ReportsPeriod } from "@/lib/reports";

export type ReportsTitle = ClientHomeTitle & { created_by?: string | null };

export type ReportsDelivery = {
  delivery_id: string;
  title_id: string;
  title: string;
  vendor_name: string;
  territory: string;
  updated_at: string | null;
};

export function filterReportsTitles(
  titles: readonly ReportsTitle[],
  period: ReportsPeriod,
  userId: string | null,
): ReportsTitle[] {
  return titles.filter((title) => {
    if (userId && title.created_by !== userId) return false;
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

export function reportsHeroMetrics(input: {
  titles: readonly ReportsTitle[];
  findings: readonly ClientHomeFinding[];
  orgId: string;
  bound: number;
  findingsIsPartial: boolean;
}): {
  catalog: number;
  live: number;
  needsAttention: number;
  catalogIsPartial: boolean;
  findingsIsPartial: boolean;
} {
  const snap = clientHomeSnapshot({
    titles: input.titles,
    findings: input.findings,
    orgId: input.orgId,
    now: new Date(),
    bound: input.bound,
    findingsIsPartial: input.findingsIsPartial,
  });
  return {
    catalog: snap.catalog,
    live: snap.live,
    needsAttention: snap.needsAttention,
    catalogIsPartial: snap.catalogIsPartial,
    findingsIsPartial: snap.findingsIsPartial,
  };
}

export function reportsPlatformRows(deliveries: readonly ReportsDelivery[]): ReportsCountRow[] {
  return countNamedRows(deliveries.map((row) => ({ name: row.vendor_name })));
}

export function reportsTerritoryRows(deliveries: readonly ReportsDelivery[]): ReportsCountRow[] {
  return countNamedRows(deliveries.map((row) => ({ name: row.territory })));
}

export function reportsHasBody(input: {
  titles: readonly ReportsTitle[];
  deliveries: readonly ReportsDelivery[];
  hasMoney: boolean;
}): boolean {
  return input.titles.length > 0 || input.deliveries.length > 0 || input.hasMoney;
}
