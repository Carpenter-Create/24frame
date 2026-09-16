import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SETTINGS, settingsManageCoursesVisible } from "./settings";

describe("settings hub isolation", () => {
  it("does not implement Education CMS inside Settings — staff door is a href only", () => {
    const pane = readFileSync("src/components/settings/workspace-empty-settings.tsx", "utf8");
    const educationPage = readFileSync("src/app/(app)/settings/education/page.tsx", "utf8");
    expect(SETTINGS.manageCoursesHref).toBe("/education");
    expect(pane).toContain("SETTINGS.manageCoursesHref");
    expect(pane).toContain("data-settings-manage-courses");
    expect(pane).not.toContain("education-forms");
    expect(pane).not.toContain("CreateCourseForm");
    expect(pane).not.toContain("/gc/education");
    expect(educationPage).not.toContain("education-forms");
    expect(educationPage).not.toContain("@/lib/education-admin");
    expect(existsSync("src/app/(app)/education/page.tsx")).toBe(false);
  });

  it("never shows Manage courses to members", () => {
    expect(settingsManageCoursesVisible(false)).toBe(false);
    expect(settingsManageCoursesVisible(true)).toBe(true);
    const pane = readFileSync("src/components/settings/workspace-empty-settings.tsx", "utf8");
    expect(pane).toContain("settingsManageCoursesVisible(isGcStaff)");
  });

  it("does not invent /account settings routes", () => {
    const settings = readFileSync("src/lib/settings.ts", "utf8");
    const userMenu = readFileSync("src/lib/user-menu.ts", "utf8");
    expect(settings).not.toContain("/account/settings");
    expect(settings).not.toContain("/account/you");
    expect(userMenu).not.toContain("/account/settings");
    expect(SETTINGS.href).toBe("/settings");
    expect(SETTINGS.youHref).toBe("/settings/you");
  });
});
