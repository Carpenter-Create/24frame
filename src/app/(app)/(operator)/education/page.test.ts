import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { EDUCATION_ADMIN, EDUCATION_HREF } from "@/lib/education";
import { EDUCATION_MANAGE_NAV, GC_NAV } from "@/lib/nav";

import GcEducationPage from "./page";

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

describe("GcEducationPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists catalog identity and keeps New course on the staff path", async () => {
    const from = vi.fn((table: string) => {
      if (table === "courses") {
        return chain([
          {
            id: "c1",
            slug: "welcome-to-24frame",
            title: "Welcome to 24Frame",
            description: null,
            cover_key: null,
            is_flagship_free: true,
            price_cents: null,
            catalog_code: "EDU-0001",
            status: "published",
            position: 1,
            instructor_id: null,
            created_at: "2026-09-12T14:00:00.000Z",
            instructors: null,
          },
          {
            id: "c2",
            slug: "paid-fixture",
            title: "Paid fixture",
            description: null,
            cover_key: null,
            is_flagship_free: false,
            price_cents: 4900,
            catalog_code: "EDU-0002",
            status: "draft",
            position: 2,
            instructor_id: null,
            created_at: "2026-09-12T15:00:00.000Z",
            instructors: null,
          },
        ]);
      }
      if (table === "instructors") return chain([]);
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    const html = renderToStaticMarkup(await GcEducationPage());
    expect(from).toHaveBeenCalledWith("courses");
    expect(html).toContain("data-gc-education");
    expect(html).toContain("data-education-create");
    expect(html).toContain(EDUCATION_ADMIN.title);
    expect(html).toContain("Manage courses");
    expect(html).toContain("Welcome to 24Frame");
    expect(html).toContain("EDU-0001");
    expect(html).toContain("Draft");
    expect(html).toContain(`${EDUCATION_HREF}/welcome-to-24frame`);
    expect(html).toContain(EDUCATION_ADMIN.newCourse);
    expect(html).toContain("data-education-model");
    expect(html).toContain(EDUCATION_ADMIN.free);
    expect(html).toContain("Paid · $49.00");
    expect(html).not.toContain("Stripe");
    expect(html).not.toContain("/gc/education");
    expect(html).not.toContain("MasterClass");
    expect(html).not.toContain("Sequence");
  });
});

describe("education admin lock", () => {
  it("lives under the operator gc_staff layout, not GC_NAV", () => {
    expect(EDUCATION_HREF).toBe("/education");
    expect(EDUCATION_MANAGE_NAV.map((item) => item.href)).toContain(EDUCATION_HREF);
    expect(GC_NAV.map((item) => item.href)).not.toContain(EDUCATION_HREF);
    expect(GC_NAV.map((item) => item.href)).not.toContain("/gc/education");
    const page = readFileSync("src/app/(app)/(operator)/education/page.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/education/actions.ts", "utf8");
    expect(page).toContain("NewCourseButton");
    expect(page).toContain("createAdminClient");
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain("gc_staff");
    expect(actions).not.toContain('from "@/lib/s3"');
    expect(actions).not.toContain('from "@/lib/s3-social-media"');
    expect(actions).not.toContain('from "@/lib/mediaconvert"');
    expect(readFileSync("src/app/(app)/(operator)/layout.tsx", "utf8")).toContain("gc_staff");
  });
});
