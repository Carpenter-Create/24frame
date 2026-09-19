import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { CLIENTS_PAGE } from "@/lib/clients";
import { ACCOUNT_INVITE, HOUSE_GRANT } from "@/lib/account-invite";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";

import GcClientsPage from "./page";

/**
 * The bound has to be a PROBE, not the page size: asking for exactly UNPAGINATED_MAX rows
 * returns a truncated list that looks complete, which is the failure list-bounds.ts exists
 * to prevent. This asserts the page asks for one more than it shows.
 */
describe("GcClientsPage read bound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ id: "staff-1", email: "ops@test.example" });
  });

  it("probes one row past the cap so truncation can be detected", async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    await GcClientsPage();

    expect(rpc).toHaveBeenCalledWith("gc_client_directory", { p_limit: UNPAGINATED_MAX + 1 });
  });

  it("renders without a client org present", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    await expect(GcClientsPage()).resolves.toBeTruthy();
  });

  it("renders No clients yet. with no Add or CTA", async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(await GcClientsPage());
    const emptyStart = html.indexOf(CLIENTS_PAGE.empty);
    const surfaceStart = html.lastIndexOf("<div", emptyStart);
    const surface = html.slice(surfaceStart, html.indexOf(CLIENTS_PAGE.empty) + CLIENTS_PAGE.empty.length);

    expect(html).toContain(CLIENTS_PAGE.title);
    expect(html).toContain(CLIENTS_PAGE.empty);
    expect(html).toContain("data-staff-directory");
    expect(html).toContain("0 clients");
    expect(html).not.toContain("Organizations with an active seat.");
    expect(html).not.toContain("Every person holding an active seat");
    expect(html).not.toContain("No client organizations yet.");
    expect(html).not.toContain("Add");
    expect(html).not.toContain("View titles");
    expect(html).not.toContain("<table");
    expect(surface).toContain(CLIENTS_PAGE.empty);
    expect(surface).not.toContain("<a");
    expect(surface).not.toContain("bg-accent");
    expect(surface).not.toContain("text-accent");
  });

  it("renders organizations as the shared directory row without nested seats", async () => {
    const seats = [
      {
        user_id: "u1",
        email: "jane@acmefilms.com",
        org_id: "22222222-2222-4222-8222-222222222222",
        organization: "Acme Films",
        org_status: "active",
        role: "account_owner",
        joined_at: "2026-08-03T10:00:00Z",
        last_sign_in: "2026-08-14T09:00:00Z",
        tier: "pro",
        term_expires_at: "2027-08-03T10:00:00Z",
        subscription_status: "active",
      },
      {
        user_id: "u2",
        email: "sam@acmefilms.com",
        org_id: "22222222-2222-4222-8222-222222222222",
        organization: "Acme Films",
        org_status: "active",
        role: "viewer",
        joined_at: "2026-08-03T10:00:00Z",
        last_sign_in: "2026-08-14T09:00:00Z",
        tier: "pro",
        term_expires_at: "2027-08-03T10:00:00Z",
        subscription_status: "active",
      },
    ];
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: true, error: null };
      if (name === "house_grants") return { data: [], error: null };
      return { data: seats, error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(await GcClientsPage());
    expect(html).toContain("Acme Films");
    expect(html).toContain("2 people · Pro");
    expect(html).toContain("Active");
    expect(html).toContain("/gc/clients/22222222-2222-4222-8222-222222222222");
    expect(html).toContain("data-staff-directory-row");
    expect(html).toContain("AF");
    expect(html).not.toContain("jane@acmefilms.com");
    expect(html).not.toContain("sam@acmefilms.com");
    expect(html).not.toContain("Account owner · Aug 14, 2026");
    expect(html).not.toContain("data-staff-directory-nested");
    expect(html).not.toContain("Organizations with an active seat.");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("EMAIL");
    expect(html).not.toContain("ROLE");
    expect(html).not.toContain("LAST SEEN");
    expect(html).toContain("Grant account");
    expect(html).toContain("data-house-grant-form");
    expect(rpc).toHaveBeenCalledWith("gc_can", { p_uid: "staff-1", p_capability: "operate" });
    expect(rpc).toHaveBeenCalledWith("house_grants", { p_limit: UNPAGINATED_MAX + 1 });

    const directorySrc = readFileSync(
      "src/app/(app)/(operator)/aggregation/gc/clients/clients-directory.tsx",
      "utf8",
    );
    expect(directorySrc).toContain("StaffDirectoryList");
    expect(directorySrc).toContain("TitlesCatalogHeader");
    expect(directorySrc).toContain("ClientsStatusFilter");
    expect(directorySrc).not.toContain("import { StatusFilter }");
    expect(directorySrc).not.toContain("@/components/layout/status-filter");
    expect(directorySrc).not.toContain("PageHeader");
    expect(directorySrc).not.toContain("clientSeatSecondary");
    expect(directorySrc).not.toContain("nested:");
    expect(directorySrc).not.toContain("subtitle=");
    expect(directorySrc).not.toContain("<table");
    expect(directorySrc).not.toContain("Card");
    expect(directorySrc).not.toContain("HouseGrantForm");
    expect(readFileSync("src/app/(app)/(operator)/aggregation/gc/clients/page.tsx", "utf8")).toContain(
      "HouseGrantSection",
    );
    expect(html).toContain("data-titles-catalog-header-row");
    expect(html).toContain("data-gc-clients-status-compact");
    expect(html).toContain("data-house-page-select");
    expect(html).not.toContain("REGISTERED");
    expect(html).not.toContain("AWAITING PAYMENT");
  });

  it("hides Grant account when gc_can(operate) is false", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: false, error: null };
      return { data: [], error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(await GcClientsPage());
    expect(html).toContain(CLIENTS_PAGE.empty);
    expect(html).not.toContain(HOUSE_GRANT.title);
    expect(html).not.toContain("data-house-grant-form");
    expect(rpc).toHaveBeenCalledWith("gc_can", { p_uid: "staff-1", p_capability: "operate" });
    expect(rpc).not.toHaveBeenCalledWith("house_grants", expect.anything());
  });

  it("shows Invited and Accepted on house grants after send", async () => {
    const grants = [
      {
        id: "g-pending",
        email: "pending@test.example",
        org_name: "Pending Films",
        tier: "access",
        status: "pending",
        org_id: null,
        expires_at: "2026-10-03T00:00:00Z",
        created_at: "2026-09-17T00:00:00Z",
        accepted_at: null,
      },
      {
        id: "g-accepted",
        email: "accepted@test.example",
        org_name: "Accepted Films",
        tier: "pro",
        status: "accepted",
        org_id: "33333333-3333-4333-8333-333333333333",
        expires_at: "2026-10-03T00:00:00Z",
        created_at: "2026-09-18T00:00:00Z",
        accepted_at: "2026-09-19T12:00:00Z",
      },
    ];
    const rpc = vi.fn(async (name: string) => {
      if (name === "gc_can") return { data: true, error: null };
      if (name === "house_grants") return { data: grants, error: null };
      return { data: [], error: null };
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const html = renderToStaticMarkup(await GcClientsPage());
    expect(html).toContain("pending@test.example");
    expect(html).toContain("accepted@test.example");
    expect(html).toContain('data-invite-status="invited"');
    expect(html).toContain('data-invite-status="accepted"');
    expect(html).toContain(HOUSE_GRANT.invited);
    expect(html).toContain(HOUSE_GRANT.accepted);
    expect(html).toContain("/aggregation/gc/clients/33333333-3333-4333-8333-333333333333");
    expect(html).toContain(HOUSE_GRANT.revoke);
    expect(html).toContain("Sep 17, 2026");
    expect(html).toContain("Sep 19, 2026");
    expect(html).toContain('data-invite-date="sent"');
    expect(html).toContain('data-invite-date="accepted"');
    expect(html).toContain(ACCOUNT_INVITE.sentColumn);
    expect(html).toContain(ACCOUNT_INVITE.acceptedColumn);
    expect(html).not.toContain("Withdrawn");
    expect(html).not.toContain("Removed");
    const acceptedStart = html.indexOf("accepted@test.example");
    const acceptedRow = html.slice(acceptedStart, html.indexOf("</li>", acceptedStart));
    expect(acceptedRow).not.toContain(HOUSE_GRANT.revoke);
    expect(html).not.toContain(HOUSE_GRANT.empty);
  });
});
