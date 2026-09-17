import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { ATTENTION_HREF } from "@/lib/findings";
import CatalogHealthRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("Catalog Health redirect", () => {
  it("redirects /catalog-health to /attention", () => {
    expect(() => CatalogHealthRedirectPage()).toThrow(`REDIRECT:${ATTENTION_HREF}`);
    const pageSrc = readFileSync("src/app/(app)/catalog-health/page.tsx", "utf8");
    expect(pageSrc).toContain("redirect");
    expect(pageSrc).toContain("ATTENTION_HREF");
    expect(pageSrc).not.toContain("FindingRows");
  });
});
