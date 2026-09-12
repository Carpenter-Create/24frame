import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { SOCIAL } from "@/lib/social";
import SocialCoursesPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: false,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: result, error: null }).then(resolve);
  return c;
}

function stubClient(
  courses: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    is_flagship_free: boolean;
    created_at: string;
  }[] = [],
) {
  const from = vi.fn((table: string) => {
    if (table === "courses") return chain(courses);
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);
  return { from };
}

describe("Social courses list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders placeholder courses for a signed-in user", async () => {
    const { from } = stubClient([
      {
        id: "c1",
        slug: "welcome-to-24frame",
        title: "Welcome to 24Frame",
        description: "Placeholder orientation for the Social+Education workspace.",
        is_flagship_free: true,
        created_at: "2026-09-12T14:00:00.000Z",
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialCoursesPage());
    expect(from).toHaveBeenCalledWith("courses");
    expect(from).not.toHaveBeenCalledWith("titles");
    expect(html).toContain("data-social-courses");
    expect(html).toContain(SOCIAL.courses.title);
    expect(html).toContain("24Frame");
    expect(html).toContain("Social+Education");
    expect(html).toContain("Welcome to 24Frame");
    expect(html).toContain("/social/courses/welcome-to-24frame");
    expect(html).not.toContain("LOCKED");
    expect(html).not.toContain("Globee");
    expect(html).not.toContain(ASK_GLOBEE.headline);
    expect(html).not.toContain("—");
    expect(html).not.toContain("courses/new");
  });

  it("shows the empty state when there are no courses", async () => {
    stubClient([]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialCoursesPage());
    expect(html).toContain("data-house-empty");
    expect(html).toContain(SOCIAL.courses.empty);
    expect(html).not.toContain("data-course-row");
  });

  it("sends an unauthenticated visitor to login", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SocialCoursesPage()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("course list lock", () => {
  it("does not add a create form or steal /messages", () => {
    const page = readFileSync("src/app/(app)/social/courses/page.tsx", "utf8");
    const messages = readFileSync("src/app/(app)/messages/page.tsx", "utf8");
    expect(page).not.toContain('"/messages"');
    expect(page).not.toContain("createSocialCourse");
    expect(page).not.toContain("SocialAvatar");
    expect(messages).toContain("AskGlobeeLanding");
    expect(messages).not.toContain("from(\"courses\")");
  });
});
