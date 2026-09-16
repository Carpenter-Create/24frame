import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { EDUCATION_ADMIN, EDUCATION_HREF } from "@/lib/education";
import { GC_NAV } from "@/lib/nav";

import GcEducationPage from "./page";

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: result, error: null }).then(resolve);
  return c;
}

describe("GcEducationPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists courses and keeps the create form on the staff path", async () => {
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
            created_at: "2026-09-12T14:00:00.000Z",
          },
        ]);
      }
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const html = renderToStaticMarkup(await GcEducationPage());
    expect(from).toHaveBeenCalledWith("courses");
    expect(html).toContain("data-gc-education");
    expect(html).toContain("data-education-create");
    expect(html).toContain("Welcome to 24Frame");
    expect(html).toContain(`${EDUCATION_HREF}/welcome-to-24frame`);
    expect(html).toContain(EDUCATION_ADMIN.create);
    expect(html).not.toContain('href="/education"');
    expect(html).not.toContain("MasterClass");
  });
});

describe("education admin lock", () => {
  it("lives under the operator gc_staff layout and GC_NAV", () => {
    expect(GC_NAV.map((item) => item.href)).toContain(EDUCATION_HREF);
    const page = readFileSync("src/app/(app)/(operator)/gc/education/page.tsx", "utf8");
    const actions = readFileSync("src/app/(app)/(operator)/gc/education/actions.ts", "utf8");
    expect(page).toContain("CreateCourseForm");
    expect(actions).toContain("createAdminClient");
    expect(actions).toContain("gc_staff");
    expect(actions).not.toContain('from "@/lib/s3"');
    expect(actions).not.toContain('from "@/lib/s3-social-media"');
    expect(actions).not.toContain('from "@/lib/mediaconvert"');
    expect(readFileSync("src/app/(app)/(operator)/layout.tsx", "utf8")).toContain("gc_staff");
  });
});
