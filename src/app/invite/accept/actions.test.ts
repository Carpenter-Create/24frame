import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth-magic-link", () => ({
  DASHBOARD_SIGN_IN_SENT: "Check your email for a secure sign-in link.",
  DASHBOARD_SIGN_IN_SEND_FAILED: "Could not send the sign-in link. Please try again.",
  DASHBOARD_SIGN_IN_RATE_LIMITED: "Too many requests. Please try again later.",
  issueDashboardSignInLink: vi.fn(),
}));
vi.mock("@/lib/dashboard-sign-in-rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dashboard-sign-in-rate-limit")>(
    "@/lib/dashboard-sign-in-rate-limit",
  );
  return { ...actual, assertDashboardSignInAllowed: vi.fn() };
});
vi.mock("@/lib/portal", () => ({ hashToken: () => "c".repeat(64) }));

import { headers } from "next/headers";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { issueDashboardSignInLink } from "@/lib/auth-magic-link";
import { acceptAccountInvite, requestInviteSignIn } from "./actions";

describe("acceptAccountInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a signed-out accept", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    await expect(acceptAccountInvite({ token: "a".repeat(24) })).resolves.toEqual({
      error: "Not authenticated.",
    });
  });

  it("accepts and lands on Organization", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "invitee@test.example" });
    const rpc = vi.fn(async () => ({ data: { org_id: "org-1" }, error: null }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    await expect(acceptAccountInvite({ token: "a".repeat(24) })).rejects.toThrow(
      "REDIRECT:/settings/organization",
    );
    expect(rpc).toHaveBeenCalledWith("accept_account_invite", { p_token_hash: "c".repeat(64) });
  });
});

describe("requestInviteSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({
      get: (name: string) => (name === "origin" ? "https://app.24frame.co" : "203.0.113.10"),
    } as never);
  });

  it("mints a sign-in link that returns to accept", async () => {
    vi.mocked(issueDashboardSignInLink).mockResolvedValue(undefined);
    const form = new FormData();
    form.set("email", "invitee@test.example");
    form.set("token", "a".repeat(24));
    await expect(requestInviteSignIn({ ok: false, message: "" }, form)).resolves.toEqual({
      ok: true,
      message: "Check your email for a secure sign-in link.",
    });
    expect(issueDashboardSignInLink).toHaveBeenCalledWith({
      email: "invitee@test.example",
      requestOrigin: "https://app.24frame.co",
      next: `/invite/accept?token=${"a".repeat(24)}`,
    });
  });
});
