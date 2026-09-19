import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadDiscoverableCourses } from "@/lib/courses";
import { NEWS_HREF, NEWS_PAGE } from "@/lib/news";
import { homeGreeting } from "@/lib/home-greeting";
import { OVERVIEW_PAGE } from "@/lib/overview";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { getOrgContext } from "@/lib/supabase/context";
import HomePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: async () => ({ data: [] }),
          }),
        }),
      }),
    }),
  })),
}));
vi.mock("@/lib/my-lists", () => ({
  loadMyFindings: vi.fn(async () => ({ rows: [], truncated: false })),
  loadMyDeliveries: vi.fn(async () => ({ rows: [], truncated: false })),
}));
vi.mock("@/lib/courses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/courses")>();
  return {
    ...actual,
    loadDiscoverableCourses: vi.fn(async () => ({ courses: [], failed: false })),
  };
});
vi.mock("@/lib/s3-education", () => ({ signedEducationCoverUrls: vi.fn(async () => new Map()) }));
vi.mock("@/lib/s3-avatars", () => ({ signedAvatarUrls: vi.fn(async () => new Map()) }));
vi.mock("@/lib/social-feed", () => ({ loadProfilesByIds: vi.fn(async () => new Map()) }));
vi.mock("@/lib/social-dms", () => ({ loadDmInbox: vi.fn(async () => ({ rows: [], truncated: false })) }));
vi.mock("@/lib/social-profile", () => ({ ensureOwnSocialProfile: vi.fn(async () => null) }));
vi.mock("@/lib/finance", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/finance")>();
  return { ...actual, canViewClientEarn: () => false };
});
vi.mock("@/lib/finance-recipient-load", () => ({
  loadRecipientDashboard: vi.fn(async () => null),
}));
vi.mock("@/lib/news-load", () => ({
  loadHomeNews: vi.fn(async () => []),
}));

function ctx(user: { name?: string | null } = {}) {
  return {
    user: { id: "u1", email: "ada@example.com", ...user },
    rows: [{ role: "account_owner", organizations: { id: "org-1", name: "Meridian", status: "active" } }],
    orgs: [{ id: "org-1", name: "Meridian" }],
    activeOrg: { id: "org-1", name: "Meridian", status: "active" },
    activeRole: "account_owner",
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Home modules for a signed-in account", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain("data-overview");
    expect(html).toContain(homeGreeting());
    expect(html).toMatch(/<h1 class="t-title text-ink">Hi<\/h1>/);
    expect(html).not.toMatch(/<h1 class="t-title text-ink">Home<\/h1>/);
    expect(html).not.toContain("ada@example.com");
    expect(html).not.toContain("Overview");
    expect(html).toContain(OVERVIEW_PAGE.needsYou);
    expect(html).toContain(OVERVIEW_PAGE.revenue);
    expect(html).toContain(OVERVIEW_PAGE.social);
    expect(html).toContain(OVERVIEW_PAGE.education);
    expect(html).toContain(OVERVIEW_PAGE.news);
    expect(html).toContain(OVERVIEW_PAGE.aiNext);
    expect(html).toContain(NEWS_PAGE.viewAll);
    expect(html).toContain(`href="${NEWS_HREF}"`);
    expect(html).not.toMatch(/summary|rewrite|republish/i);
    expect(html).not.toContain('data-overview-module="week"');
    expect(html).not.toContain("data-overview-aggregation");
    expect(html).not.toContain("data-overview-top-performing");
    expect(html).not.toContain("Top performing");
    expect(html).toContain("data-overview-revenue-period");
    expect(html.indexOf("data-overview-revenue")).toBeLessThan(
      html.indexOf('data-overview-module="social"'),
    );
    expect(html.indexOf('data-overview-module="social"')).toBeLessThan(
      html.indexOf('data-overview-module="education"'),
    );
    expect(html.indexOf('data-overview-module="education"')).toBeLessThan(
      html.indexOf('data-overview-module="needs-you"'),
    );
    expect(html.indexOf('data-overview-module="needs-you"')).toBeLessThan(
      html.indexOf('data-overview-module="ai-next"'),
    );
    expect(html.indexOf('data-overview-module="ai-next"')).toBeLessThan(
      html.indexOf('data-overview-module="news"'),
    );
    expect(html).not.toContain("Globee");
  });

  it("greets the signed-in account by first name on the Home H1", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ name: "Ada Lovelace" }) as never);
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain(homeGreeting({ displayName: "Ada Lovelace" }));
    expect(html).toMatch(/<h1 class="t-title text-ink">Hi, Ada<\/h1>/);
    expect(html).not.toMatch(/<h1 class="t-title text-ink">Home<\/h1>/);
    expect(html).not.toContain("undefined");
    expect(OVERVIEW_PAGE.title).toBe("Home");
    expect(readFileSync("src/app/(app)/home/page.tsx", "utf8")).toContain(
      "displayName={ctx.user.name}",
    );
  });

  it("applies the shared YTD period chip on Home", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const html = renderToStaticMarkup(
      await HomePage({ searchParams: Promise.resolve({ period: "ytd" }) }),
    );
    const ytd = html.match(/<a[^>]*data-overview-revenue-period-chip="ytd"[^>]*>/);
    expect(ytd?.[0]).toContain('aria-pressed="true"');
    expect(html).toContain("YTD");
    expect(html).not.toContain("Top performing");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(HomePage()).rejects.toThrow("REDIRECT:/login");
  });

  it("signs Education covers and renders the photo on Home glance", async () => {
    const course = {
      id: "c1",
      slug: "catalog-basics",
      title: "Catalog basics",
      description: null,
      cover_key: "cover.jpg",
      is_flagship_free: true,
      price_cents: null,
      catalog_code: "EDU-1",
      status: "published" as const,
      position: 1,
      instructor_id: null,
      created_at: "2026-09-01T12:00:00.000Z",
    };
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(loadDiscoverableCourses).mockResolvedValue({ courses: [course], failed: false });
    vi.mocked(signedEducationCoverUrls).mockResolvedValue(
      new Map([["c1", "https://cover.example/photo.jpg"]]),
    );

    const html = renderToStaticMarkup(await HomePage());

    expect(signedEducationCoverUrls).toHaveBeenCalledWith([course]);
    expect(html).toContain('data-course-card-density="home"');
    expect(html).toContain('data-course-cover-tone="photo"');
    expect(html).toContain("https://cover.example/photo.jpg");
    expect(html).toContain("<img");
    expect(html).not.toContain('data-course-cover-tone="plate"');
    expect(html).not.toContain("data-course-cover-orb");
    expect(html).not.toContain("3 lessons");
  });
});
