import { describe, expect, it, vi } from "vitest";

import { SETTINGS } from "@/lib/settings";
import SettingsAggregationRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("SettingsAggregationRedirectPage", () => {
  it("permanently redirects aggregation → organization", () => {
    expect(() => SettingsAggregationRedirectPage()).toThrow(
      `REDIRECT:${SETTINGS.organizationHref}`,
    );
  });
});
