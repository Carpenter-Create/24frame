import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GC_LICENSING_STATUS } from "@/lib/gc-deliveries";
import { LicensingStatusFilter } from "./licensing-status-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("LicensingStatusFilter", () => {
  it("uses HousePageSelect at every breakpoint, not chips or a native select", () => {
    const html = renderToStaticMarkup(
      createElement(LicensingStatusFilter, {
        status: "pending",
        vendor: null,
        defaultOpen: true,
      }),
    );
    const src = readFileSync(
      "src/app/(app)/(operator)/staff/gc/deliveries/licensing-status-filter.tsx",
      "utf8",
    );
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-licensing-status-compact");
    expect(html).toContain("data-gc-licensing-status-trigger");
    expect(html).toContain("data-gc-licensing-status-menu");
    expect(html).toContain("data-gc-licensing-status-sheet");
    expect(html).toContain(GC_LICENSING_STATUS.statusFilterLabel);
    expect(html).toContain("Pending");
    expect(html).toContain("Delivered");
    expect(html).toContain("Approved");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("ALL");
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("Dashboard All time");
    expect(src).toContain('menuAlign="end"');
    expect(src).not.toContain("md:hidden");
    expect(src).not.toMatch(/triggerClassName=/);
  });
});
