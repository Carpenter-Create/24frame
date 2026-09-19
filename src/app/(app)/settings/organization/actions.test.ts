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
import { inviteTeamMember } from "./actions";

const ORG = "22222222-2222-4222-8222-222222222222";

function ctx(over: Record<string, unknown> = {}) {
  return {
    user: { id: "owner-1", email: "owner@test.example" },
    isGcStaff: false,
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
    });
    expect(sendTeamInviteEmail).toHaveBeenCalledWith(
      "teammate@acme.com",
      "https://app.24frame.co/invite/accept?token=raw-token",
    );
  });
});
