import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { HouseEmpty } from "@/components/chrome/house";
import { ReportsControls } from "@/components/reports/reports-controls";
import { ReportsBody, ReportsEmpty } from "@/components/reports/reports-shell";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import {
  REPORTS_PAGE,
  availableReportMonths,
  parseReportsPeriod,
  parseReportsUserId,
  reportsDownloadHref,
  reportsUserLabel,
  yearMonthFromIso,
} from "@/lib/reports";
import { topTitlesThisMonth } from "@/lib/dashboard-home";
import {
  filterReportsDeliveries,
  filterReportsTitles,
  reportsHasBody,
  reportsHeroMetrics,
  reportsPlatformRows,
  reportsTerritoryRows,
} from "@/lib/reports-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const sp = await (searchParams ?? Promise.resolve({}));
  const now = new Date();
  const period = parseReportsPeriod(sp.period, now);
  const userId = parseReportsUserId(sp.user);

  if (!ctx.activeOrg) {
    return (
      <>
        <PageHeader title={REPORTS_PAGE.title} subtitle={REPORTS_PAGE.subtitle} />
        <HouseEmpty>{REPORTS_PAGE.noOrg}</HouseEmpty>
      </>
    );
  }

  const supabase = await createClient();
  const orgId = ctx.activeOrg.id;
  const canReadMoney =
    !userId && canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole });

  const [{ data: titleRows }, findings, deliveries, memberships, moneyLoaded] = await Promise.all([
    supabase
      .from("titles")
      .select("id, title, status, created_at, created_by")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(...rangeFor(UNPAGINATED_MAX)),
    loadMyFindings(supabase, { orgId }),
    loadMyDeliveries(supabase),
    supabase
      .from("memberships")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("status", "active")
      .range(...rangeFor(LIST_PAGE)),
    canReadMoney ? loadRecipientDashboard(orgId) : Promise.resolve(null),
  ]);

  const titles = titleRows ?? [];
  const memberIds = [...new Set((memberships.data ?? []).map((row) => row.user_id))];
  const { data: profiles } =
    memberIds.length === 0
      ? { data: [] as { id: string; display_name: string; handle: string }[] }
      : await supabase.from("profiles").select("id, display_name, handle").in("id", memberIds);
  const users = (profiles ?? [])
    .map((profile) => {
      const label = reportsUserLabel({ displayName: profile.display_name, handle: profile.handle });
      return label ? { id: profile.id, label } : null;
    })
    .filter((row): row is { id: string; label: string } => row != null);

  const scopedTitles = filterReportsTitles(titles, period, userId);
  const scopedTitleIds = userId ? new Set(scopedTitles.map((title) => title.id)) : null;
  const scopedDeliveries = filterReportsDeliveries(deliveries.rows, period, scopedTitleIds);
  const hero = reportsHeroMetrics({
    titles: scopedTitles,
    findings: findings.rows,
    orgId,
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const months = availableReportMonths([
    ...titles.map((title) => yearMonthFromIso(title.created_at)).filter((row): row is { year: number; month: number } => row != null),
    ...deliveries.rows
      .map((row) => (row.updated_at ? yearMonthFromIso(row.updated_at) : null))
      .filter((row): row is { year: number; month: number } => row != null),
    ...(moneyLoaded?.periods ?? []).map((row) => ({ year: row.period_year, month: row.period_month })),
  ]);
  const downloadHref = reportsDownloadHref({
    period,
    periods: moneyLoaded?.periods ?? [],
  });
  const money =
    moneyLoaded && canReadMoney
      ? buildClientFinanceDashboard({
          orgId,
          clientRateBp: moneyLoaded.clientRateBp,
          periods: moneyLoaded.periods,
          ledger: moneyLoaded.ledger,
          latestStatement: moneyLoaded.latestStatement,
        })
      : null;
  const hasMoney = Boolean(money && money.history.length > 0);
  const createdAt = scopedTitles
    .map((title) => Date.parse(title.created_at))
    .filter((ms) => Number.isFinite(ms));

  return (
    <>
      <PageHeader
        title={REPORTS_PAGE.title}
        subtitle={REPORTS_PAGE.subtitle}
        actions={
          <ReportsControls
            periodKey={period.key}
            months={months}
            userId={userId}
            users={users}
            downloadHref={downloadHref}
          />
        }
      />
      {reportsHasBody({ titles: scopedTitles, deliveries: scopedDeliveries, hasMoney }) ? (
        <ReportsBody
          createdAt={createdAt}
          nowMs={now.getTime()}
          catalog={hero.catalog}
          live={hero.live}
          needsAttention={hero.needsAttention}
          catalogIsPartial={hero.catalogIsPartial}
          findingsIsPartial={hero.findingsIsPartial}
          platforms={reportsPlatformRows(scopedDeliveries)}
          territories={reportsTerritoryRows(scopedDeliveries)}
          topTitles={topTitlesThisMonth(scopedTitles, now)}
          money={hasMoney ? money : null}
        />
      ) : (
        <ReportsEmpty />
      )}
    </>
  );
}
