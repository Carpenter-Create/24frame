import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import SocialCourseDetailPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
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
  c.in = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(result) ? (result[0] ?? null) : result,
    error: null,
  }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: result, error: null }).then(resolve);
  return c;
}

function stubClient({
  course = null as {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    cover_key: string | null;
    is_flagship_free: boolean;
    instructor_id?: string | null;
    created_at: string;
  } | null,
  modules = [] as { id: string; course_id: string; title: string; position: number }[],
  lessons = [] as {
    id: string;
    module_id: string;
    title: string;
    position: number;
    duration_seconds: number | null;
    free_preview: boolean;
  }[],
  instructor = null as { id: string; name: string } | null,
  access = true,
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === "courses") return chain(course);
    if (table === "modules") return chain(modules);
    if (table === "lessons") return chain(lessons);
    if (table === "instructors") return chain(instructor);
    throw new Error(`unexpected from(${table})`);
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === "has_course_access") return { data: access, error: null };
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  return { from, rpc };
}

async function renderPage(slug = "welcome-to-24frame") {
  return renderToStaticMarkup(
    await SocialCourseDetailPage({ params: Promise.resolve({ slug }) }),
  );
}

describe("Social course detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders module layout and lesson titles for a flagship placeholder", async () => {
    const { rpc } = stubClient({
      course: {
        id: "c1",
        slug: "welcome-to-24frame",
        title: "Welcome to 24Frame",
        description: "Orientation for 24Frame Education.",
        cover_key: null,
        is_flagship_free: true,
        instructor_id: "i1",
        created_at: "2026-09-12T14:00:00.000Z",
      },
      modules: [{ id: "m1", course_id: "c1", title: "Orientation", position: 1 }],
      lessons: [
        {
          id: "l1",
          module_id: "m1",
          title: "What this workspace is",
          position: 1,
          duration_seconds: 90,
          free_preview: true,
        },
        {
          id: "l2",
          module_id: "m1",
          title: "What comes later",
          position: 2,
          duration_seconds: 120,
          free_preview: false,
        },
      ],
      instructor: { id: "i1", name: "Ada Lovelace" },
      access: true,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage();
    expect(rpc).toHaveBeenCalledWith("has_course_access", {
      p_user: "u1",
      p_course: "c1",
    });
    expect(html).toContain('data-social-course="welcome-to-24frame"');
    expect(html).toContain("Welcome to 24Frame");
    expect(html).toContain("Orientation");
    expect(html).toContain("What this workspace is");
    expect(html).toContain("What comes later");
    expect(html).toContain("data-course-player");
    expect(html).toContain("data-course-playlist");
    expect(html).toContain(SOCIAL.courses.playlist);
    expect(html).toContain("data-course-lesson-active");
    expect(html).toContain("data-course-instructor");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("1m 30s");
    expect(html).toContain("2m");
    expect(html).toContain("data-course-cover");
    expect(html).toContain("aspect-video");
    expect(html).toContain("lg:flex-row");
    expect(html).not.toContain("data-course-resume");
    expect(html).not.toContain("Resume");
    expect(html).not.toContain("New &amp; For You");
    expect(html).not.toContain("Manage courses");
    expect(html).not.toContain("data-course-denied");
    expect(html).not.toContain("LOCKED");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("—");
    expect(html).not.toContain("/lessons/");
  });

  it("quiets denied access and still shows preview titles", async () => {
    stubClient({
      course: {
        id: "c2",
        slug: "paid-fixture",
        title: "Paid fixture",
        description: null,
        cover_key: null,
        is_flagship_free: false,
        created_at: "2026-09-12T14:00:00.000Z",
      },
      modules: [{ id: "m2", course_id: "c2", title: "Paid module", position: 1 }],
      lessons: [
        {
          id: "l3",
          module_id: "m2",
          title: "Paid preview",
          position: 1,
          duration_seconds: null,
          free_preview: true,
        },
        {
          id: "l4",
          module_id: "m2",
          title: "Paid body",
          position: 2,
          duration_seconds: null,
          free_preview: false,
        },
      ],
      access: false,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage("paid-fixture");
    expect(html).toContain("data-course-denied");
    expect(html).toContain(SOCIAL.courses.denied);
    expect(html).toContain("Paid preview");
    expect(html).toContain(SOCIAL.courses.preview);
    expect(html).not.toContain("Paid body");
    expect(html).not.toContain("LOCKED");
    expect(html).not.toContain("Buy");
    expect(html).not.toContain("$");
  });

  it("shows house error and Retry when the detail load fails", async () => {
    const from = vi.fn((table: string) => {
      if (table === "courses") {
        const c: Record<string, unknown> = {};
        const self = () => c;
        c.select = vi.fn(self);
        c.eq = vi.fn(self);
        c.maybeSingle = vi.fn(async () => ({ data: null, error: { message: "failed" } }));
        return c;
      }
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage("welcome-to-24frame");
    expect(html).toContain("data-course-error");
    expect(html).toContain(SOCIAL.courses.detailError);
    expect(html).toContain(SOCIAL.courses.retry);
    expect(html).not.toContain("data-course-modules");
  });

  it("shows quiet missing copy when the slug is not visible", async () => {
    stubClient({ course: null });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage("missing");
    expect(html).toContain("data-social-course-missing");
    expect(html).toContain(SOCIAL.courses.missing);
    expect(html).not.toContain("data-course-modules");
  });

  it("sends an unauthenticated visitor to login", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(renderPage()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("course detail lock", () => {
  it("keeps consume in-detail and does not add a price CTA or member publish control", () => {
    const page = readFileSync("src/app/(app)/education/[slug]/page.tsx", "utf8");
    const consume = readFileSync("src/components/courses/course-consume.tsx", "utf8");
    expect(page).toContain("CourseConsume");
    expect(page).toContain("SOCIAL.courses.title");
    expect(page).toContain("loadCourseInstructorName");
    expect(page).not.toContain("Resume");
    expect(page).not.toContain("MediaConvert");
    expect(page).not.toContain("HLS");
    expect(page).not.toContain("<video");
    expect(page).not.toContain("/lessons/");
    expect(page).not.toContain("createSocialCourse");
    expect(page).not.toContain("SocialAvatar");
    expect(page).not.toContain("signedAvatarUrl");
    expect(page).not.toContain("LOCKED");
    expect(consume).toContain("data-course-player");
    expect(consume).toContain("data-course-playlist");
    expect(consume).toContain("lg:flex-row");
    expect(consume).not.toContain("/lessons/");
    expect(consume).not.toContain("Resume");
    expect(consume).not.toMatch(/Buy|checkout|Stripe/i);
    expect(readFileSync("src/app/(app)/education/[slug]/loading.tsx", "utf8")).toContain(
      "CourseDetailSkeleton",
    );
    expect(readFileSync("src/app/(app)/education/[slug]/error.tsx", "utf8")).toContain(
      "data-course-retry",
    );
  });
});
