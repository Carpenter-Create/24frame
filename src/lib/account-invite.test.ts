import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { TIER_META } from "./agreements";
import { ORG_ROLE_LABELS } from "./org-roles";
import { Constants } from "./supabase/database.types";
import {
  ACCOUNT_INVITE,
  ACCOUNT_INVITE_ABSENT,
  ACCOUNT_INVITE_ACCEPT,
  GRANT_TIER_LABELS,
  HOUSE_GRANT,
  HOUSE_GRANT_DEFAULT_TIER,
  TEAM_INVITE_DEFAULT_ROLE,
  TEAM_INVITE_ROLES,
  acceptInviteSchema,
  INVITE_STATUS,
  acceptedInviteOrgId,
  grantTierLabel,
  houseGrantSchema,
  inviteAcceptPath,
  inviteDateLabel,
  inviteEmailSubject,
  inviteEmailsMatch,
  inviteStatusFromRow,
  inviteStatusLabel,
  teamIdentityName,
  teamInviteSchema,
  teamRoleLabel,
  teamRowInitials,
  toTeamListRows,
} from "./account-invite";

describe("account invite SoT", () => {
  it("reuses org_role — does not fork owner/admin/member", () => {
    expect([...TEAM_INVITE_ROLES]).toEqual([...Constants.public.Enums.org_role]);
    for (const role of TEAM_INVITE_ROLES) {
      expect(teamRoleLabel(role)).toBe(ORG_ROLE_LABELS[role]);
    }
    expect(TEAM_INVITE_DEFAULT_ROLE).toBe("viewer");
    expect(ACCOUNT_INVITE.team).toBe("Team");
    expect(ACCOUNT_INVITE.forbidden).toMatch(/account owner/i);
    expect(ACCOUNT_INVITE.invited).toBe(INVITE_STATUS.invited);
    expect(ACCOUNT_INVITE.accepted).toBe(INVITE_STATUS.accepted);
    expect(inviteStatusLabel("invited")).toBe("Invited");
    expect(inviteStatusLabel("accepted")).toBe("Accepted");
    expect(inviteStatusFromRow("pending")).toBe("invited");
    expect(inviteStatusFromRow("accepted")).toBe("accepted");
    const teamForm = readFileSync("src/components/settings/team-invite-form.tsx", "utf8");
    expect(teamForm).toContain("inviteStatusLabel(row.status)");
    expect(teamForm).toContain("data-invite-status={row.status}");
    expect(teamForm).not.toContain("ACCOUNT_INVITE.pending");
    expect(teamForm).toContain("canInvite && row.withdrawId");
    expect(teamForm).toContain("onRevoke(row.withdrawId)");
    expect(teamForm).toContain("inviteDateLabel");
    expect(teamForm).toContain("data-invite-date");
    expect(teamForm).toContain("data-team-list");
    expect(teamForm).toContain("data-team-invite-cta");
    expect(teamForm).toContain("<Dialog");
    expect(teamForm).toContain("DialogFooter");
    expect(teamForm).toContain('import { Select } from "@/components/ui/select"');
    expect(teamForm).toContain('id="team-invite-role"');
    expect(teamForm).not.toContain("<select");
    expect(teamForm).not.toContain("flex flex-col gap-[var(--space-4)]");
    expect(ACCOUNT_INVITE.cancel).toBe("Cancel");
    expect(teamForm).toContain("router.refresh()");
    expect(teamForm).not.toMatch(/Withdrawn|Removed/);
    expect(teamIdentityName("  Ada  ")).toBe("Ada");
    expect(teamIdentityName("")).toBeNull();
    expect(teamRowInitials("Ada Lovelace", "ada@example.com")).toBe("AL");
    expect(teamRowInitials(null, "pat@example.com")).toBe("PA");
    const list = toTeamListRows(
      [{ userId: "u1", email: "ada@example.com", role: "account_owner", name: "Ada", sentAt: "2026-01-01", acceptedAt: "2026-01-02" }],
      [{ id: "inv-1", email: "pat@example.com", role: "viewer", sentAt: "2026-09-19" }],
    );
    expect(list[0]?.status).toBe("invited");
    expect(list[0]?.acceptedAt).toBeNull();
    expect(list[1]?.status).toBe("accepted");
    expect(list[1]?.name).toBe("Ada");
    expect(inviteDateLabel("2026-09-19T00:00:00Z")).toBe("Sep 19, 2026");
    expect(inviteDateLabel(null)).toBe("—");
    expect(inviteDateLabel("nope")).toBe("—");
  });

  it("keeps house grant on the existing tier enum", () => {
    expect(Object.keys(GRANT_TIER_LABELS)).toEqual([...Constants.public.Enums.tier_enum]);
    for (const tier of Constants.public.Enums.tier_enum) {
      expect(grantTierLabel(tier)).toBe(TIER_META[tier].label);
    }
    expect(HOUSE_GRANT_DEFAULT_TIER).toBe("access");
    expect(HOUSE_GRANT.title).toBe("Grant account");
    expect(HOUSE_GRANT.forbidden).toMatch(/house staff/i);
    expect(HOUSE_GRANT.revoking).toBe("Withdrawing…");
    expect(HOUSE_GRANT.revoking).not.toBe(HOUSE_GRANT.granting);
    const grantForm = readFileSync("src/components/staff/house-grant-form.tsx", "utf8");
    expect(grantForm).toContain("HOUSE_GRANT.revoking");
    expect(grantForm).not.toContain("revoking === row.id ? HOUSE_GRANT.granting");
    expect(grantForm).toContain("inviteStatusFromRow(row.status)");
    expect(grantForm).toContain("canGrant && invited");
    expect(grantForm).toContain("hiddenIds");
    expect(grantForm).toContain("router.refresh()");
    expect(grantForm).toContain("inviteDateLabel");
    expect(grantForm).toContain("data-invite-date");
    expect(grantForm).not.toMatch(/Withdrawn|Removed/);
    expect(HOUSE_GRANT.invited).toBe(INVITE_STATUS.invited);
    expect(HOUSE_GRANT.accepted).toBe(INVITE_STATUS.accepted);
    expect(HOUSE_GRANT.empty).toBe("No grants yet.");
    const grantSection = readFileSync(
      "src/app/(app)/(operator)/aggregation/gc/clients/house-grant-section.tsx",
      "utf8",
    );
    expect(grantSection).toContain('rpc("house_grants"');
    expect(grantSection).toContain("clientOrgHref");
    expect(grantSection).not.toContain("pending_house_grants");
  });

  it("matches invite emails case-insensitively and reads accept org_id", () => {
    expect(inviteEmailsMatch("Invitee@Test.Example", "invitee@test.example")).toBe(true);
    expect(inviteEmailsMatch("other@test.example", "invitee@test.example")).toBe(false);
    expect(inviteEmailsMatch("", "invitee@test.example")).toBe(false);
    expect(inviteEmailsMatch("  ", "invitee@test.example")).toBe(false);
    expect(acceptedInviteOrgId({ org_id: "org-new", kind: "house_grant" })).toBe("org-new");
    expect(acceptedInviteOrgId({ kind: "team" })).toBeNull();
    expect(ACCOUNT_INVITE_ACCEPT.wrongEmail).toMatch(/invited email/i);
  });

  it("validates invite input at the edge", () => {
    expect(teamInviteSchema.parse({
      orgId: "22222222-2222-4222-8222-222222222222",
      email: "  Jane@AcmeFilms.com ",
      role: "delivery_ops",
    }).email).toBe("jane@acmefilms.com");
    expect(() =>
      teamInviteSchema.parse({
        orgId: "22222222-2222-4222-8222-222222222222",
        email: "not-an-email",
        role: "viewer",
      }),
    ).toThrow();
    expect(houseGrantSchema.parse({
      email: "grant@test.example",
      orgName: "Comp Films",
      tier: "pro",
    }).tier).toBe("pro");
    expect(acceptInviteSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(inviteAcceptPath("tok")).toBe("/invite/accept?token=tok");
  });

  it("does not keep a marketing invite-code path", () => {
    const blob = `${ACCOUNT_INVITE.team} ${ACCOUNT_INVITE.invite} ${HOUSE_GRANT.title} ${ACCOUNT_INVITE_ACCEPT.title} ${inviteEmailSubject("team")} ${inviteEmailSubject("house_grant")}`;
    for (const absent of ACCOUNT_INVITE_ABSENT) {
      expect(blob.toLowerCase()).not.toContain(absent.toLowerCase());
    }
    const migration = readFileSync("supabase/migrations/20260919130000_account_invites.sql", "utf8");
    expect(migration).toContain("invite_org_member");
    expect(migration).toContain("grant_house_account");
    expect(migration).toContain("accept_account_invite");
    expect(migration).toContain("create or replace function public.house_grants");
    expect(migration).toContain("i.status in ('pending', 'accepted')");
    expect(migration).not.toContain("pending_house_grants");
    expect(migration).toContain("member_can(v_uid, p_org, 'manage_team')");
    expect(migration).toContain("gc_can(v_uid, 'operate')");
    expect(migration).not.toContain("invite_code");
    expect(migration).not.toContain("promo_code");
    expect(migration).toContain("grant select (");
    expect(migration).toMatch(/grant select \(\s*id, kind, status, email/);
    expect(migration).not.toMatch(/grant select \([^)]*token_hash/);
    expect(migration).toContain("tg_audit_account_invites");
    expect(migration).toContain("expire_stale_account_invites");
    expect(migration).toContain("to_jsonb(new) - 'token_hash'");
    expect(migration).toContain("to_jsonb(old) - 'token_hash'");
  });
});
