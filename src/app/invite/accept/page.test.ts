import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/portal", () => ({ hashToken: () => "c".repeat(64) }));

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_INVITE_ACCEPT } from "@/lib/account-invite";

import InviteAcceptPage from "./page";

describe("InviteAcceptPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Accept only when the session email matches", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "Invitee@test.example" });
    const rpc = vi.fn(async () => ({
      data: [{
        email: "invitee@test.example",
        status: "pending",
        kind: "team",
        org_name: "Acme",
        role: "viewer",
      }],
      error: null,
    }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(
      await InviteAcceptPage({ searchParams: Promise.resolve({ token: "a".repeat(24) }) }),
    );
    expect(html).toContain(ACCOUNT_INVITE_ACCEPT.accept);
    expect(html).toContain("data-invite-accept-form");
    expect(html).toContain(
      "You have been invited to join Acme on 24Frame as Viewer.",
    );
    expect(html).not.toContain("this team");
    expect(html).not.toContain(ACCOUNT_INVITE_ACCEPT.wrongEmail);
    expect(html).not.toContain("data-invite-signin-form");
  });

  it("shows wrong-email sign-in when the session does not match", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "other@test.example" });
    const rpc = vi.fn(async () => ({
      data: [{
        email: "invitee@test.example",
        status: "pending",
        kind: "house_grant",
        org_name: "Comp Films",
        tier: "pro",
      }],
      error: null,
    }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(
      await InviteAcceptPage({ searchParams: Promise.resolve({ token: "a".repeat(24) }) }),
    );
    expect(html).toContain(ACCOUNT_INVITE_ACCEPT.wrongEmail);
    expect(html).toContain("data-invite-signin-form");
    expect(html).toContain(ACCOUNT_INVITE_ACCEPT.signIn);
    expect(html).not.toContain(`>${ACCOUNT_INVITE_ACCEPT.accept}<`);
    expect(html).not.toContain("data-invite-accept-form");
  });
});
