import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

const pageSrc = readFileSync(
  "src/app/(app)/(operator)/staff/gc/deliveries/deliver/page.tsx",
  "utf8",
);

describe("Deliver stepper route", () => {
  it("is a focused Option B overlay that loads grants through companions", () => {
    expect(pageSrc).toContain("DeliverStepper");
    expect(pageSrc).toContain("createDeliveries");
    expect(pageSrc).toContain("loadGcDeliveryCompanions");
    expect(pageSrc).toContain("fixed inset-0");
    expect(pageSrc).toContain("bg-surface-muted");
    expect(pageSrc).toContain("DELIVER_STEPPER.listHref");
    expect(pageSrc).not.toContain("NewDeliveryForm");
    expect(pageSrc).not.toContain("ExportPanel");
    expect(pageSrc).not.toContain("Option A");
  });
});
