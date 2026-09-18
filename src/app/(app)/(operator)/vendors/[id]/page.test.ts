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
import { VENDORS_PAGE } from "@/lib/vendors-directory";

import VendorProfilePage from "./page";

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

describe("vendor profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders identity, extensible info, and the licensed-title catalog from deliveries", async () => {
    stubClient(
      {
        id: VENDOR_ID,
        name: "Acme Distribution",
        delivery_mode: "portal_upload",
        active: true,
        email_to: [],
        email_cc: [],
        email_template: null,
        company_info: { region: "US" },
      },
      [
        {
          title_id: "t1",
          territory: "US",
          status: "live",
          titles: { title: "Autumn Road", catalog_id: "GC-1" },
        },
      ],
    );

    const html = renderToStaticMarkup(
      await VendorProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    );

    expect(html).toContain("data-vendor-profile");
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("AD");
    expect(html).toContain("Portal upload");
    expect(html).toContain(VENDOR_PROFILE.infoTitle);
    expect(html).toContain(VENDOR_PROFILE.reservedTitle);
    expect(html).toContain("region");
    expect(html).toContain("US");
    expect(html).toContain(VENDOR_PROFILE.catalogTitle);
    expect(html).toContain("Autumn Road");
    expect(html).toContain("GC-1 · US · Approved");
    expect(html).toContain("/gc/titles/t1");
    expect(html).toContain(`/vendors/${VENDOR_ID}/edit`);
    expect(html).toContain(VENDORS_PAGE.title);
    expect(html).not.toContain("VendorForm");
    expect(readFileSync("src/app/(app)/(operator)/vendors/[id]/page.tsx", "utf8")).not.toContain(
      "VendorForm",
    );
  });

  it("keeps the reserved shell when company_info is empty", async () => {
    stubClient({
      id: VENDOR_ID,
      name: "Acme Distribution",
      delivery_mode: "email",
      active: false,
      email_to: ["ops@vendor.example"],
      email_cc: [],
      email_template: null,
      company_info: null,
    });

    const html = renderToStaticMarkup(
      await VendorProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    );
    expect(html).toContain(VENDOR_PROFILE.reservedEmpty);
    expect(html).toContain(VENDOR_PROFILE.catalogEmpty);
    expect(html).toContain("ops@vendor.example");
  });

  it("404s when the vendor row is missing", async () => {
    stubClient(null);
    await expect(
      VendorProfilePage({ params: Promise.resolve({ id: VENDOR_ID }) }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
