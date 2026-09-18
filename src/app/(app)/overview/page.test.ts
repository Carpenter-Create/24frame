import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { OVERVIEW_HREF } from "@/lib/overview";
import OverviewRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("Overview redirect", () => {
  it("redirects /overview to /home", () => {
    expect(() => OverviewRedirectPage()).toThrow(`REDIRECT:${OVERVIEW_HREF}`);
    expect(OVERVIEW_HREF).toBe("/home");
    const pageSrc = readFileSync("src/app/(app)/overview/page.tsx", "utf8");
    expect(pageSrc).toContain("redirect");
    expect(pageSrc).toContain("OVERVIEW_HREF");
    expect(pageSrc).not.toContain("OverviewPulse");
    expect(pageSrc).not.toContain("loadOverviewPulse");
  });
});
