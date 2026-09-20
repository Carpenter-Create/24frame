import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SETTINGS } from "./settings";

describe("settings hub isolation", () => {
  it("does not host Manage courses or Education CMS in Settings Preferences", () => {
    const pane = readFileSync("src/components/settings/preferences-settings.tsx", "utf8");
    const preferencesPage = readFileSync("src/app/(app)/settings/preferences/page.tsx", "utf8");
    const settings = readFileSync("src/lib/settings.ts", "utf8");
    expect(SETTINGS).not.toHaveProperty("manageCourses");
    expect(SETTINGS).not.toHaveProperty("manageCoursesHref");
    expect(settings).not.toContain("manageCourses");
    expect(settings).not.toContain("settingsManageCoursesVisible");
    expect(pane).not.toContain("SETTINGS.manageCoursesHref");
    expect(pane).not.toContain("data-settings-manage-courses");
    expect(pane).not.toContain("Manage courses");
    expect(pane).not.toContain("/education/manage");
    expect(pane).not.toContain("education-forms");
    expect(pane).not.toContain("CreateCourseForm");
    expect(pane).not.toContain("/gc/education");
    expect(preferencesPage).not.toContain("education-forms");
    expect(preferencesPage).not.toContain("@/lib/education-admin");
    expect(preferencesPage).not.toContain("(operator)/education");
    expect(pane).not.toContain("(operator)/education");
    expect(existsSync("src/app/(app)/education/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/(operator)/education/manage/page.tsx")).toBe(true);
  });

  it("never shows Manage courses on Preferences", () => {
    const pane = readFileSync("src/components/settings/preferences-settings.tsx", "utf8");
    expect(pane).not.toContain("settingsManageCoursesVisible");
    expect(pane).not.toContain("isGcStaff");
    expect(pane).not.toContain("Manage courses");
    expect(pane).not.toContain("data-settings-manage-courses");
  });

  it("does not invent /account settings routes", () => {
    const settings = readFileSync("src/lib/settings.ts", "utf8");
    const userMenu = readFileSync("src/lib/user-menu.ts", "utf8");
    expect(settings).not.toContain("/account/settings");
    expect(settings).not.toContain("/account/you");
    expect(userMenu).not.toContain("/account/settings");
    expect(SETTINGS.href).toBe("/settings");
    expect(SETTINGS.profileHref).toBe("/settings/profile");
    expect(existsSync("src/app/(app)/settings/you/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/account/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/account/agreements/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/account/company/page.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/refer/page.tsx")).toBe(false);
  });
});
