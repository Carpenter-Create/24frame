import { isJustIn } from "@/lib/releases";
import { isoInReportsPeriod, parseReportsPeriod } from "@/lib/reports";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import { TITLES_CATALOG } from "@/lib/titles-catalog";

// Client `/dashboard` portfolio copy and snapshot derivation. Lives in lib/, not JSX.
// Identity on Dashboard is the real org name only — no status, role, or term line.
// Do not invent Access, upcoming, revenue, or a "stuck too long" metric.
// Empty-catalog CTA is the existing Titles Add Title action — do not invent a
// second control. Artwork-missing copy is a finding message, never invented here.

export const DASHBOARD_HOME = {
  justIn: "Recent",
  justInEmpty: "No titles added recently.",
  catalogEmpty: "The catalog is empty.",
  addTitle: TITLES_CATALOG.addTitle,
  addTitleHref: "/titles",
  catalogHealthCta: "Catalog Health",
  catalog: "Catalog",
  needsAttention: "Needs attention",
  live: "Live",
  doNext: "Do next",
  overview: "Overview",
  topTitles: "Top titles",
  topTitlesEmpty: "No title activity this month yet.",
  viewAll: "View all",
  viewList: "List",
  viewBars: "Bars",
  viewMap: "Map",
  // Kept as Bars — Overview view-alt noun. Do not revive "Chart".
  viewChart: "Bars",
  legendLow: "Low",
  legendHigh: "High",
  reportsCta: "Reports",
  reportsPointer: "All-time activity",
  hero: "Catalog activity",
  heroEmpty: "Catalog activity charts here as titles are added.",
  deliveriesAction: "Deliveries needing action",
  deliveriesActionEmpty: "No deliveries need action.",
  findingsGlance: "Catalog Health",
  findingsGlanceEmpty: "Nothing needs your attention right now.",
  findingsGlanceCta: "Open Catalog Health",
  platforms: "Top platforms",
  territories: "Top territories",
  platformsEmpty: "No platform activity yet.",
  territoriesEmpty: "No territory activity yet.",
  whatChanged: "What changed",
  whatChangedEmpty: "No changes since your last visit.",
  whatChangedFirst: "No prior visit to compare yet.",
  pending: "Pending submissions",
  pendingEmpty: "No pending submissions.",
} as const;

export const DASHBOARD_HOME_DO_NEXT = 5;
export const DASHBOARD_HOME_DRAFTS = DASHBOARD_HOME_DO_NEXT;
export const DASHBOARD_HOME_JUST_IN = 5;
export const DASHBOARD_HOME_TOP_TITLES = 5;
export const DASHBOARD_HOME_STACK = 5;

const PENDING_SUBMISSION_STATUSES = new Set(["submitted", "in_review"]);
const DELIVERY_ACTION_STATUSES = new Set(["pending", "rejected"]);

const JUST_IN_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export type ClientHomeTitle = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

// my_findings already returns message + severity. Home reuses that reason copy —
// never invents "Artwork missing" / "Metadata incomplete".
export type ClientHomeFinding = {
  org_id: string;
  entity_id: string;
  message?: string | null;
  severity?: string | null;
  created_at?: string | null;
};

export type ClientHomeDoNextItem = {
  id: string;
  title: string;
  reason: string | null;
  status: string;
};

export type ClientHomeJustInItem = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export type ClientHomeSnapshot = {
  catalog: number;
  catalogIsPartial: boolean;
  needsAttention: number;
  findingsIsPartial: boolean;
  live: number;
  doNext: ClientHomeDoNextItem[];
  justIn: ClientHomeJustInItem[];
};

/**
 * Visible floor when the title read hit the bound. `500+` means at least 500,
 * not a claimed total and not a trend. Live uses the same helper because it
 * is counted from that same bounded array.
 */
export function dashboardCatalogValue(count: number, isPartial: boolean): string {
  return isPartial ? `${count}+` : String(count);
}

export function dashboardJustInDate(iso: string): string {
  return JUST_IN_DATE.format(new Date(iso));
}

export function dashboardTitleStatusLabel(status: string): string | null {
  return Object.hasOwn(TITLE_STATUS_LABELS, status)
    ? TITLE_STATUS_LABELS[status as TitleStatus]
    : null;
}

function findingReason(items: ClientHomeFinding[]): string | null {
  const ranked = [...items].sort((a, b) => {
    const aHigh = a.severity === "high" ? 0 : 1;
    const bHigh = b.severity === "high" ? 0 : 1;
    return aHigh - bHigh;
  });
  for (const f of ranked) {
    const message = f.message?.trim();
    if (message) return message;
  }
  return null;
}

/**
 * Org-scoped client-home numbers and lists from the title rows and my_findings
 * already loaded for `/`. No extra SQL. Upcoming, revenue, and platform
 * placements are intentionally absent.
 */
export function clientHomeSnapshot({
  titles,
  findings,
  orgId,
  now,
  bound,
  findingsIsPartial = false,
}: {
  titles: ClientHomeTitle[];
  findings: ClientHomeFinding[];
  orgId: string;
  now: Date;
  bound: number;
  findingsIsPartial?: boolean;
}): ClientHomeSnapshot {
  const newestFirst = [...titles].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const titleById = new Map(newestFirst.map((t) => [t.id, t]));
  const orgFindings = findings.filter((f) => f.org_id === orgId);

  const findingsByTitle = new Map<string, ClientHomeFinding[]>();
  for (const f of orgFindings) {
    const list = findingsByTitle.get(f.entity_id) ?? [];
    list.push(f);
    findingsByTitle.set(f.entity_id, list);
  }

  const findingRows: ClientHomeDoNextItem[] = [...findingsByTitle.entries()]
    .flatMap(([entityId, items]) => {
      const title = titleById.get(entityId);
      if (!title) return [];
      return [
        {
          id: title.id,
          title: title.title,
          reason: findingReason(items),
          status: title.status,
        },
      ];
    })
    .sort((a, b) => {
      const aCreated = titleById.get(a.id)?.created_at ?? "";
      const bCreated = titleById.get(b.id)?.created_at ?? "";
      return aCreated < bCreated ? 1 : -1;
    });

  const seen = new Set(findingRows.map((row) => row.id));
  const draftRows: ClientHomeDoNextItem[] = newestFirst
    .filter((t) => t.status === "draft" && !seen.has(t.id))
    .map((t) => ({
      id: t.id,
      title: t.title,
      reason: null,
      status: t.status,
    }));

  const doNext = [...findingRows, ...draftRows].slice(0, DASHBOARD_HOME_DO_NEXT);

  return {
    catalog: titles.length,
    catalogIsPartial: titles.length >= bound,
    needsAttention: new Set(orgFindings.map((f) => f.entity_id)).size,
    findingsIsPartial,
    live: titles.filter((t) => t.status === "live").length,
    doNext,
    justIn: newestFirst
      .filter((t) => isJustIn(t.created_at, now))
      .slice(0, DASHBOARD_HOME_JUST_IN)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        created_at: t.created_at,
      })),
  };
}

/** Titles added this month, newest first. Recency is the activity — no invented rank. */
export function topTitlesThisMonth(
  titles: readonly ClientHomeTitle[],
  now: Date,
): ClientHomeJustInItem[] {
  const period = parseReportsPeriod("this-month", now);
  return [...titles]
    .filter((title) => isoInReportsPeriod(title.created_at, period))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, DASHBOARD_HOME_TOP_TITLES)
    .map((title) => ({
      id: title.id,
      title: title.title,
      status: title.status,
      created_at: title.created_at,
    }));
}

export type DashboardRankedTitle = ClientHomeJustInItem & { count: number };

/**
 * Side-panel Top titles. Delivery counts are a real magnitude when they
 * exist. Otherwise recency this month — no invented rank or money.
 */
export function topTitleActivity(
  titles: readonly ClientHomeTitle[],
  deliveries: readonly { title_id: string }[],
  now: Date,
): DashboardRankedTitle[] {
  const counts = new Map<string, number>();
  for (const row of deliveries) {
    counts.set(row.title_id, (counts.get(row.title_id) ?? 0) + 1);
  }
  const ranked = [...titles]
    .filter((title) => (counts.get(title.id) ?? 0) > 0)
    .sort((a, b) => {
      const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return a.created_at < b.created_at ? 1 : -1;
    })
    .slice(0, DASHBOARD_HOME_TOP_TITLES)
    .map((title) => ({
      id: title.id,
      title: title.title,
      status: title.status,
      created_at: title.created_at,
      count: counts.get(title.id) ?? 0,
    }));
  if (ranked.length > 0) return ranked;
  return topTitlesThisMonth(titles, now).map((title) => ({ ...title, count: 0 }));
}

/** Bar width from a real max. Zero max means no bar — never invent share. */
export function rankedBarPercent(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0;
  return Math.round((count / max) * 100);
}

export type DashboardDeliveryRow = {
  delivery_id: string;
  title_id: string;
  title: string;
  vendor_name: string;
  territory: string;
  status: string;
  updated_at: string | null;
};

export function deliveriesNeedingAction(
  rows: readonly DashboardDeliveryRow[],
): DashboardDeliveryRow[] {
  return rows
    .filter((row) => DELIVERY_ACTION_STATUSES.has(row.status))
    .sort((a, b) => (a.updated_at ?? "") < (b.updated_at ?? "") ? 1 : -1)
    .slice(0, DASHBOARD_HOME_STACK);
}

export function pendingSubmissions(titles: readonly ClientHomeTitle[]): ClientHomeJustInItem[] {
  return [...titles]
    .filter((title) => PENDING_SUBMISSION_STATUSES.has(title.status))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, DASHBOARD_HOME_STACK)
    .map((title) => ({
      id: title.id,
      title: title.title,
      status: title.status,
      created_at: title.created_at,
    }));
}

export type DashboardChangeRow = {
  key: "titles" | "deliveries" | "findings";
  label: string;
  count: number;
};

export function dashboardWhatChanged(input: {
  titlesAdded: number;
  deliveriesUpdated: number;
  findingsOpened: number;
}): DashboardChangeRow[] {
  const rows: DashboardChangeRow[] = [];
  if (input.titlesAdded > 0) {
    rows.push({
      key: "titles",
      label: input.titlesAdded === 1 ? "1 title added" : `${input.titlesAdded} titles added`,
      count: input.titlesAdded,
    });
  }
  if (input.deliveriesUpdated > 0) {
    rows.push({
      key: "deliveries",
      label:
        input.deliveriesUpdated === 1
          ? "1 delivery updated"
          : `${input.deliveriesUpdated} deliveries updated`,
      count: input.deliveriesUpdated,
    });
  }
  if (input.findingsOpened > 0) {
    rows.push({
      key: "findings",
      label:
        input.findingsOpened === 1
          ? "1 finding opened"
          : `${input.findingsOpened} findings opened`,
      count: input.findingsOpened,
    });
  }
  return rows;
}
