import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  ORG_TEAM,
  ORG_TEAM_ROLES,
  ORG_TEAM_STATUSES,
  ORG_TEAM_STATUS_DEFAULT,
  isOrgTeamLastOwnerError,
  isOrgTeamUserNotFoundError,
  orgTeamInviteSchema,
  orgTeamPersonLabel,
  orgTeamUpdateSchema,
  orgTeamWriteError,
} from "./org-team";

describe("org team contract", () => {
  it("uses the live org_role and membership_status values", () => {
    expect(ORG_TEAM_ROLES).toEqual([
      "account_owner",
      "accountant",
      "legal",
      "delivery_ops",
      "viewer",
    ]);
    expect(ORG_TEAM_STATUSES).toEqual(["invited", "active", "removed"]);
    expect(ORG_TEAM_STATUS_DEFAULT).toBe("invited");
  });

  it("normalizes invite email and defaults status to invited", () => {
    const parsed = orgTeamInviteSchema.parse({
      orgId: "11111111-1111-4111-8111-111111111111",
      email: "  Pat@Example.com  ",
      role: "legal",
    });
    expect(parsed.email).toBe("pat@example.com");
    expect(parsed.status).toBe("invited");
    expect(orgTeamInviteSchema.safeParse({ orgId: "x", email: "a@b.c", role: "viewer" }).success).toBe(
      false,
    );
    expect(
      orgTeamInviteSchema.safeParse({
        orgId: "11111111-1111-4111-8111-111111111111",
        email: "not-an-email",
        role: "viewer",
      }).success,
    ).toBe(false);
  });

  it("labels a row with the profile name when present, otherwise the email", () => {
    expect(orgTeamPersonLabel({ displayName: "Ada Lovelace", email: "ada@example.com" })).toEqual({
      name: "Ada Lovelace",
      secondary: "ada@example.com",
    });
    expect(orgTeamPersonLabel({ displayName: null, email: "ada@example.com" })).toEqual({
      name: "ada@example.com",
      secondary: null,
    });
  });

  it("maps the last-owner guard and a missing login identity", () => {
    expect(
      isOrgTeamLastOwnerError(
        "Organization 11111111-1111-4111-8111-111111111111 would be left with no active account owner.",
      ),
    ).toBe(true);
    expect(isOrgTeamUserNotFoundError("User not found")).toBe(true);
    expect(orgTeamWriteError("no active account owner", ORG_TEAM.saveFailed)).toBe(ORG_TEAM.lastOwner);
    expect(orgTeamWriteError(null, ORG_TEAM.saveFailed)).toBe(ORG_TEAM.saveFailed);
    expect(
      orgTeamUpdateSchema.parse({
        orgId: "11111111-1111-4111-8111-111111111111",
        membershipId: "22222222-2222-4222-8222-222222222222",
        role: "accountant",
        status: "removed",
      }),
    ).toMatchObject({ role: "accountant", status: "removed" });
  });

  it("keeps invite on the house membership RPC and magic-link mint", () => {
    const actions = readFileSync("src/app/(app)/settings/aggregation/actions.ts", "utf8");
    const sql = readFileSync("supabase/migrations/20260919120000_invite_org_member.sql", "utf8");
    expect(actions).toContain("invite_org_member");
    expect(actions).toContain("issueDashboardSignInLink");
    expect(actions).toContain("manage_team");
    expect(actions).not.toMatch(/signInWithOtp/);
    expect(actions).not.toContain("gc_staff");
    expect(sql).toContain("member_can(auth.uid(), p_org, 'manage_team')");
    expect(sql).toContain("tg_memberships_last_owner_guard");
    expect(sql).not.toContain("drop trigger if exists memberships_last_owner_guard");
  });
});
