import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { VENDOR_PROFILE } from "@/lib/vendor-profile";
import { CHANNELS_PAGE } from "@/lib/vendors-directory";

import ChannelProfilePage from "./page";

const VENDOR_ID = "22222222-2222-4222-8222-222222222222";

function stubClient(vendor: Record<string, unknown> | null, deliveries: unknown[] | null = []) {
  const vendorChain = {
    select: vi.fn(() => vendorChain),
    eq: vi.fn(() => vendorChain),
    maybeSingle: vi.fn(async () => ({ data: vendor, error: null })),
  };
  const deliveriesChain = {
    select: vi.fn(() => deliveriesChain),
    eq: vi.fn(() => deliveriesChain),
    range: vi.fn(async () => ({ data: deliveries, error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "vendors") return vendorChain;
    if (table === "deliveries") return deliveriesChain;
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, deliveriesChain };
}

describe("channel detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders story + meta rail from real channel data", async () => {
    stubClient(
      {
        id: VENDOR_ID,
        name: "Acme Distribution",
        delivery_mode: "portal_upload",
        active: true,
        email_to: ["ops@vendor.example"],
        email_cc: [],
        email_template: "Please collect the package.",
        company_info: { region: "US", description: "Independent stories." },
      },
      [
        {
          title_id: "t1",
          territory: "US",
          status: "live",
          titles: { title: "Autumn Road", catalog_id: "GC-1" },
        },
        {
          title_id: "t1",
          territory: "CA",
          status: "live",
          titles: { title: "Autumn Road", catalog_id: "GC-1" },
        },
      ],
    );

    const html = renderToStaticMarkup(
      await ChannelProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    );

    expect(html).toContain("data-channel-detail");
    expect(html).toContain("data-channel-story");
    expect(html).toContain("data-channel-rail");
    expect(html).toContain("data-channel-rail-plate");
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("AD");
    expect(html).toContain("Channels");
    expect(html).toContain(CHANNELS_PAGE.title);
    expect(html).toContain(VENDOR_PROFILE.overviewTitle);
    expect(html).toContain("Independent stories.");
    expect(html).toContain(VENDOR_PROFILE.opsTitle);
    expect(html).toContain("Please collect the package.");
    expect(html).toContain(VENDOR_PROFILE.catalogTitle);
    expect(html).toContain("Autumn Road");
    expect(html).toContain("/titles/t1");
    expect(html).toContain(VENDOR_PROFILE.contactsTitle);
    expect(html).toContain("ops@vendor.example");
    expect(html).toContain(VENDOR_PROFILE.territoriesTitle);
    expect(html).toContain("United States");
    expect(html).toContain("Canada");
    expect(html).toContain("region");
    expect(html).toContain("US");
    expect(html).toContain(`/channels/${VENDOR_ID}/edit`);
    expect(html).toContain(VENDOR_PROFILE.editVendor);
    expect(html).not.toContain("data-staff-directory-row");
    expect(html).not.toContain("VendorForm");
    expect(html).not.toContain("Curation");
    expect(html).not.toContain("How to watch");
    expect(html).not.toContain("Deal Types");
    expect(readFileSync("src/app/(app)/(operator)/channels/[id]/page.tsx", "utf8")).not.toContain(
      "VendorForm",
    );
    expect(readFileSync("src/app/(app)/(operator)/channels/[id]/page.tsx", "utf8")).not.toContain(
      "StaffDirectoryRow",
    );
  });

  it("omits invented Filmhub sections when the real fields are empty", async () => {
    stubClient({
      id: VENDOR_ID,
      name: "Acme Distribution",
      delivery_mode: "email",
      active: false,
      email_to: [],
      email_cc: [],
      email_template: null,
      company_info: null,
    });

    const html = renderToStaticMarkup(
      await ChannelProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    );
    expect(html).toContain(VENDOR_PROFILE.catalogEmpty);
    expect(html).toContain("Inactive");
    expect(html).not.toContain(VENDOR_PROFILE.overviewTitle);
    expect(html).not.toContain(VENDOR_PROFILE.opsTitle);
    expect(html).not.toContain(VENDOR_PROFILE.contactsTitle);
    expect(html).not.toContain(VENDOR_PROFILE.territoriesTitle);
    expect(html).not.toContain("DashboardTerritoryMap");
    expect(html).not.toContain("data-channel-territories");
  });

  it("404s when the vendor row is missing", async () => {
    stubClient(null);
    await expect(
      ChannelProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
