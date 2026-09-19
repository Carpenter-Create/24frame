import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SETTINGS, settingsManageCoursesVisible } from "./settings";

describe("settings hub isolation", () => {
  it("does not implement Education CMS inside Settings — staff door is a href only", () => {
    const pane = readFileSync("src/components/settings/preferences-settings.tsx", "utf8");
    const preferencesPage = readFileSync("src/app/(app)/settings/preferences/page.tsx", "utf8");
    expect(SETTINGS.manageCoursesHref).toBe("/education/manage");
    expect(pane).toContain("SETTINGS.manageCoursesHref");
    expect(pane).toContain("data-settings-manage-courses");
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

  it("never shows Manage courses to members", () => {
    expect(settingsManageCoursesVisible(false)).toBe(false);
    expect(settingsManageCoursesVisible(true)).toBe(true);
    const pane = readFileSync("src/components/settings/preferences-settings.tsx", "utf8");
    expect(pane).toContain("settingsManageCoursesVisible(isGcStaff)");
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
  });
});
