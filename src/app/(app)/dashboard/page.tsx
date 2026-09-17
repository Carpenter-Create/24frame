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
import {
  DashboardAdminHero,
  DashboardRecentActivity,
} from "@/components/dashboard/dashboard-admin-hero";
import {
  DashboardDeliveriesAction,
  DashboardFindingsGlance,
  DashboardPendingSubmissions,
  DashboardReportsCta,
  DashboardTopTitles,
  DashboardWhatChanged,
} from "@/components/dashboard/dashboard-modules";
import { DashboardRankedBars, DashboardTopPerforming } from "@/components/dashboard/dashboard-ranked";
import {
  DASHBOARD_PLATFORM_LIMIT,
  DASHBOARD_TERRITORY_LIMIT,
} from "@/lib/dashboard-register";
import { DashboardVisitStamp } from "@/components/dashboard/dashboard-visit-stamp";
import { DashboardFinanceGlance } from "@/components/dashboard/dashboard-finance-glance";
import {
  DASHBOARD_HOME,
  clientHomeSnapshot,
  dashboardWhatChanged,
  deliveriesNeedingAction,
  pendingSubmissions,
  topTitleActivity,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import {
  buildDashboardRevenueHero,
  dashboardPeriodOptionsFor,
  dashboardUserTitleIds,
  filterDashboardDeliveries,
  filterDashboardTitles,
  isoInDashboardPeriod,
  isCompanyAdminRole,
  parseDashboardPeriod,
  parseDashboardUserId,
  DASHBOARD_ACTIVITY_AUDIT_ACTIONS,
  DASHBOARD_ACTIVITY_AUDIT_ENTITIES,
  activityAuditEntityIds,
  applyActivityAudit,
  recentAccountActivity,
  revenuePointsFromLabels,
  type DashboardAuditEvent,
} from "@/lib/dashboard-admin";
import { buildLicensingStatus } from "@/lib/dashboard-licensing";
import { titleArtworkUrls } from "@/lib/artwork";
import {
  DASHBOARD_ADMIN_PAIR_CLASS,
  DASHBOARD_ADMIN_STACK_CLASS,
  DASHBOARD_STANDARD_STACK_CLASS,
} from "@/lib/dashboard-craft";
import {
  DASHBOARD_FIXTURE_PLATFORMS,
  DASHBOARD_FIXTURE_POINTS,
  DASHBOARD_FIXTURE_TERRITORIES,
  dashboardFixtureActivity,
  dashboardFixtureEnabled,
  dashboardFixtureSources,
  dashboardFixtureTopTitles,
} from "@/lib/dashboard-fixture";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import { GcClientsDirectory } from "@/app/(app)/(operator)/gc/clients/clients-directory";
import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { AGGREGATION_EMPTY } from "@/lib/aggregation-empty";
import { DASHBOARD_SEEN_COOKIE, afterLastVisit, parseDashboardSeen } from "@/lib/dashboard-visit";
import { countNamedRows, yearMonthFromIso } from "@/lib/reports";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";

// Company-admin `/dashboard` rematches Overview analytics structure inside
// house tokens: unlabeled period chrome, Net revenue $ + scrub, Licensing
// status, then one Top performing section (Titles / Platforms /
// Territories pills), then Recent account activity full-width. 24Frame
// nouns only — never Top works, sources, contributors, or Exports. Period
// is chrome, not H1 — dominant read is the $. Phone (`< md`) is a
// single-column stack — Net → Licensing → Top performing → Recent.
// Find-user is gone on phone and md+; user scope lives on /reports later.
// Leftover ?user= parsing stays inert for data only. Catalog-velocity
// strip is gone — Adam lock 2026-09-16. Company-admin also drops Recent
// (the old just-in module), Do next, Deliveries needing action, Catalog
// Health count, What changed, and Pending submissions. Top performing
// always renders — selected pill owns the full-width body (list default
// for Titles/Platforms; map default for Territories). Quiet empty, never
// omitted. Company-admin drops the All-time activity / Reports footer.
// Standard seats keep the catalog hero, platforms/territories pair, and
// Reports pointer.
// Export stays on /reports. Fixture money is labeled + env-gated and never
// enters export/ledger. Licensing never uses the money fixture.

type TitleRow = ClientHomeTitle & {
  created_by?: string | null;
  catalog_id?: string | null;
};

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
      .select("id, title, status, created_at, created_by, catalog_id")
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
  let useFixture = false;
  let adminUpdated: string | null = null;
  let adminActivity: ReturnType<typeof recentAccountActivity> = [];
  if (isAdmin) {
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
    useFixture =
      dashboardFixtureEnabled({ isGcStaff: ctx.isGcStaff, isCompanyAdmin: isAdmin }) &&
      !userId &&
      livePoints.length === 0;
    const points = useFixture ? DASHBOARD_FIXTURE_POINTS : livePoints;
    const monthSources = [
      ...titles
        .map((title) => yearMonthFromIso(title.created_at))
        .filter((row): row is { year: number; month: number } => row != null),
      ...deliveries.rows
        .map((row) => (row.updated_at ? yearMonthFromIso(row.updated_at) : null))
        .filter((row): row is { year: number; month: number } => row != null),
      ...points.map((point) => ({ year: point.year, month: point.month })),
      ...(useFixture ? dashboardFixtureSources() : []),
    ];
    const liveActivity = recentAccountActivity({
      titles,
      deliveries: deliveries.rows,
      findings: findings.rows,
      period,
      userId,
    });
    // Actor + exact time come from audit_log — created_by is not the action.
    const auditEntityIds = activityAuditEntityIds(liveActivity);
    let auditEvents: DashboardAuditEvent[] = [];
    if (auditEntityIds.length > 0) {
      const { data: auditRows } = await supabase
        .from("audit_log")
        .select("entity, entity_id, action, actor, at")
        .eq("org_id", org.id)
        .in("entity", [...DASHBOARD_ACTIVITY_AUDIT_ENTITIES])
        .in("action", [...DASHBOARD_ACTIVITY_AUDIT_ACTIONS])
        .in("entity_id", auditEntityIds)
        .order("at", { ascending: false })
        .range(...rangeFor(UNPAGINATED_MAX));
      auditEvents = auditRows ?? [];
    }
    const stampedActivity = applyActivityAudit(liveActivity, { events: auditEvents });
    const actorIds = [
      ...new Set(
        stampedActivity
          .map((row) => row.actorId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    let profileNames = new Map<string, string | null>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds);
      profileNames = new Map(
        (profiles ?? []).map((row) => [row.id, row.display_name]),
      );
    }
    const hydratedActivity = applyActivityAudit(liveActivity, {
      events: auditEvents,
      profileNames,
    });
    adminActivity =
      useFixture && hydratedActivity.length === 0
        ? dashboardFixtureActivity(period, now)
        : hydratedActivity;

    const licensingBase = buildLicensingStatus({
      titles,
      findings: findings.rows,
    });
    const artwork = await titleArtworkUrls(
      supabase,
      licensingBase.rows.map((row) => row.id),
    );
    const licensing = {
      ...licensingBase,
      rows: licensingBase.rows.map((row) => ({
        ...row,
        stillUrl: artwork.get(row.id)?.banner ?? null,
      })),
    };

    const revenueHero = buildDashboardRevenueHero({ period, points, userId });
    adminUpdated = revenueHero.updated;
    adminHero = (
      <DashboardAdminHero
        orgName={org.name}
        period={period}
        options={dashboardPeriodOptionsFor(period, now, monthSources)}
        hero={revenueHero}
        fixture={useFixture}
        licensing={licensing}
      />
    );
  }

  const liveTopTitles = topTitleActivity(scopedTitles, scopedDeliveries, now);
  const livePlatforms = countNamedRows(
    scopedDeliveries.map((row) => ({ name: row.vendor_name })),
  ).slice(0, isAdmin ? DASHBOARD_PLATFORM_LIMIT : 5);
  const liveTerritories = countNamedRows(
    scopedDeliveries.map((row) => ({ name: row.territory })),
  ).slice(0, isAdmin ? DASHBOARD_TERRITORY_LIMIT : 5);
  const adminPlatforms =
    useFixture && livePlatforms.length === 0 ? DASHBOARD_FIXTURE_PLATFORMS : livePlatforms;
  const adminTerritories =
    useFixture && liveTerritories.length === 0 ? DASHBOARD_FIXTURE_TERRITORIES : liveTerritories;
  const adminTopTitles =
    useFixture && liveTopTitles.length === 0 ? dashboardFixtureTopTitles(now) : liveTopTitles;

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
            <DashboardTopTitles items={liveTopTitles} />
          </div>
        </>
      )}

      <div
        data-dashboard-stack=""
        className={isAdmin ? DASHBOARD_ADMIN_STACK_CLASS : DASHBOARD_STANDARD_STACK_CLASS}
      >
        {isAdmin ? (
          <>
            <DashboardTopPerforming
              titles={adminTopTitles}
              platforms={adminPlatforms}
              territories={adminTerritories}
              periodLabel={period.label}
              updated={adminUpdated}
            />
            <DashboardRecentActivity items={adminActivity} />
          </>
        ) : (
          <div className={DASHBOARD_ADMIN_PAIR_CLASS}>
            <DashboardRankedBars
              label={DASHBOARD_HOME.platforms}
              empty={DASHBOARD_HOME.platformsEmpty}
              rows={livePlatforms}
              testId="platforms"
              viewAllHref="/deliveries"
            />
            <DashboardRankedBars
              label={DASHBOARD_HOME.territories}
              empty={DASHBOARD_HOME.territoriesEmpty}
              rows={liveTerritories}
              testId="territories"
              viewAllHref="/deliveries"
              territory
            />
          </div>
        )}
        {isAdmin ? null : (
          <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
            <DashboardJustIn
              titles={snapshot.justIn}
              catalogEmpty={snapshot.catalog === 0}
              canAddTitle={ctx.canOperate}
            />
            <DashboardDoNext items={snapshot.doNext} />
          </div>
        )}
        {isAdmin ? null : (
          <>
            <DashboardReportsCta />
            <DashboardDeliveriesAction rows={deliveriesNeedingAction(scopedDeliveries)} />
            <DashboardFindingsGlance count={snapshot.needsAttention} isPartial={snapshot.findingsIsPartial} />
            <DashboardWhatChanged firstVisit={lastVisitMs == null} rows={stackChanges} />
            <DashboardPendingSubmissions items={pendingSubmissions(scopedTitles)} />
          </>
        )}
      </div>
    </div>
  );
}
