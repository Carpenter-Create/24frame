import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OVERVIEW_PAGE } from "@/lib/overview";
import { getOrgContext } from "@/lib/supabase/context";
import HomePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
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
vi.mock("@/lib/courses", () => ({
  loadDiscoverableCourses: vi.fn(async () => ({ courses: [], failed: false })),
  loadDiscoverableCourseMeta: vi.fn(async () => new Map()),
  courseDiscoverMetaLabel: () => null,
}));
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

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
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
    expect(html).toContain(OVERVIEW_PAGE.title);
    expect(html).toContain("Home");
    expect(html).not.toContain("Overview");
    expect(html).toContain(OVERVIEW_PAGE.needsYou);
    expect(html).not.toContain(OVERVIEW_PAGE.thisWeek);
    expect(html).toContain(OVERVIEW_PAGE.revenue);
    expect(html).toContain(OVERVIEW_PAGE.social);
    expect(html).toContain(OVERVIEW_PAGE.education);
    expect(html).toContain(OVERVIEW_PAGE.aiNext);
    expect(html).not.toContain("Globee");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(HomePage()).rejects.toThrow("REDIRECT:/login");
  });
});
