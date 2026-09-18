import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { CLIENT_PROFILE, CLIENTS_PAGE } from "@/lib/clients";

import ClientOrgProfilePage from "./page";

const ORG_ID = "22222222-2222-4222-8222-222222222222";

function seat(over: Record<string, unknown> = {}) {
  return {
    user_id: "11111111-1111-4111-8111-111111111111",
    email: "jane@acmefilms.com",
    org_id: ORG_ID,
    organization: "Acme Films",
    org_status: "active",
    role: "account_owner",
    joined_at: "2026-08-03T10:00:00Z",
    last_sign_in: "2026-08-14T09:00:00Z",
    tier: "pro",
    term_expires_at: "2027-08-03T10:00:00Z",
    subscription_status: "active",
    ...over,
  };
}

describe("client org profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders org info and associated users on the shared directory row", async () => {
    const rpc = vi.fn(async () => ({
      data: [seat(), seat({ user_id: "u2", email: "sam@acmefilms.com", role: "viewer" })],
      error: null,
    }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(
      await ClientOrgProfilePage({ params: Promise.resolve({ orgId: ORG_ID }) }),
    );

    expect(html).toContain("data-client-profile");
    expect(html).toContain("Acme Films");
    expect(html).toContain(CLIENT_PROFILE.infoTitle);
    expect(html).toContain(CLIENT_PROFILE.peopleTitle);
    expect(html).toContain("jane@acmefilms.com");
    expect(html).toContain("sam@acmefilms.com");
    expect(html).toContain("Account owner · Aug 14, 2026");
    expect(html).toContain("Viewer · Aug 14, 2026");
    expect(html).toContain("2 people");
    expect(html).toContain("data-staff-directory-row");
    expect(html).not.toContain("data-staff-directory-nested");
    expect(html).toContain(CLIENTS_PAGE.title);
    expect(html).not.toContain("<table");
    expect(html).not.toContain("EMAIL");
    expect(html).not.toContain("ROLE");
    expect(html).not.toContain("LAST SEEN");
  });

  it("404s when the org is not in the directory read", async () => {
    vi.mocked(createClient).mockResolvedValue({
      rpc: vi.fn(async () => ({ data: [seat()], error: null })),
    } as never);

    await expect(
      ClientOrgProfilePage({
        params: Promise.resolve({ orgId: "33333333-3333-4333-8333-333333333333" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
