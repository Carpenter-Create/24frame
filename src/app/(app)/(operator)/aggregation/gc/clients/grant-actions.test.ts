import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendHouseGrantEmail: vi.fn() }));
vi.mock("@/lib/account-invite-token", () => ({
  mintInviteToken: () => ({ token: "raw-token", tokenHash: "b".repeat(64) }),
  inviteAcceptUrl: () => "https://app.24frame.co/invite/accept?token=raw-token",
}));

import { headers } from "next/headers";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { sendHouseGrantEmail } from "@/lib/email";
import { HOUSE_GRANT } from "@/lib/account-invite";
import { grantHouseAccount, revokeHouseGrant } from "./grant-actions";

describe("grantHouseAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({
      get: () => "https://app.24frame.co",
    } as never);
  });

  it("refuses a non-staff caller before the RPC", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "u1", email: "owner@test.example" },
      isGcStaff: false,
    } as never);
    await expect(
      grantHouseAccount({ email: "grant@test.example", orgName: "Comp Films", tier: "pro" }),
    ).resolves.toEqual({ error: "Only house staff can grant an account." });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuses staff without gc_can(operate) before grant RPC", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "legal-1", email: "legal@test.example" },
      isGcStaff: true,
    } as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: false, error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(
      grantHouseAccount({ email: "grant@test.example", orgName: "Comp Films", tier: "pro" }),
    ).resolves.toEqual({ error: HOUSE_GRANT.forbidden });
    expect(rpc).toHaveBeenCalledWith("gc_can", { p_uid: "legal-1", p_capability: "operate" });
    expect(rpc).not.toHaveBeenCalledWith("grant_house_account", expect.anything());
  });

  it("grants and sends accept mail for operate staff", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "staff-1", email: "ops@test.example" },
      isGcStaff: true,
    } as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: true, error: null };
      if (name === "grant_house_account") return { data: "grant-1", error: null };
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    vi.mocked(sendHouseGrantEmail).mockResolvedValue(undefined);
    await expect(
      grantHouseAccount({ email: "grant@test.example", orgName: "Comp Films", tier: "pro" }),
    ).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("gc_can", { p_uid: "staff-1", p_capability: "operate" });
    expect(rpc).toHaveBeenCalledWith("grant_house_account", {
      p_email: "grant@test.example",
      p_org_name: "Comp Films",
      p_tier: "pro",
      p_token_hash: "b".repeat(64),
    });
    expect(sendHouseGrantEmail).toHaveBeenCalled();
  });

  it("maps SQL Not authorized on revoke to SoT copy", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "staff-1", email: "ops@test.example" },
      isGcStaff: true,
    } as never);
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: true, error: null };
      if (name === "revoke_account_invite") {
        return { data: null, error: { message: "Not authorized" } };
      }
      return { data: null, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(revokeHouseGrant({ id: "22222222-2222-4222-8222-222222222222" })).resolves.toEqual({
      error: HOUSE_GRANT.forbidden,
    });
  });
});
