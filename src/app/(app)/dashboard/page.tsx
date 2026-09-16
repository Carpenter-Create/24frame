import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import {
  DashboardDoNext,
  DashboardHomePillLink,
  DashboardJustIn,
  DashboardOrgIdentity,
} from "@/components/dashboard/dashboard-home";
import { DashboardCatalogHero } from "@/components/dashboard/dashboard-catalog-hero";
import { DashboardAdminHero } from "@/components/dashboard/dashboard-admin-hero";
import {
  DashboardAnalyticsOverview,
  DashboardDeliveriesAction,
  DashboardFindingsGlance,
  DashboardPendingSubmissions,
  DashboardReportsCta,
  DashboardTopTitles,
  DashboardWhatChanged,
} from "@/components/dashboard/dashboard-modules";
import { DashboardRankedBars } from "@/components/dashboard/dashboard-ranked";
import { DashboardVisitStamp } from "@/components/dashboard/dashboard-visit-stamp";
import { DashboardFinanceGlance } from "@/components/dashboard/dashboard-finance-glance";
import {
  DASHBOARD_HOME,
  clientHomeSnapshot,
  dashboardWhatChanged,
  deliveriesNeedingAction,
  pendingSubmissions,
  titlesAddedThisMonth,
  titlesInPipeline,
  topTitleActivity,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import {
  buildDashboardRevenueHero,
  dashboardPeriodOptionsFor,
  dashboardUserLabel,
  dashboardUserTitleIds,
  filterDashboardDeliveries,
  filterDashboardTitles,
  isoInDashboardPeriod,
  isCompanyAdminRole,
  parseDashboardPeriod,
  parseDashboardUserId,
  recentAccountActivity,
  revenuePointsFromLabels,
} from "@/lib/dashboard-admin";
import {
  DASHBOARD_FIXTURE_POINTS,
  dashboardFixtureEnabled,
} from "@/lib/dashboard-fixture";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import { GcClientsDirectory } from "@/app/(app)/(operator)/gc/clients/clients-directory";
import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { AGGREGATION_EMPTY } from "@/lib/aggregation-empty";
import { DASHBOARD_SEEN_COOKIE, afterLastVisit, parseDashboardSeen } from "@/lib/dashboard-visit";
import { countNamedRows, yearMonthFromIso } from "@/lib/reports";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";

// Company-admin `/dashboard` rematches RL Overview structure inside house
// tokens: period grains, MetricCard revenue + scrub, Recent activity.
// Standard seats keep the catalog hero. Export stays on /reports.
// Fixture money is labeled + env-gated and never enters export/ledger.

type TitleRow = ClientHomeTitle & { created_by?: string | null };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (ctx.rows.length === 0 || !ctx.activeOrg) {
    if (!ctx.isGcStaff) {
      return (
        <div data-aggregation-empty="" className="flex flex-col gap-[var(--space-4)]">
          <h1 className="t-section text-ink">{AGGREGATION_EMPTY.title}</h1>
          <HouseEmpty>{AGGREGATION_EMPTY.body}</HouseEmpty>
          <TextAction href={AGGREGATION_EMPTY.createHref}>{AGGREGATION_EMPTY.create}</TextAction>
        </div>
      );
    }
    const roster = await GcClientsDirectory();
    return (
      <div className="flex flex-col gap-[var(--space-6)]">
        <DashboardFinanceGlance />
        {roster}
      </div>
    );
  }
  const org = ctx.activeOrg;
  const now = new Date();
  const jar = await cookies();
  const lastVisitMs = parseDashboardSeen(jar.get(DASHBOARD_SEEN_COOKIE)?.value);
  const isAdmin = isCompanyAdminRole(ctx.activeRole);
  const sp = isAdmin
    ? await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>))
    : {};
  const period = parseDashboardPeriod(sp.period, now);
  const userId = isAdmin ? parseDashboardUserId(sp.user) : null;

  const [{ data: titleRows }, findings, deliveries] = await Promise.all([
    supabase
      .from("titles")
      .select("id, title, status, created_at, created_by")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .range(...rangeFor(UNPAGINATED_MAX)),
    loadMyFindings(supabase, { orgId: org.id }),
    loadMyDeliveries(supabase),
  ]);
  const titles = (titleRows ?? []) as TitleRow[];
  const titleIds = dashboardUserTitleIds(titles, userId);
  const scopedTitles = isAdmin ? filterDashboardTitles(titles, period, userId) : titles;
  const scopedDeliveries = isAdmin
    ? filterDashboardDeliveries(deliveries.rows, period, titleIds)
    : deliveries.rows;
  const scopedFindings = isAdmin
    ? findings.rows.filter((finding) => {
        if (titleIds && !titleIds.has(finding.entity_id)) return false;
        if (!finding.created_at) return period.kind === "all";
        return isoInDashboardPeriod(finding.created_at, period);
      })
    : findings.rows;

  const snapshot = clientHomeSnapshot({
    titles: scopedTitles,
    findings: scopedFindings,
    orgId: org.id,
    now,
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const createdAt = scopedTitles
    .map((title) => Date.parse(title.created_at))
    .filter((ms) => Number.isFinite(ms));
  const stackChanges = dashboardWhatChanged({
    titlesAdded: scopedTitles.filter((title) => afterLastVisit(title.created_at, lastVisitMs)).length,
    deliveriesUpdated: scopedDeliveries.filter((row) => afterLastVisit(row.updated_at, lastVisitMs)).length,
    findingsOpened: scopedFindings.filter((row) => afterLastVisit(row.created_at ?? null, lastVisitMs)).length,
  });

  let adminHero = null;
  if (isAdmin) {
    const memberships = await supabase
      .from("memberships")
      .select("user_id")
      .eq("org_id", org.id)
      .eq("status", "active")
      .range(...rangeFor(LIST_PAGE));
    const memberIds = [...new Set((memberships.data ?? []).map((row) => row.user_id))];
    const { data: profiles } =
      memberIds.length === 0
        ? { data: [] as { id: string; display_name: string; handle: string }[] }
        : await supabase.from("profiles").select("id, display_name, handle").in("id", memberIds);
    const users = (profiles ?? [])
      .map((profile) => {
        const label = dashboardUserLabel({ displayName: profile.display_name, handle: profile.handle });
        return label ? { id: profile.id, label } : null;
      })
      .filter((row): row is { id: string; label: string } => row != null);

    const canReadMoney = !userId && canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole });
    const moneyLoaded = canReadMoney ? await loadRecipientDashboard(org.id) : null;
    const money = moneyLoaded
      ? buildClientFinanceDashboard({
          orgId: org.id,
          clientRateBp: moneyLoaded.clientRateBp,
          periods: moneyLoaded.periods,
          ledger: moneyLoaded.ledger,
          latestStatement: moneyLoaded.latestStatement,
        })
      : null;
    const livePoints = revenuePointsFromLabels(money?.chart ?? []);
    const fixture =
      dashboardFixtureEnabled({ isGcStaff: ctx.isGcStaff, isCompanyAdmin: isAdmin }) &&
      !userId &&
      livePoints.length === 0;
    const points = fixture ? DASHBOARD_FIXTURE_POINTS : livePoints;
    const monthSources = [
      ...titles
        .map((title) => yearMonthFromIso(title.created_at))
        .filter((row): row is { year: number; month: number } => row != null),
      ...deliveries.rows
        .map((row) => (row.updated_at ? yearMonthFromIso(row.updated_at) : null))
        .filter((row): row is { year: number; month: number } => row != null),
      ...points.map((point) => ({ year: point.year, month: point.month })),
    ];
    adminHero = (
      <DashboardAdminHero
        orgName={org.name}
        period={period}
        options={dashboardPeriodOptionsFor(period, now, monthSources)}
        userId={userId}
        users={users}
        hero={buildDashboardRevenueHero({ period, points, userId })}
        fixture={fixture}
        activity={recentAccountActivity({
          titles,
          deliveries: deliveries.rows,
          findings: findings.rows,
          period,
          userId,
        })}
      />
    );
  }

  return (
    <div className="dashboard-home flex flex-col gap-[var(--space-6)]" data-dashboard-home="">
      <DashboardVisitStamp nowIso={now.toISOString()} />
      {adminHero ?? (
        <>
          <div className="flex flex-col gap-[var(--space-6)] sm:flex-row sm:items-center sm:justify-between">
            <DashboardOrgIdentity name={org.name} />
            <DashboardHomePillLink href="/catalog-health">
              {DASHBOARD_HOME.catalogHealthCta}
            </DashboardHomePillLink>
          </div>
          <div
            data-dashboard-overview-row=""
            className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <DashboardCatalogHero
                createdAt={createdAt}
                nowMs={now.getTime()}
                catalog={snapshot.catalog}
                catalogIsPartial={snapshot.catalogIsPartial}
                live={snapshot.live}
                liveIsPartial={snapshot.catalogIsPartial}
              />
            </div>
            <DashboardTopTitles items={topTitleActivity(scopedTitles, scopedDeliveries, now)} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-[var(--space-12)]">
        <DashboardAnalyticsOverview
          addedThisMonth={titlesAddedThisMonth(scopedTitles, now)}
          inPipeline={titlesInPipeline(scopedTitles)}
        />
        <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
          <DashboardRankedBars
            label={DASHBOARD_HOME.platforms}
            empty={DASHBOARD_HOME.platformsEmpty}
            rows={countNamedRows(scopedDeliveries.map((row) => ({ name: row.vendor_name }))).slice(0, 5)}
            testId="platforms"
            viewAllHref="/deliveries"
          />
          <DashboardRankedBars
            label={DASHBOARD_HOME.territories}
            empty={DASHBOARD_HOME.territoriesEmpty}
            rows={countNamedRows(scopedDeliveries.map((row) => ({ name: row.territory }))).slice(0, 5)}
            testId="territories"
            viewAllHref="/deliveries"
            territory
          />
        </div>
        <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
          <DashboardJustIn
            titles={snapshot.justIn}
            catalogEmpty={snapshot.catalog === 0}
            canAddTitle={ctx.canOperate}
          />
          <DashboardDoNext items={snapshot.doNext} />
        </div>
        <DashboardReportsCta />
        <DashboardDeliveriesAction rows={deliveriesNeedingAction(scopedDeliveries)} />
        <DashboardFindingsGlance count={snapshot.needsAttention} isPartial={snapshot.findingsIsPartial} />
        <DashboardWhatChanged firstVisit={lastVisitMs == null} rows={stackChanges} />
        <DashboardPendingSubmissions items={pendingSubmissions(scopedTitles)} />
      </div>
    </div>
  );
}
