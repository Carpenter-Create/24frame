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
} from "@/lib/dashboard-home";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import { GcClientsDirectory } from "@/app/(app)/(operator)/gc/clients/clients-directory";
import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { AGGREGATION_EMPTY } from "@/lib/aggregation-empty";
import { DASHBOARD_SEEN_COOKIE, afterLastVisit, parseDashboardSeen } from "@/lib/dashboard-visit";
import { countNamedRows } from "@/lib/reports";

// Client `/dashboard` inhabits Overview visual space: hero metric + chart
// beside Top titles, then ranked bars, a territory card, and the locked
// module stack. Period, download, and user filter stay on /reports.
export default async function DashboardPage() {
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

  const [{ data: titleRows }, findings, deliveries] = await Promise.all([
    supabase
      .from("titles")
      .select("id, title, status, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .range(...rangeFor(UNPAGINATED_MAX)),
    loadMyFindings(supabase, { orgId: org.id }),
    loadMyDeliveries(supabase),
  ]);
  const titles = titleRows ?? [];
  const snapshot = clientHomeSnapshot({
    titles,
    findings: findings.rows,
    orgId: org.id,
    now,
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const createdAt = titles
    .map((title) => Date.parse(title.created_at))
    .filter((ms) => Number.isFinite(ms));
  const actionDeliveries = deliveriesNeedingAction(deliveries.rows);
  const pending = pendingSubmissions(titles);
  const platforms = countNamedRows(deliveries.rows.map((row) => ({ name: row.vendor_name }))).slice(0, 5);
  const territories = countNamedRows(deliveries.rows.map((row) => ({ name: row.territory }))).slice(0, 5);
  const changes = dashboardWhatChanged({
    titlesAdded: titles.filter((title) => afterLastVisit(title.created_at, lastVisitMs)).length,
    deliveriesUpdated: deliveries.rows.filter((row) => afterLastVisit(row.updated_at, lastVisitMs)).length,
    findingsOpened: findings.rows.filter((row) => afterLastVisit(row.created_at, lastVisitMs)).length,
  });

  return (
    <div className="dashboard-home flex flex-col gap-[var(--space-6)]" data-dashboard-home="">
      <DashboardVisitStamp nowIso={now.toISOString()} />
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
        <DashboardTopTitles items={topTitleActivity(titles, deliveries.rows, now)} />
      </div>

      <div className="flex flex-col gap-[var(--space-12)]">
        <DashboardAnalyticsOverview
          addedThisMonth={titlesAddedThisMonth(titles, now)}
          inPipeline={titlesInPipeline(titles)}
        />
        <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
          <DashboardRankedBars
            label={DASHBOARD_HOME.platforms}
            empty={DASHBOARD_HOME.platformsEmpty}
            rows={platforms}
            testId="platforms"
            viewAllHref="/deliveries"
          />
          <DashboardRankedBars
            label={DASHBOARD_HOME.territories}
            empty={DASHBOARD_HOME.territoriesEmpty}
            rows={territories}
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
        <DashboardDeliveriesAction rows={actionDeliveries} />
        <DashboardFindingsGlance count={snapshot.needsAttention} isPartial={snapshot.findingsIsPartial} />
        <DashboardWhatChanged firstVisit={lastVisitMs == null} rows={changes} />
        <DashboardPendingSubmissions items={pending} />
      </div>
    </div>
  );
}
