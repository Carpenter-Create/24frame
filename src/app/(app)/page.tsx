import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import {
  DashboardDoNext,
  DashboardHomePillLink,
  DashboardJustIn,
  DashboardOrgIdentity,
  DashboardSnapshot,
} from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_HOME,
  clientHomeSnapshot,
  dashboardCatalogValue,
} from "@/lib/dashboard-home";
import { LIST_PAGE, UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyFindings } from "@/lib/my-lists";
import { GcClientsDirectory } from "@/app/(app)/(operator)/gc/clients/clients-directory";
import { HouseEmpty, TextAction } from "@/components/chrome/house";
import {
  DashboardClientFinanceGlance,
  DashboardFinanceGlance,
} from "@/components/dashboard/dashboard-finance-glance";
import { AGGREGATION_EMPTY } from "@/lib/aggregation-empty";
import { FINANCE_CLIENT_HREF, orgRoleCanViewFinancial } from "@/lib/finance";
import { buildClientFinanceGlance } from "@/lib/finance-glance";

// Client `/` is the organization-scoped portfolio: identity, three live numbers,
// what to do next (findings + drafts), and Recent. No chart, no revenue seam, no
// upcoming or platform-placement row. Catalog Health remains the full findings
// surface — the blue pill is the one filled action. An empty catalog reuses the
// existing Titles Add Title control as text, not a second button. Staff without
// a client org still see the GC-wide clients roster.
export default async function DashboardPage() {
  const supabase = await createClient();
  // Resolved once per request and shared with the layout above (React cache()).
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  // Client dashboard needs an org. A GC operator is not a client and must not be
  // given a manufactured one. Staff without a client org stay on `/` and see the
  // existing GC-wide clients roster. Queue stays the focused work queue at /queue.
  // Mapping C: a non-staff account with no org stays in the shell — empty
  // Aggregation with a path into existing onboarding. Do not bounce them to
  // company onboarding just to reach Social.
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

  // Portfolio reads for the active org (RLS-scoped; counts computed here).
  // BOUNDED. These feed portfolio counts, so a cap makes the numbers a floor rather than a
  // total once a catalog exceeds it. Phase 4 of the catalog-at-scale spec replaces the
  // count-in-JS with a DB aggregate, which is both correct and cheaper.
  const { data: titleRows } = await supabase
    .from("titles")
    .select("id, title, status, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .range(...rangeFor(UNPAGINATED_MAX));
  const titles = titleRows ?? [];

  const findings = await loadMyFindings(supabase, { orgId: org.id });
  const snapshot = clientHomeSnapshot({
    titles,
    findings: findings.rows,
    orgId: org.id,
    now: new Date(),
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const showClientGlance = !ctx.isGcStaff && orgRoleCanViewFinancial(ctx.activeRole);
  const [{ data: term }, { data: financePeriods }] = showClientGlance
    ? await Promise.all([
        supabase
          .from("contract_terms")
          .select("revenue_share_rate_bp")
          .eq("org_id", org.id)
          .is("effective_to", null)
          .order("effective_from", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("finance_periods")
          .select(
            "id, period_year, period_month, status, opening_balance_cents, closing_balance_cents, threshold_cents",
          )
          .eq("org_id", org.id)
          .order("period_year", { ascending: false })
          .order("period_month", { ascending: false })
          .range(...rangeFor(LIST_PAGE)),
      ])
    : [
        { data: null },
        { data: [] as never },
      ];
  const clientGlance = showClientGlance
    ? buildClientFinanceGlance({
        clientRateBp: term?.revenue_share_rate_bp ?? null,
        periods: financePeriods ?? [],
        financeHref: FINANCE_CLIENT_HREF,
      })
    : null;

  return (
    <div className="dashboard-home flex flex-col gap-[var(--space-6)]" data-dashboard-home="">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[var(--space-6)] sm:flex-row sm:items-center sm:justify-between">
          <DashboardOrgIdentity name={org.name} />
          <DashboardHomePillLink href="/catalog-health">
            {DASHBOARD_HOME.catalogHealthCta}
          </DashboardHomePillLink>
        </div>

        <DashboardSnapshot
          catalog={dashboardCatalogValue(snapshot.catalog, snapshot.catalogIsPartial)}
          needsAttention={dashboardCatalogValue(
            snapshot.needsAttention,
            snapshot.findingsIsPartial,
          )}
          live={dashboardCatalogValue(snapshot.live, snapshot.catalogIsPartial)}
        />
      </div>

      <div className="flex flex-col gap-[var(--space-8)]">
        <DashboardDoNext items={snapshot.doNext} />
        <DashboardJustIn
          titles={snapshot.justIn}
          catalogEmpty={snapshot.catalog === 0}
          canAddTitle={ctx.canOperate}
        />
        {ctx.isGcStaff ? (
          <DashboardFinanceGlance />
        ) : clientGlance ? (
          <DashboardClientFinanceGlance glance={clientGlance} />
        ) : null}
      </div>
    </div>
  );
}
