import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GC_LICENSING_STATUS } from "@/lib/gc-deliveries";
import { LicensingVendorFilter } from "./licensing-vendor-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const VENDOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("LicensingVendorFilter", () => {
  it("uses HousePageSelect (Dashboard All time SoT), not a native select", () => {
    const html = renderToStaticMarkup(
      createElement(LicensingVendorFilter, {
        status: "live",
        vendor: VENDOR_ID,
        vendors: [{ id: VENDOR_ID, name: "Acme Distribution" }],
        defaultOpen: true,
      }),
    );
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-licensing-vendor-trigger");
    expect(html).toContain("data-gc-licensing-vendor-menu");
    expect(html).toContain("data-gc-licensing-vendor-sheet");
    expect(html).toContain("data-appearance-check");
    expect(html).toContain(GC_LICENSING_STATUS.vendorFilterLabel);
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("All");
    expect(html).not.toContain("<select");
  });

  it("does not invent a second select grammar", () => {
    const src = readFileSync(
      "src/app/(app)/(operator)/gc/deliveries/licensing-vendor-filter.tsx",
      "utf8",
    );
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("Dashboard All time");
    expect(src).not.toMatch(/triggerClassName=/);
    expect(src).toContain('menuAlign="end"');
  });
});
