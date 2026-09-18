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
  it("uses HousePageSelect on phone, not a Licensing-only menu", () => {
    const html = renderToStaticMarkup(
      createElement(LicensingStatusFilter, {
        status: "pending",
        vendor: null,
        defaultOpen: true,
      }),
    );
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-licensing-status-compact");
    expect(html).toContain(GC_LICENSING_STATUS.statusFilterLabel);
    expect(html).toContain("Pending");
    expect(html).not.toContain("<select");
  });

  it("stays on the Dashboard All time select grammar", () => {
    const src = readFileSync(
      "src/app/(app)/(operator)/gc/deliveries/licensing-status-filter.tsx",
      "utf8",
    );
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("Dashboard All time");
    expect(src).toContain("md:hidden");
    expect(src).not.toMatch(/triggerClassName=/);
  });
});
