import { isCanonicalUuid } from "@/lib/title-public-id";
import type { OrgContext, OrgRole, OrgRow } from "@/lib/supabase/context";
import {
  AGGREGATION_ROOT,
  isEducationPath,
  isSocialPath,
  isStaffPath,
} from "@/lib/workspace";

// Staff view-as-client for Aggregation only. Cookie path is /aggregation
// so Social, Staff, Education, Home, and Settings never receive it.
// Server actions re-check gc_staff. Non-staff cookies are ignored.

export const AGGREGATION_VIEW_AS_COOKIE = "24frame_aggregation_view_as";
export const AGGREGATION_VIEW_AS_COOKIE_PATH = AGGREGATION_ROOT;

export const AGGREGATION_VIEW_AS = {
  banner: (orgName: string) => `Viewing as ${orgName}`,
  exit: "Exit",
  start: "View Aggregation",
  forbidden: "Not authorized.",
  missingOrg: "That rights holder was not found.",
  signedOut: "Not authenticated.",
  auditFailed: "Could not record this action. Try again.",
} as const;

export const AGGREGATION_VIEW_AS_AUDIT = {
  entity: "aggregation_impersonation",
  start: "start",
  end: "end",
} as const;

export const AGGREGATION_VIEW_AS_ROLE: OrgRole = "account_owner";

export const AGGREGATION_VIEW_AS_BANNER_CLASS =
  "mb-[var(--space-6)] flex flex-col gap-[var(--space-3)] rounded-[var(--radius-sm)] border border-hairline bg-surface-muted px-[var(--space-4)] py-[var(--space-3)] md:flex-row md:items-center md:justify-between";

export type AggregationViewAs = {
  orgId: string;
  orgName: string;
};

export function parseAggregationViewAsOrgId(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return isCanonicalUuid(trimmed) ? trimmed : null;
}

export function aggregationViewAsCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    // Portal session cookie (verify-otp) uses the same production Secure flag
    // so local http can still set the cookie.
    secure: process.env.NODE_ENV === "production",
    path: AGGREGATION_VIEW_AS_COOKIE_PATH,
  };
}

export function isClientAggregationPath(pathname: string): boolean {
  return pathname === AGGREGATION_ROOT || pathname.startsWith(`${AGGREGATION_ROOT}/`);
}

// View-as never applies to Social, Staff, or Education. Cookie path is the
// transport gate; this helper is the SoT tests lock.
export function aggregationViewAsAppliesToPath(pathname: string): boolean {
  if (isSocialPath(pathname) || isStaffPath(pathname) || isEducationPath(pathname)) {
    return false;
  }
  return isClientAggregationPath(pathname);
}

// View-as paints the client catalog via a synthetic owner role. That role is
// not membership: operate stays off, and staff delete/archive/restore stay off.
export function aggregationViewAsSurface(input: {
  viewAs: AggregationViewAs | null;
  canOperate: boolean;
  isGcStaff: boolean;
}): { canOperate: boolean; isStaff: boolean } {
  if (input.viewAs) return { canOperate: false, isStaff: false };
  return { canOperate: input.canOperate, isStaff: input.isGcStaff };
}

export function applyAggregationViewAs<
  T extends {
    rows: OrgContext["rows"];
    orgs: OrgContext["orgs"];
    activeOrg: OrgContext["activeOrg"];
    activeRole: OrgContext["activeRole"];
    canOperate: boolean;
    isGcStaff: boolean;
  },
>(base: T, viewAsOrg: OrgRow | null): T & { aggregationViewAs: AggregationViewAs | null } {
  if (!base.isGcStaff || !viewAsOrg) {
    return { ...base, aggregationViewAs: null };
  }
  return {
    ...base,
    rows: [{ role: AGGREGATION_VIEW_AS_ROLE, organizations: viewAsOrg }],
    orgs: [{ id: viewAsOrg.id, name: viewAsOrg.name }],
    activeOrg: viewAsOrg,
    activeRole: AGGREGATION_VIEW_AS_ROLE,
    canOperate: false,
    aggregationViewAs: { orgId: viewAsOrg.id, orgName: viewAsOrg.name },
  };
}

export function aggregationViewAsAuditRow(input: {
  actorId: string;
  orgId: string;
  orgName: string;
  action: "start" | "end";
}) {
  return {
    org_id: input.orgId,
    entity: AGGREGATION_VIEW_AS_AUDIT.entity,
    entity_id: input.orgId,
    action: input.action,
    actor: input.actorId,
    after: { org_id: input.orgId, org_name: input.orgName },
  };
}
