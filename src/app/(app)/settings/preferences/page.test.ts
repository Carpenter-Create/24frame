import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPEARANCE, APPEARANCE_SETTINGS_CARD_CLASS } from "@/lib/appearance";
import { HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREF_EVENTS,
  NOTIFICATION_PREF_SECTION_CLASS,
  NOTIFICATION_PREF_SWITCH_TRACK_CLASS,
  NOTIFICATION_PREF_WRAP_CLASS,
  NOTIFICATION_PREFS,
} from "@/lib/notification-prefs";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import SettingsPreferencesPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/app/(app)/settings/preferences/actions", () => ({
  loadOwnNotificationPrefs: vi.fn(async () => NOTIFICATION_PREF_DEFAULTS),
  saveNotificationPref: vi.fn(),
}));
vi.mock("./actions", () => ({
  loadOwnNotificationPrefs: vi.fn(async () => NOTIFICATION_PREF_DEFAULTS),
  saveNotificationPref: vi.fn(),
}));

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

  it("shows Appearance and the notification matrix — not an empty pane", async () => {
    const html = renderToStaticMarkup(await SettingsPreferencesPage());
    expect(html).toContain('data-settings-hub="preferences"');
    expect(html).toMatch(/<h1[^>]*>Preferences<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(html).not.toMatch(/<h2[^>]*>Preferences<\/h2>/);
    expect(html).toContain(SETTINGS.preferences);
    expect(paneSrc).toContain("settingsPaneTitle");
    expect(paneSrc).not.toContain("SETTINGS.title");
    expect(html).toContain('data-settings-section="appearance"');
    expect(html).toContain('data-settings-appearance=""');
    expect(html).toContain(APPEARANCE.title);
    expect(html).toContain(APPEARANCE.systemDefault);
    expect(html).toContain(APPEARANCE.dark);
    expect(html).toContain(APPEARANCE.light);
    expect(html).toContain('data-settings-section="notifications"');
    expect(html).toContain('data-settings-notification-matrix=""');
    expect(html).toContain(NOTIFICATION_PREFS.title);
    expect(html).toContain(NOTIFICATION_PREFS.inApp);
    expect(html).toContain(NOTIFICATION_PREFS.email);
    for (const event of NOTIFICATION_PREF_EVENTS) {
      expect(html).toContain(`data-settings-notification-row="${event}"`);
      expect(html).toContain(NOTIFICATION_PREFS.events[event]);
    }
    expect(html).not.toContain("data-house-empty");
    expect(html).not.toContain("No preferences on this account.");
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(html).not.toContain('href="/education"');
    expect(html).not.toContain("CreateCourseForm");
    expect(html).toContain(NOTIFICATION_PREFS.groups.aggregation);
    expect(html).toContain(NOTIFICATION_PREFS.groups.social);
    expect(html).toContain(NOTIFICATION_PREFS.groups.education);
    expect(html).toContain(NOTIFICATION_PREFS.groups.account);
    expect(html).toContain(NOTIFICATION_PREFS.groups.reporting);
    expect(html).toContain(APPEARANCE_SETTINGS_CARD_CLASS);
    expect(html).toContain(NOTIFICATION_PREF_WRAP_CLASS);
    expect(html).toContain('data-settings-notification-wrap=""');
    expect(html).toContain(NOTIFICATION_PREF_SECTION_CLASS);
    expect(html).toContain(HOUSE_MODULE_CLASS);
    expect(NOTIFICATION_PREF_SECTION_CLASS).not.toContain(HOUSE_MODULE_CLASS);
    expect(html).toContain("divide-y divide-hairline");
    expect(html).toContain("py-[var(--space-8)]");
    expect(html).toContain(NOTIFICATION_PREF_SWITCH_TRACK_CLASS);
    expect(html).toContain("h-5 w-9");
    expect(html).not.toContain("h-6 w-10");
    expect(html).toContain(`data-settings-notification-section="aggregation"`);
    expect(html).toContain(`data-settings-notification-section="reporting"`);
    expect(html).toContain(`data-settings-notification-switch="title_returned:in_app"`);
    expect(html).toContain(`data-settings-notification-switch="title_returned:email"`);
    expect(html).not.toContain("CreateCourseForm");
    expect(pageSrc).not.toContain("education-forms");
    expect(paneSrc).toContain("SETTINGS.manageCourses");
    expect(paneSrc).toContain("AppearancePreferences");
    expect(paneSrc).toContain("NotificationPreferences");
  });

  it("shows staff Manage courses as a quiet row to /education", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(true) as never);
    const html = renderToStaticMarkup(await SettingsPreferencesPage());
    expect(html).toContain(SETTINGS.manageCourses);
    expect(html).toContain('data-settings-manage-courses=""');
    expect(html).toContain(`href="${SETTINGS.manageCoursesHref}"`);
    expect(html).toContain('href="/education/manage"');
    expect(html).not.toContain("/gc/education");
    expect(html).toContain('data-settings-notification-matrix=""');
    expect(html).not.toContain("data-house-empty");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SettingsPreferencesPage()).rejects.toThrow("REDIRECT:/login");
  });
});
