import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import SettingsPreferencesPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));

function ctx(isGcStaff: boolean) {
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: true,
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");
const paneSrc = readFileSync("src/components/settings/preferences-settings.tsx", "utf8");

describe("SettingsPreferencesPage", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(false) as never);
  });

  it("shows HouseEmpty prefs and hides Manage courses from members", async () => {
    const html = renderToStaticMarkup(await SettingsPreferencesPage());
    expect(html).toContain('data-settings-hub="preferences"');
    expect(html).toContain(SETTINGS.title);
    expect(html).toContain(SETTINGS.preferences);
    expect(html).toContain(SETTINGS.preferencesEmpty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(html).not.toContain('href="/education"');
    expect(html).not.toContain("CreateCourseForm");
    expect(html).not.toContain("Social");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Aggregation");
    expect(pageSrc).not.toContain("education-forms");
    expect(paneSrc).toContain("SETTINGS.manageCourses");
  });

  it("shows staff Manage courses as a quiet row to /education", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsPreferencesPage());
    expect(html).toContain(SETTINGS.manageCourses);
    expect(html).toContain('data-settings-manage-courses=""');
    expect(html).toContain(`href="${SETTINGS.manageCoursesHref}"`);
    expect(html).toContain('href="/education"');
    expect(html).not.toContain("/gc/education");
    expect(html).toContain(SETTINGS.preferencesEmpty);
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SettingsPreferencesPage()).rejects.toThrow("REDIRECT:/login");
  });
});
