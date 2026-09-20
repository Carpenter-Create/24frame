import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CLIENTS_PAGE, ORG_STATUS_LABELS } from "@/lib/clients-filter";
import { ClientsStatusFilter } from "./clients-status-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("ClientsStatusFilter", () => {
  it("uses HousePageSelect at every breakpoint with sentence-case labels", () => {
    const html = renderToStaticMarkup(
      createElement(ClientsStatusFilter, { status: "active", defaultOpen: true }),
    );
    const src = readFileSync(
      "src/app/(app)/(operator)/staff/gc/clients/clients-status-filter.tsx",
      "utf8",
    );
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-gc-clients-status-compact");
    expect(html).toContain("data-gc-clients-status-trigger");
    expect(html).toContain(CLIENTS_PAGE.statusFilterLabel);
    expect(html).toContain(ORG_STATUS_LABELS.active);
    expect(html).toContain(ORG_STATUS_LABELS.awaiting_payment);
    expect(html).toContain("All");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("ACTIVE");
    expect(html).not.toContain("AWAITING PAYMENT");
    expect(src).toContain("HousePageSelect");
    expect(src).toContain('menuAlign="end"');
    expect(src).not.toContain("md:hidden");
    expect(src).not.toMatch(/triggerClassName=/);
  });
});
