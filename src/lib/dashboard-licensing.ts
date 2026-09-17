import { DASHBOARD_HOME_STACK, type ClientHomeFinding, type ClientHomeTitle } from "@/lib/dashboard-home";
import { titleClientPath } from "@/lib/title-public-id";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import { catalogStillSrc } from "@/lib/titles-catalog";

// Company-admin `/dashboard` Licensing status. Maps existing title_status +
// Catalog Health findings — no new licensing-domain tables or Filmhub channel domain.
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
};

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

function rowMeta(
  required: readonly ClientHomeFinding[],
  recommended: readonly ClientHomeFinding[],
): string | null {
  for (const finding of [...required, ...recommended]) {
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

  for (const title of input.titles) {
    const findings = [...(findingsByTitle.get(title.id) ?? [])].sort(
      (a, b) => findingPriority(a) - findingPriority(b),
    );
    const required = findings.filter((finding) => isRequiredFinding(finding.severity));
    const recommended = findings.filter((finding) => isRecommendedFinding(finding.severity));
    const hasRequired = required.length > 0;
    // licensingBuckets always returns LicensingBucket[] — do not special-case
    // archived with `as const` (that narrows includes() to "needsAttention").
    // Archived is not Ready / In review; required findings still count as
    // Needs attention.
    const buckets = licensingBuckets(title.status, hasRequired);
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
      meta: rowMeta(required, recommended),
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

  return { ready, needsAttention, inReview, rows };
}
