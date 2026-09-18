import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import {
  GC_DELIVERIES_EMPTY,
  GC_DELIVERIES_TRUNCATED,
  GC_LICENSING_STATUS,
} from "@/lib/gc-deliveries";
import { HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import GcDeliveriesPage from "./page";

const capturedVendors = vi.hoisted(() => ({
  form: [] as { id: string; name: string }[],
  filter: [] as { id: string; name: string }[],
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("./new-delivery-form", () => ({
  NewDeliveryForm: (props: { vendors: { id: string; name: string }[] }) => {
    capturedVendors.form = props.vendors;
    return null;
  },
}));
vi.mock("./export-panel", () => ({ ExportPanel: () => null }));
vi.mock("./delivery-controls", () => ({ DeliveryControls: () => null }));
vi.mock("./portal-links", () => ({ PortalLinks: () => null }));
vi.mock("./licensing-vendor-filter", () => ({
  LicensingVendorFilter: (props: { vendors: { id: string; name: string }[] }) => {
    capturedVendors.filter = props.vendors;
    return null;
  },
}));

function stubClient(tables: Record<string, unknown[]> = {}) {
  const from = vi.fn((table: string) => {
    const rows = tables[table] ?? [];
    const chain: {
      select: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      range: ReturnType<typeof vi.fn>;
      in: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      is: ReturnType<typeof vi.fn>;
      then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => unknown;
    } = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      in: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      then: (resolve) => resolve({ data: rows, error: null }),
    };
    return chain;
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

function stubEmptyClient() {
  return stubClient();
}

async function renderEmptyDeliveries(
  search: Record<string, string | string[] | undefined> = {},
) {
  stubEmptyClient();
  return renderToStaticMarkup(
    await GcDeliveriesPage({ searchParams: Promise.resolve(search) }),
  );
}

const pageSrc = readFileSync("src/app/(app)/(operator)/gc/deliveries/page.tsx", "utf8");
const companionsSrc = readFileSync("src/lib/gc-deliveries-companions.ts", "utf8");
const viewTitlesClass = "t-body-sm text-accent transition-colors hover:underline";

describe("staff /gc/deliveries empty copy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the Licensing Status title and locked empty line", async () => {
    const html = await renderEmptyDeliveries();

    expect(html).toContain(`>${GC_LICENSING_STATUS.title}<`);
    expect(html).toContain(GC_LICENSING_STATUS.intro);
    expect(GC_DELIVERIES_EMPTY.title).toBe("No licensing status yet.");
    expect(html).toContain("No licensing status yet.");
    expect(html).toContain("data-gc-licensing-status");
  });

  it("renders View titles as Sporty Blue text, not a filled button", async () => {
    const html = await renderEmptyDeliveries();
    const marker = html.indexOf("View titles");
    const addStart = html.lastIndexOf("<a", marker);
    const addEnd = html.indexOf("</a>", marker);
    const link = html.slice(addStart, addEnd);

    expect(GC_DELIVERIES_EMPTY.actionLabel).toBe("View titles");
    expect(GC_DELIVERIES_EMPTY.actionHref).toBe("/titles");
    expect(html).toContain('href="/titles"');
    expect(html).toContain("View titles");
    expect(pageSrc).toContain(viewTitlesClass);
    expect(link).toContain("t-body-sm");
    expect(link).toContain("text-accent");
    expect(link).toContain("hover:underline");
    expect(link).toContain("View titles");
    expect(link).not.toContain("bg-accent");
    expect(link).not.toContain("text-accent-contrast");
    expect(link).not.toContain("rounded-[12px]");
    expect(link).not.toContain("px-[var(--space-4)]");
    expect(link).not.toContain("py-[var(--space-2)]");
    expect(link).not.toContain("inline-flex");
  });

  it("does not restyle client /deliveries or vendors", () => {
    const clientDeliveries = readFileSync("src/app/(app)/deliveries/page.tsx", "utf8");
    const vendors = readFileSync("src/app/(app)/(operator)/vendors/page.tsx", "utf8");

    expect(clientDeliveries).toContain('redirect("/titles")');
    expect(clientDeliveries).not.toContain("EmptyState");
    expect(vendors).toContain("VENDORS_PAGE");
    expect(pageSrc).not.toContain("EmptyState");
    expect(pageSrc).not.toContain("VENDORS_PAGE");
  });
});

describe("staff /gc/deliveries licensing filters and craft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedVendors.form = [];
    capturedVendors.filter = [];
  });

  it("filters by live delivery status and vendor on the cross-org read", async () => {
    const vendorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const { from } = stubClient();
    await GcDeliveriesPage({
      searchParams: Promise.resolve({ status: "live", vendor: vendorId }),
    });
    expect(from).toHaveBeenCalledWith("deliveries");
    const deliveriesChain = from.mock.results[0]?.value as {
      eq: ReturnType<typeof vi.fn>;
    };
    expect(deliveriesChain.eq).toHaveBeenCalledWith("status", "live");
    expect(deliveriesChain.eq).toHaveBeenCalledWith("vendor_id", vendorId);
  });

  it("does not constrain the deliveries read when filters are all", async () => {
    const { from } = stubEmptyClient();
    await renderToStaticMarkup(
      await GcDeliveriesPage({ searchParams: Promise.resolve({}) }),
    );
    const deliveriesChain = from.mock.results[0]?.value as {
      eq: ReturnType<typeof vi.fn>;
    };
    expect(deliveriesChain.eq).not.toHaveBeenCalledWith("status", expect.anything());
    expect(deliveriesChain.eq).not.toHaveBeenCalledWith("vendor_id", expect.anything());
  });

  it("fills the vendor lens from all partners, not the active-only create list", async () => {
    const activeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const inactiveId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    stubClient({
      vendors: [
        { id: activeId, name: "Active Partner", active: true },
        { id: inactiveId, name: "Inactive Partner", active: false },
      ],
    });
    await renderToStaticMarkup(await GcDeliveriesPage());
    expect(capturedVendors.form).toEqual([{ id: activeId, name: "Active Partner" }]);
    expect(capturedVendors.filter).toEqual([
      { id: activeId, name: "Active Partner" },
      { id: inactiveId, name: "Inactive Partner" },
    ]);
    expect(pageSrc).not.toContain('.eq("active", true)');
  });

  it("renders house status chips that preserve the vendor filter", async () => {
    const vendorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const html = await renderEmptyDeliveries({ status: "pending", vendor: vendorId });
    expect(html).toContain("data-gc-licensing-filters");
    expect(html).toContain('aria-label="Filter by status"');
    expect(html).toContain("Pending");
    expect(html).toContain("Delivered");
    expect(html).toContain("Approved");
    expect(html).toContain("Rejected");
    expect(html).toContain("Taken down");
    expect(html).toContain(`/gc/deliveries?status=live&amp;vendor=${vendorId}`);
    expect(html).toContain(`/gc/deliveries?vendor=${vendorId}`);
    expect(pageSrc).toContain("StatusFilter");
    expect(pageSrc).toContain("LicensingVendorFilter");
    expect(pageSrc).toContain("DELIVERY_STATUS_FILTERS");
  });

  it("shows filter-miss copy and Show all when the lens is empty", async () => {
    const html = await renderEmptyDeliveries({ status: "rejected" });
    expect(html).toContain(GC_LICENSING_STATUS.filterMiss);
    expect(html).toContain(GC_LICENSING_STATUS.showAll);
    expect(html).toContain('href="/gc/deliveries"');
    expect(html).not.toContain("No licensing status yet.");
  });

  it("sits rows and empty on grey house modules, not white cards", async () => {
    stubClient({
      deliveries: [
        {
          id: "d1",
          territory: "US",
          status: "live",
          vendor_id: "v1",
          title_id: "t1",
          titles: { title: "North Star", catalog_id: "GC-0000001" },
          vendors: { name: "Acme Distribution" },
          organizations: { name: "Example Org" },
        },
      ],
    });
    const html = renderToStaticMarkup(await GcDeliveriesPage());
    expect(html).toContain(HOUSE_MODULE_CLASS);
    expect(html).toContain('data-gc-licensing-row="d1"');
    expect(html).toContain("North Star");
    expect(html).toContain("Example Org");
    expect(pageSrc).toContain("HOUSE_MODULE_CLASS");
    expect(pageSrc).not.toContain("@/components/ui/card");
    expect(pageSrc).not.toContain("card-surface");
    expect(html).not.toContain("card-surface");
  });
});

/**
 * Class 2: companion lists must never look finished when the read was cut off.
 * The page must not issue its own unbounded rights_grants / assets / portal_*
 * selects — those go through loadGcDeliveryCompanions (IN + probe).
 */
describe("staff /gc/deliveries companion bounds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not query companion tables on the page, and leaves class 1 list bounds alone", () => {
    expect(pageSrc).toContain("loadGcDeliveryCompanions");
    expect(companionsSrc).toContain("probeRange");
    expect(companionsSrc).toContain("splitProbe");
    expect(pageSrc).not.toContain('.from("rights_grants")');
    expect(pageSrc).not.toContain('.from("assets")');
    expect(pageSrc).not.toContain('.from("portal_links")');
    expect(pageSrc).not.toContain('.from("portal_sessions")');
    expect(pageSrc).not.toContain('.from("portal_access_events")');
    expect(pageSrc).toContain("range(...rangeFor(LIST_PAGE))");
    expect(pageSrc).toContain("range(...rangeFor(UNPAGINATED_MAX))");
    expect(pageSrc).not.toContain("probeRange(LIST_PAGE)");
  });

  it("renders no truncated state when companion reads are short", async () => {
    const html = await renderEmptyDeliveries();
    expect(html).not.toContain(GC_DELIVERIES_TRUNCATED.grants);
    expect(html).not.toContain(GC_DELIVERIES_TRUNCATED.companions);
    expect(html).not.toContain('data-gc-deliveries-truncated="grants"');
    expect(html).not.toContain('data-gc-deliveries-truncated="companions"');
  });

  it("shows the grants notice when the grant probe overflows", async () => {
    stubClient({
      titles: [{ id: "t1", title: "North Star", catalog_id: "GC-0000001" }],
      rights_grants: Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({
        id: `g-${i}`,
        title_id: "t1",
        rights_type: "avod",
        territory_mode: "world",
        territories: [],
      })),
    });

    const html = renderToStaticMarkup(await GcDeliveriesPage());
    expect(html).toContain(GC_DELIVERIES_TRUNCATED.grants);
    expect(html).toContain('data-gc-deliveries-truncated="grants"');
    expect(html).not.toContain('data-gc-deliveries-truncated="companions"');
  });

  it("shows the portal notice when a page-scoped companion overflows", async () => {
    stubClient({
      deliveries: [
        {
          id: "d1",
          territory: "US",
          status: "live",
          vendor_id: "v1",
          title_id: "t1",
          titles: { title: "North Star", catalog_id: "GC-0000001" },
          vendors: { name: "Acme Distribution" },
          organizations: { name: "Example Org" },
        },
      ],
      portal_links: [
        {
          id: "l1",
          delivery_id: "d1",
          asset_id: "a1",
          expires_at: "2026-09-01T00:00:00Z",
          revoked_at: null,
        },
      ],
      portal_sessions: Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({
        id: `s-${i}`,
        link_id: "l1",
        name: "A",
        company: "B",
        email: "a@example.com",
        expires_at: "2026-09-01T00:00:00Z",
        revoked_at: null,
      })),
    });

    const html = renderToStaticMarkup(await GcDeliveriesPage());
    expect(html).toContain(GC_DELIVERIES_TRUNCATED.companions);
    expect(html).toContain('data-gc-deliveries-truncated="companions"');
    expect(html).not.toContain('data-gc-deliveries-truncated="grants"');
    expect(html).toContain("North Star");
  });
});
