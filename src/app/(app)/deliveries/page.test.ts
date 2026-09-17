import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import DeliveriesRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("client Deliveries redirect", () => {
  it("redirects /deliveries to /titles and does not render a browse page", () => {
    expect(() => DeliveriesRedirectPage()).toThrow("REDIRECT:/titles");
    const pageSrc = readFileSync("src/app/(app)/deliveries/page.tsx", "utf8");
    expect(pageSrc).toContain("redirect");
    expect(pageSrc).toContain("/titles");
    expect(pageSrc).not.toContain("data-deliveries-pipeline");
    expect(pageSrc).not.toContain("loadMyDeliveries");
    expect(pageSrc).not.toContain("/licensing");
    const staff = readFileSync("src/app/(app)/(operator)/gc/deliveries/page.tsx", "utf8");
    expect(staff).toContain("Deliveries");
  });
});
