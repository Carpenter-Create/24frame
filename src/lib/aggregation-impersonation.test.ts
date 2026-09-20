import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AGGREGATION_VIEW_AS,
  AGGREGATION_VIEW_AS_AUDIT,
  AGGREGATION_VIEW_AS_COOKIE,
  AGGREGATION_VIEW_AS_COOKIE_PATH,
  AGGREGATION_VIEW_AS_ROLE,
  aggregationViewAsAppliesToPath,
  aggregationViewAsAuditRow,
  aggregationViewAsCookieOptions,
  applyAggregationViewAs,
  isClientAggregationPath,
  parseAggregationViewAsOrgId,
} from "./aggregation-impersonation";

const ORG = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Acme Films",
  status: "active" as const,
};

const staffBase = {
  rows: [] as { role: typeof AGGREGATION_VIEW_AS_ROLE; organizations: typeof ORG }[],
  orgs: [] as { id: string; name: string }[],
  activeOrg: null as typeof ORG | null,
  activeRole: null as typeof AGGREGATION_VIEW_AS_ROLE | null,
  canOperate: false,
  isGcStaff: true,
};

describe("aggregation view-as cookie and copy", () => {
  it("names the Aggregation-only cookie and keeps copy calm", () => {
    expect(AGGREGATION_VIEW_AS_COOKIE).toBe("24frame_aggregation_view_as");
    expect(AGGREGATION_VIEW_AS_COOKIE_PATH).toBe("/aggregation");
    expect(aggregationViewAsCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/aggregation",
    });
    expect(aggregationViewAsCookieOptions().path).not.toBe("/");
    expect(aggregationViewAsCookieOptions().path).not.toBe("/social");
    expect(AGGREGATION_VIEW_AS.banner("Acme Films")).toBe("Viewing as Acme Films");
    expect(AGGREGATION_VIEW_AS.exit).toBe("Exit");
    expect(AGGREGATION_VIEW_AS.start).toBe("View Aggregation");
    expect(AGGREGATION_VIEW_AS.forbidden).toBe("Not authorized.");
  });

  it("accepts only a canonical org UUID", () => {
    expect(parseAggregationViewAsOrgId(ORG.id)).toBe(ORG.id);
    expect(parseAggregationViewAsOrgId(ORG.id.toUpperCase())).toBe(ORG.id);
    expect(parseAggregationViewAsOrgId("  " + ORG.id + "  ")).toBe(ORG.id);
    expect(parseAggregationViewAsOrgId("not-a-uuid")).toBeNull();
    expect(parseAggregationViewAsOrgId("")).toBeNull();
    expect(parseAggregationViewAsOrgId(undefined)).toBeNull();
  });
});

describe("aggregation view-as path isolation", () => {
  it("applies only to client Aggregation paths", () => {
    expect(isClientAggregationPath("/aggregation")).toBe(true);
    expect(isClientAggregationPath("/aggregation/dashboard")).toBe(true);
    expect(isClientAggregationPath("/aggregation/titles")).toBe(true);
    expect(aggregationViewAsAppliesToPath("/aggregation/dashboard")).toBe(true);
    expect(aggregationViewAsAppliesToPath("/aggregation/reports/p1")).toBe(true);
  });

  it("never applies to Social, Staff, Education, or Home", () => {
    expect(aggregationViewAsAppliesToPath("/social")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/social/dms")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/social/u/ada")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/staff/queue")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/staff/gc/clients")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/education")).toBe(false);
    expect(aggregationViewAsAppliesToPath("/home")).toBe(false);
    expect(isClientAggregationPath("/home")).toBe(false);
    expect(isClientAggregationPath("/social")).toBe(false);
  });
});

describe("applyAggregationViewAs", () => {
  it("scopes staff to the client org owner surface", () => {
    const next = applyAggregationViewAs(staffBase, ORG);
    expect(next.activeOrg).toEqual(ORG);
    expect(next.activeRole).toBe("account_owner");
    expect(next.canOperate).toBe(true);
    expect(next.isGcStaff).toBe(true);
    expect(next.aggregationViewAs).toEqual({ orgId: ORG.id, orgName: ORG.name });
    expect(next.rows).toEqual([{ role: "account_owner", organizations: ORG }]);
    expect(next.orgs).toEqual([{ id: ORG.id, name: ORG.name }]);
  });

  it("ignores a forged org when the caller is not staff", () => {
    const next = applyAggregationViewAs({ ...staffBase, isGcStaff: false }, ORG);
    expect(next.activeOrg).toBeNull();
    expect(next.aggregationViewAs).toBeNull();
    expect(next.canOperate).toBe(false);
  });

  it("leaves membership context alone when no view-as org loaded", () => {
    const next = applyAggregationViewAs(staffBase, null);
    expect(next).toMatchObject({
      activeOrg: null,
      aggregationViewAs: null,
      isGcStaff: true,
    });
  });
});

describe("aggregation view-as audit row", () => {
  it("records who, which org, and start or end — no mailbox", () => {
    const row = aggregationViewAsAuditRow({
      actorId: "staff-1",
      orgId: ORG.id,
      orgName: ORG.name,
      action: "start",
    });
    expect(row).toEqual({
      org_id: ORG.id,
      entity: AGGREGATION_VIEW_AS_AUDIT.entity,
      entity_id: ORG.id,
      action: "start",
      actor: "staff-1",
      after: { org_id: ORG.id, org_name: ORG.name },
    });
    expect(JSON.stringify(row)).not.toMatch(/@/);
    expect(
      aggregationViewAsAuditRow({
        actorId: "staff-1",
        orgId: ORG.id,
        orgName: ORG.name,
        action: "end",
      }).action,
    ).toBe("end");
  });
});

describe("view-as stays off Social sources", () => {
  it("does not import view-as start into Social routes or session", () => {
    const socialActions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    const socialLayout = readFileSync("src/app/(app)/social/layout.tsx", "utf8");
    const socialSession = readFileSync("src/lib/social-session.ts", "utf8");
    const dms = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
    for (const src of [socialActions, socialLayout, socialSession, dms]) {
      expect(src).not.toContain("startAggregationViewAs");
      expect(src).not.toContain("stopAggregationViewAs");
      expect(src).not.toContain("AGGREGATION_VIEW_AS_COOKIE");
      expect(src).not.toContain("aggregation-impersonation");
      expect(src).not.toContain("AggregationViewAsBanner");
    }
  });

  it("keeps the cookie path in the actions SoT", () => {
    const actions = readFileSync("src/app/(app)/aggregation/view-as-actions.ts", "utf8");
    const context = readFileSync("src/lib/supabase/context.ts", "utf8");
    expect(actions).toContain("aggregationViewAsCookieOptions");
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain('action: "start"');
    expect(actions).toContain('action: "end"');
    expect(actions).toContain("workspaceHome(\"staff\")");
    expect(context).toContain("AGGREGATION_VIEW_AS_COOKIE");
    expect(context).toContain("applyAggregationViewAs");
    expect(context).toContain("isGcStaff");
  });
});
