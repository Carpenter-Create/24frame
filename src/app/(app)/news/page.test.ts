import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { NEWS_HREF, NEWS_LEGACY_HREF } from "@/lib/news";
import NewsLegacyRedirectPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("legacy /news", () => {
  it("redirects to /home/news", () => {
    expect(() => NewsLegacyRedirectPage()).toThrow(`REDIRECT:${NEWS_HREF}`);
    expect(NEWS_HREF).toBe("/home/news");
    expect(NEWS_LEGACY_HREF).toBe("/news");
    const pageSrc = readFileSync("src/app/(app)/news/page.tsx", "utf8");
    expect(pageSrc).toContain("redirect");
    expect(pageSrc).toContain("NEWS_HREF");
    expect(pageSrc).not.toContain("NewsRail");
    expect(pageSrc).not.toContain("loadNewsHistory");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain(
      '{ source: "/news", destination: "/home/news", permanent: true }',
    );
  });
});
