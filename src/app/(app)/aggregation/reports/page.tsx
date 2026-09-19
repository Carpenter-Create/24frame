import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { HouseEmpty } from "@/components/chrome/house";
import { ReportsBody } from "@/components/reports/reports-shell";
import {
  buildDashboardRevenueHero,
  isCompanyAdminRole,
  revenuePointsFromLabels,
} from "@/lib/dashboard-admin";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries } from "@/lib/my-lists";
import {
  REPORTS_PAGE,
  parseReportsPeriod,
  parseReportsUserIds,
  reportsDownloadHref,
  reportsPeriodOptionsFor,
  reportsUserLabel,
  yearMonthFromIso,
} from "@/lib/reports";
import {
  REPORTS_FIXTURE_PLATFORMS,
  REPORTS_FIXTURE_POINTS,
  REPORTS_FIXTURE_USER_ROWS,
  reportsFixtureComposition,
  reportsFixtureEnabled,
  reportsFixtureSources,
  reportsFixtureTopTitles,
} from "@/lib/reports-fixture";
import {
  filterReportsDeliveries,
  filterReportsTitles,
  reportsCompositionRows,
  reportsDetailRows,
  reportsPlatformRows,
  reportsRankedTitles,
  reportsScopedTitleIds,
  reportsTerritoryRows,
  reportsUserRows,
} from "@/lib/reports-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  const now = new Date();
  const period = parseReportsPeriod(sp.period, now);
  const isAdmin = isCompanyAdminRole(ctx.activeRole);
  const userIds = isAdmin ? parseReportsUserIds(sp.user) : [];

  if (!ctx.activeOrg) {
    return (
      <div data-reports-page="" className="flex flex-col gap-[var(--space-4)]">
        <h1 className="t-title text-ink">{REPORTS_PAGE.title}</h1>
        <HouseEmpty>{REPORTS_PAGE.noOrg}</HouseEmpty>
      </div>
    );
  }

  const supabase = await createClient();
  const orgId = ctx.activeOrg.id;
  const canReadMoney =
    userIds.length === 0 && canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole });

  const [{ data: titleRows }, deliveries, memberships, moneyLoaded] = await Promise.all([
    supabase
      .from("titles")
      .select("id, title, status, created_at, created_by")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(...rangeFor(UNPAGINATED_MAX)),
    loadMyDeliveries(supabase),
    isAdmin
      ? supabase
          .from("memberships")
          .select("user_id")
          .eq("org_id", orgId)
          .eq("status", "active")
          .range(...rangeFor(LIST_PAGE))
      : Promise.resolve({ data: [] as { user_id: string }[] }),
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

  const scopedTitles = filterReportsTitles(titles, period, userIds);
  const scopedTitleIds = reportsScopedTitleIds(titles, userIds);
  const scopedDeliveries = filterReportsDeliveries(deliveries.rows, period, scopedTitleIds);
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
  const livePoints = revenuePointsFromLabels(money?.chart ?? []);
  const useFixture =
    reportsFixtureEnabled({ isGcStaff: ctx.isGcStaff, isCompanyAdmin: isAdmin }) &&
    userIds.length === 0 &&
    livePoints.length === 0;
  const points = useFixture ? REPORTS_FIXTURE_POINTS : livePoints;
  const hero = buildDashboardRevenueHero({
    period,
    points,
    userId: userIds[0] ?? null,
  });
  const livePlatforms = reportsPlatformRows(scopedDeliveries);
  const liveTerritories = reportsTerritoryRows(scopedDeliveries);
  const liveUsers = reportsUserRows(scopedTitles, users);
  const liveTitles = reportsRankedTitles(scopedTitles, scopedDeliveries, now);
  const platforms = useFixture && livePlatforms.length === 0 ? REPORTS_FIXTURE_PLATFORMS : livePlatforms;
  const userRows = useFixture && liveUsers.length === 0 ? REPORTS_FIXTURE_USER_ROWS : liveUsers;
  const titlesRanked = useFixture && liveTitles.length === 0 ? reportsFixtureTopTitles(now) : liveTitles;
  const territories = liveTerritories;
  const composition = reportsCompositionRows({
    contributions: !useFixture && userIds.length === 0 ? money?.latest?.contributions : undefined,
    platforms: useFixture && livePlatforms.length === 0 ? reportsFixtureComposition() : livePlatforms,
  });
  const detail = reportsDetailRows({
    titles: scopedTitles,
    deliveries: scopedDeliveries,
    users,
  });
  const months = reportsPeriodOptionsFor(period, now, [
    ...titles
      .map((title) => yearMonthFromIso(title.created_at))
      .filter((row): row is { year: number; month: number } => row != null),
    ...deliveries.rows
      .map((row) => (row.updated_at ? yearMonthFromIso(row.updated_at) : null))
      .filter((row): row is { year: number; month: number } => row != null),
    ...points.map((point) => ({ year: point.year, month: point.month })),
    ...(useFixture ? reportsFixtureSources() : []),
  ]);
  const downloadHref = reportsDownloadHref({
    period,
    periods: moneyLoaded?.periods ?? [],
  });

  return (
    <ReportsBody
      period={period}
      options={months}
      userIds={userIds}
      users={users}
      downloadHref={downloadHref}
      showUserScope={isAdmin}
      hero={hero}
      composition={composition}
      titles={titlesRanked}
      platforms={platforms}
      userRows={userRows}
      territories={territories}
      detail={detail}
      fixture={useFixture}
    />
  );
}
