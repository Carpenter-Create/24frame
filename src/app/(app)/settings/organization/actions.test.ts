import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendTeamInviteEmail: vi.fn() }));
vi.mock("@/lib/account-invite-token", () => ({
  mintInviteToken: () => ({ token: "raw-token", tokenHash: "a".repeat(64) }),
  inviteAcceptUrl: () => "https://app.24frame.co/invite/accept?token=raw-token",
}));

import { headers } from "next/headers";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { sendTeamInviteEmail } from "@/lib/email";
import { inviteTeamMember, addLegalEntity, updateLegalEntity } from "./actions";

const ORG = "22222222-2222-4222-8222-222222222222";

function ctx(over: Record<string, unknown> = {}) {
  return {
    user: { id: "owner-1", email: "owner@test.example" },
    isGcStaff: false,
    activeOrg: { id: ORG, name: "Global Content Holdings LLC", status: "active" },
    orgs: [{ id: ORG, name: "Global Content Holdings LLC" }],
    ...over,
  };
}

describe("inviteTeamMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({
      get: () => "https://app.24frame.co",
    } as never);
  });

  it("refuses a signed-out caller", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "viewer" }),
    ).resolves.toEqual({ error: "Not authenticated." });
  });

  it("refuses without manage_team", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: false, error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "viewer" }),
    ).resolves.toEqual({ error: "Only the account owner can invite people to this team." });
    expect(sendTeamInviteEmail).not.toHaveBeenCalled();
  });

  it("invites and sends the accept mail when authorized", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "invite_org_member") return { data: "invite-1", error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    vi.mocked(sendTeamInviteEmail).mockResolvedValue(undefined);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "Teammate@Acme.com", role: "viewer" }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("invite_org_member", {
      p_org: ORG,
      p_email: "teammate@acme.com",
      p_role: "viewer",
      p_token_hash: "a".repeat(64),
      p_entity_scope: "all",
      p_entity_ids: undefined,
    });
    expect(sendTeamInviteEmail).toHaveBeenCalledWith(
      "teammate@acme.com",
      "https://app.24frame.co/invite/accept?token=raw-token",
      "Global Content Holdings LLC",
      "Viewer",
    );
  });

  it("fails closed when the org name is missing", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ activeOrg: null, orgs: [] }) as never,
    );
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { name: "  " }, error: null }),
        }),
      }),
    }));
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "invite_org_member") return { data: "invite-1", error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc, from } as never);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "viewer" }),
    ).resolves.toEqual({ error: "Couldn't send invite. Try again." });
    expect(sendTeamInviteEmail).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalledWith("invite_org_member", expect.anything());
  });

  it("loads the org name from the database when context has none", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ activeOrg: null, orgs: [] }) as never,
    );
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { name: "North Wind Pictures" },
            error: null,
          }),
        }),
      }),
    }));
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "invite_org_member") return { data: "invite-1", error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc, from } as never);
    vi.mocked(sendTeamInviteEmail).mockResolvedValue(undefined);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "account_owner" }),
    ).resolves.toEqual({});
    expect(sendTeamInviteEmail).toHaveBeenCalledWith(
      "a@b.co",
      "https://app.24frame.co/invite/accept?token=raw-token",
      "North Wind Pictures",
      "Account owner",
    );
  });

  it("maps schema-cache RPC failures to human copy", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "invite_org_member") {
        return {
          data: null,
          error: {
            message:
              "Could not find the function public.invite_org_member(p_email, p_entity_scope, p_org, p_role, p_token_hash) in the schema cache",
          },
        };
      }
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "viewer" }),
    ).resolves.toEqual({ error: "Couldn't send invite. Try again." });
    expect(sendTeamInviteEmail).not.toHaveBeenCalled();
  });

  it("maps an already-pending invite to human copy", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "invite_org_member") {
        return { data: null, error: { message: "An invite is already pending for that email" } };
      }
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      inviteTeamMember({ orgId: ORG, email: "a@b.co", role: "viewer" }),
    ).resolves.toEqual({ error: "That email already has an invite." });
    expect(sendTeamInviteEmail).not.toHaveBeenCalled();
  });
});

describe("addLegalEntity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses a signed-out caller", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(
      addLegalEntity({ orgId: ORG, name: "Test LLC" }),
    ).resolves.toEqual({ error: "Not authenticated." });
  });

  it("refuses without manage_settings", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: false, error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      addLegalEntity({ orgId: ORG, name: "Test LLC" }),
    ).resolves.toEqual({ error: "Only the account owner can manage legal entities." });
  });

  it("creates entity when authorized", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "create_legal_entity") return { data: "entity-1", error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      addLegalEntity({ orgId: ORG, name: "Test LLC", entityType: "llc" }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("create_legal_entity", {
      p_org_id: ORG,
      p_name: "Test LLC",
      p_entity_type: "llc",
      p_jurisdiction: undefined,
    });
  });

  it("rejects empty name", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    await expect(
      addLegalEntity({ orgId: ORG, name: "" }),
    ).resolves.toEqual({ error: "Entity name is required." });
  });
});

const ENTITY = "33333333-3333-4333-8333-333333333333";

describe("updateLegalEntity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses a signed-out caller", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(
      updateLegalEntity({ orgId: ORG, entityId: ENTITY, name: "Renamed LLC" }),
    ).resolves.toEqual({ error: "Not authenticated." });
  });

  it("refuses without manage_settings", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: false, error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      updateLegalEntity({ orgId: ORG, entityId: ENTITY, name: "Renamed LLC" }),
    ).resolves.toEqual({ error: "Only the account owner can manage legal entities." });
    expect(rpc).not.toHaveBeenCalledWith("update_legal_entity", expect.anything());
  });

  it("updates entity when authorized", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "member_can") return { data: true, error: null };
      if (name === "update_legal_entity") return { data: null, error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      updateLegalEntity({
        orgId: ORG,
        entityId: ENTITY,
        name: "Renamed LLC",
        entityType: "llc",
        jurisdiction: "Delaware",
      }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("update_legal_entity", {
      p_entity_id: ENTITY,
      p_name: "Renamed LLC",
      p_entity_type: "llc",
      p_jurisdiction: "Delaware",
    });
  });

  it("rejects empty name", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    await expect(
      updateLegalEntity({ orgId: ORG, entityId: ENTITY, name: "" }),
    ).resolves.toEqual({ error: "Entity name is required." });
  });
});
