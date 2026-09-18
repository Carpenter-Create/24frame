import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/gc/clients",
  useSearchParams: () => new URLSearchParams(),
}));

import { createClient } from "@/lib/supabase/server";
import { CLIENTS_PAGE, CLIENT_DIRECTORY_FILTERS } from "@/lib/clients";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";

import GcClientsPage from "./page";

/**
 * The bound has to be a PROBE, not the page size: asking for exactly UNPAGINATED_MAX rows
 * returns a truncated list that looks complete, which is the failure list-bounds.ts exists
 * to prevent. This asserts the page asks for one more than it shows.
 */
describe("GcClientsPage read bound", () => {
  beforeEach(() => vi.clearAllMocks());

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
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-clients-status-trigger");
    expect(html).not.toContain('role="group"');
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
    const rpc = vi.fn(async () => ({
      data: [
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
      ],
      error: null,
    }));
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

    const directorySrc = readFileSync(
      "src/app/(app)/(operator)/gc/clients/clients-directory.tsx",
      "utf8",
    );
    expect(directorySrc).toContain("StaffDirectoryList");
    expect(directorySrc).toContain("ClientsStatusFilter");
    expect(directorySrc).toContain("PageHeader");
    expect(directorySrc).not.toContain("StatusFilter");
    expect(directorySrc).not.toContain("clientSeatSecondary");
    expect(directorySrc).not.toContain("nested:");
    expect(directorySrc).not.toContain("subtitle=");
    expect(directorySrc).not.toContain("<table");
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-clients-status-trigger");
    expect(html).toContain("data-staff-directory-count");
    expect(html).toContain("1 client");
    expect(html).not.toContain('role="group"');
    expect(html).not.toContain("data-gc-clients-status-pills");
    for (const { label } of CLIENT_DIRECTORY_FILTERS) {
      expect(html).not.toContain(label.toUpperCase());
    }
  });
});
