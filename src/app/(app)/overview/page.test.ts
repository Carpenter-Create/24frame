import { describe, expect, it, vi } from "vitest";

import { OVERVIEW_HREF } from "@/lib/overview";
import OverviewRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("legacy /overview", () => {
  it("redirects to /home", () => {
    expect(() => OverviewRedirectPage()).toThrow(`REDIRECT:${OVERVIEW_HREF}`);
    expect(OVERVIEW_HREF).toBe("/home");
  });
});
