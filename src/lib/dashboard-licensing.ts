import {
  DASHBOARD_HOME_STACK,
  dashboardCatalogValue,
  type ClientHomeFinding,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import { titleClientPath } from "@/lib/title-public-id";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import { catalogStillSrc } from "@/lib/titles-catalog";

// Company-admin `/dashboard` Licensing status. Maps existing title_status +
// Catalog Health findings — no licensing_* tables or Filmhub channel domain.
// Ready = live minus open required findings. In review = submitted |
// in_review | in_delivery. Needs attention = titles with open required
// findings (required-only for counts; recommended may appear as row meta).

export const DASHBOARD_LICENSING = {
  title: "Licensing status",
  ready: "Ready",
  needsAttention: "Needs attention",
  inReview: "In review",
  empty: "No titles to show.",
  viewAllHref: "/catalog-health",
} as const;

export const LICENSING_IN_REVIEW_STATUSES = ["submitted", "in_review", "in_delivery"] as const;

const IN_REVIEW = new Set<string>(LICENSING_IN_REVIEW_STATUSES);

export type LicensingBucket = "ready" | "needsAttention" | "inReview";

export type LicensingTitle = ClientHomeTitle & {
  catalog_id?: string | null;
};

export type LicensingRow = {
  id: string;
  title: string;
  href: string;
  status: string;
  statusLabel: string;
  stillUrl: string | null;
  meta: string | null;
  buckets: readonly LicensingBucket[];
};

export type LicensingStatusSnapshot = {
  ready: number;
  needsAttention: number;
  inReview: number;
  rows: LicensingRow[];
  findingsIsPartial?: boolean;
  titlesIsPartial?: boolean;
};

export function licensingCountValue(
  count: number,
  key: LicensingBucket,
  snapshot: Pick<LicensingStatusSnapshot, "findingsIsPartial" | "titlesIsPartial">,
): string {
  const titlesPartial = Boolean(snapshot.titlesIsPartial);
  const findingsPartial = Boolean(snapshot.findingsIsPartial);
  if (key === "inReview") return dashboardCatalogValue(count, titlesPartial);
  return dashboardCatalogValue(count, findingsPartial || titlesPartial);
}

export function isRequiredFinding(severity: string | null | undefined): boolean {
  return severity === "high";
}

export function isRecommendedFinding(severity: string | null | undefined): boolean {
  return severity === "low";
}

export function isLicensingInReview(status: string): boolean {
  return IN_REVIEW.has(status);
}

export function isLicensingReady(status: string, hasRequiredFinding: boolean): boolean {
  return status === "live" && !hasRequiredFinding;
}

export function licensingBuckets(status: string, hasRequiredFinding: boolean): LicensingBucket[] {
  const buckets: LicensingBucket[] = [];
  if (isLicensingReady(status, hasRequiredFinding)) buckets.push("ready");
  if (hasRequiredFinding) buckets.push("needsAttention");
  if (isLicensingInReview(status)) buckets.push("inReview");
  return buckets;
}

function findingPriority(finding: ClientHomeFinding): number {
  if (isRequiredFinding(finding.severity)) return 0;
  if (isRecommendedFinding(finding.severity)) return 1;
  return 2;
}

function rowMeta(recommended: readonly ClientHomeFinding[]): string | null {
  for (const finding of recommended) {
    const message = finding.message?.trim();
    if (message) return message;
  }
  return null;
}

function statusLabel(status: string): string {
  return Object.hasOwn(TITLE_STATUS_LABELS, status)
    ? TITLE_STATUS_LABELS[status as TitleStatus]
    : status;
}

function rowRank(buckets: readonly LicensingBucket[]): number {
  if (buckets.includes("needsAttention")) return 0;
  if (buckets.includes("inReview")) return 1;
  if (buckets.includes("ready")) return 2;
  return 3;
}

/**
 * Org-wide catalog truth — not period-scoped. Counts are titles, not findings.
 * Recommended findings never increment Needs attention.
 */
export function buildLicensingStatus(input: {
  titles: readonly LicensingTitle[];
  findings: readonly ClientHomeFinding[];
  stills?: ReadonlyMap<string, string | null>;
  findingsIsPartial?: boolean;
  titlesIsPartial?: boolean;
}): LicensingStatusSnapshot {
  const findingsByTitle = new Map<string, ClientHomeFinding[]>();
  for (const finding of input.findings) {
    const list = findingsByTitle.get(finding.entity_id) ?? [];
    list.push(finding);
    findingsByTitle.set(finding.entity_id, list);
  }

  let ready = 0;
  let needsAttention = 0;
  let inReview = 0;
  const candidates: LicensingRow[] = [];
  const findingsIsPartial = Boolean(input.findingsIsPartial);
  const titlesIsPartial = Boolean(input.titlesIsPartial);

  for (const title of input.titles) {
    const findings = [...(findingsByTitle.get(title.id) ?? [])].sort(
      (a, b) => findingPriority(a) - findingPriority(b),
    );
    const required = findings.filter((finding) => isRequiredFinding(finding.severity));
    const recommended = findings.filter((finding) => isRecommendedFinding(finding.severity));
    const hasRequired = required.length > 0;
    // Archived is not Ready / In review. Required findings still count as
    // Needs attention — Catalog Health owns that queue.
    // Absence in a truncated findings window is not "no required finding".
    const buckets: LicensingBucket[] =
      title.status === "archived"
        ? hasRequired
          ? ["needsAttention"]
          : []
        : licensingBuckets(title.status, hasRequired).filter(
            (bucket) => !(findingsIsPartial && bucket === "ready"),
          );
    if (buckets.includes("ready")) ready += 1;
    if (buckets.includes("needsAttention")) needsAttention += 1;
    if (buckets.includes("inReview")) inReview += 1;
    if (buckets.length === 0) continue;
    candidates.push({
      id: title.id,
      title: title.title,
      href: titleClientPath(title.catalog_id),
      status: title.status,
      statusLabel: statusLabel(title.status),
      stillUrl: catalogStillSrc(input.stills?.get(title.id) ?? null),
      meta: rowMeta(recommended),
      buckets,
    });
  }

  const rows = candidates
    .sort((a, b) => {
      const rank = rowRank(a.buckets) - rowRank(b.buckets);
      if (rank !== 0) return rank;
      const aCreated = input.titles.find((title) => title.id === a.id)?.created_at ?? "";
      const bCreated = input.titles.find((title) => title.id === b.id)?.created_at ?? "";
      return aCreated < bCreated ? 1 : -1;
    })
    .slice(0, DASHBOARD_HOME_STACK);

  return { ready, needsAttention, inReview, rows, findingsIsPartial, titlesIsPartial };
}
