import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => "https://app.24frame.co" })),
}));
vi.mock("@/lib/auth-magic-link", () => ({ issueDashboardSignInLink: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { revalidatePath } from "next/cache";
import { issueDashboardSignInLink } from "@/lib/auth-magic-link";

import { ORG_TEAM } from "@/lib/org-team";
import { inviteOrgMember, updateOrgMember } from "./actions";

const USER = { id: "u1", email: "ada@example.com", name: "Ada" };
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

function ctx() {
  return {
    user: USER,
    rows: [],
    orgs: [{ id: ORG_ID, name: "Acme" }],
    activeOrg: { id: ORG_ID, name: "Acme", status: "active" },
    activeRole: "account_owner",
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function inviteClient({
  canManage = true,
  first = { data: MEMBER_ID as string | null, error: null as { message: string } | null },
  second = { data: MEMBER_ID as string | null, error: null as { message: string } | null },
} = {}) {
  let inviteCalls = 0;
  const rpc = vi.fn(async (name: string, args: { p_capability?: string }) => {
    if (name === "member_can") {
      expect(args.p_capability).toBe("manage_team");
      return { data: canManage, error: null };
    }
    if (name !== "invite_org_member") throw new Error(`unexpected rpc(${name})`);
    inviteCalls += 1;
    return inviteCalls === 1 ? first : second;
  });
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return { rpc };
}

function updateClient({
  canManage = true,
  row = { id: MEMBER_ID } as { id: string } | null,
  error = null as { message: string } | null,
} = {}) {
  const maybeSingle = vi.fn(async () => ({ data: error ? null : row, error }));
  const select = vi.fn(() => ({ maybeSingle }));
  const eqOrg = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqOrg }));
  const update = vi.fn(() => ({ eq: eqId }));
  const from = vi.fn((table: string) => {
    if (table !== "memberships") throw new Error(`unexpected from(${table})`);
    return { update };
  });
  const rpc = vi.fn(async (name: string, args: { p_capability?: string }) => {
    if (name !== "member_can") throw new Error(`unexpected rpc(${name})`);
    expect(args.p_capability).toBe("manage_team");
    return { data: canManage, error: null };
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc, update, eqId, eqOrg } as never);
  return { from, update, eqId, eqOrg, rpc };
}

describe("inviteOrgMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(issueDashboardSignInLink).mockResolvedValue(undefined);
  });

  it("writes through invite_org_member and sends the house sign-in link", async () => {
    const { rpc } = inviteClient();
    await expect(
      inviteOrgMember({
        orgId: ORG_ID,
        email: "  Pat@Example.com  ",
        role: "legal",
        status: "invited",
      }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: USER.id,
      p_org: ORG_ID,
      p_capability: "manage_team",
    });
    expect(rpc).toHaveBeenCalledWith("invite_org_member", {
      p_org: ORG_ID,
      p_email: "pat@example.com",
      p_role: "legal",
      p_status: "invited",
    });
    expect(issueDashboardSignInLink).toHaveBeenCalledWith({
      email: "pat@example.com",
      requestOrigin: "https://app.24frame.co",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/aggregation");
  });

  it("provisions a missing login identity via the house mint, then retries", async () => {
    const { rpc } = inviteClient({
      first: { data: null, error: { message: "User not found" } },
    });
    await expect(
      inviteOrgMember({
        orgId: ORG_ID,
        email: "new@example.com",
        role: "viewer",
        status: "invited",
      }),
    ).resolves.toEqual({});
    const invites = vi.mocked(rpc).mock.calls.filter(([name]) => name === "invite_org_member");
    expect(invites).toHaveLength(2);
    expect(issueDashboardSignInLink).toHaveBeenCalledOnce();
  });

  it("blocks when member_can manage_team is false", async () => {
    const { rpc } = inviteClient({ canManage: false });
    await expect(
      inviteOrgMember({
        orgId: ORG_ID,
        email: "pat@example.com",
        role: "viewer",
        status: "invited",
      }),
    ).resolves.toEqual({ error: ORG_TEAM.forbidden });
    expect(rpc.mock.calls.some(([name]) => name === "invite_org_member")).toBe(false);
    expect(issueDashboardSignInLink).not.toHaveBeenCalled();
  });

  it("rejects an invalid email before the RPC", async () => {
    const { rpc } = inviteClient();
    await expect(
      inviteOrgMember({ orgId: ORG_ID, email: "not-an-email", role: "viewer" }),
    ).resolves.toEqual({ error: ORG_TEAM.invalidEmail });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("updateOrgMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("persists role and status on the rendered org", async () => {
    const { update, eqId, eqOrg, rpc } = updateClient();
    await expect(
      updateOrgMember({
        orgId: ORG_ID,
        membershipId: MEMBER_ID,
        role: "accountant",
        status: "active",
      }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("member_can", {
      p_uid: USER.id,
      p_org: ORG_ID,
      p_capability: "manage_team",
    });
    expect(update).toHaveBeenCalledWith({ role: "accountant", status: "active" });
    expect(eqId).toHaveBeenCalledWith("id", MEMBER_ID);
    expect(eqOrg).toHaveBeenCalledWith("org_id", ORG_ID);
    expect(revalidatePath).toHaveBeenCalledWith("/settings/aggregation");
  });

  it("maps the last-owner guard to house copy", async () => {
    updateClient({
      error: {
        message:
          "Organization 11111111-1111-4111-8111-111111111111 would be left with no active account owner. Promote another member to account_owner first.",
      },
    });
    await expect(
      updateOrgMember({
        orgId: ORG_ID,
        membershipId: MEMBER_ID,
        role: "viewer",
        status: "active",
      }),
    ).resolves.toEqual({ error: ORG_TEAM.lastOwner });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not write when manage_team is false", async () => {
    const { update } = updateClient({ canManage: false });
    await expect(
      updateOrgMember({
        orgId: ORG_ID,
        membershipId: MEMBER_ID,
        role: "viewer",
        status: "removed",
      }),
    ).resolves.toEqual({ error: ORG_TEAM.forbidden });
    expect(update).not.toHaveBeenCalled();
  });
});
