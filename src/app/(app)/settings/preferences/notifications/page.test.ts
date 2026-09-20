import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREFS,
} from "@/lib/notification-prefs";
import { SETTINGS, SETTINGS_GROUP_CLASS, SETTINGS_GROUP_LABEL_CLASS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import SettingsPreferencesNotificationsPage from "./page";

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

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");

describe("SettingsPreferencesNotificationsPage", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is a Notifications edit pane with instant switches — back to Preferences", async () => {
    const html = renderToStaticMarkup(await SettingsPreferencesNotificationsPage());
    expect(html).toContain('data-settings-edit-pane=""');
    expect(html).toContain('data-settings-hub="preferences"');
    expect(html).toMatch(/<h1[^>]*>Notifications<\/h1>/);
    expect(html).toContain(NOTIFICATION_PREFS.helper);
    expect(html).toContain(`href="${SETTINGS.preferencesHref}"`);
    expect(html).toContain('data-settings-notification-matrix=""');
    expect(html).toContain(SETTINGS_GROUP_CLASS);
    expect(html).toContain(
      `<h2 class="${SETTINGS_GROUP_LABEL_CLASS} px-[var(--space-4)]">${NOTIFICATION_PREFS.groups.aggregation}</h2>`,
    );
    expect(html.match(/data-settings-group=""/g)?.length).toBe(5);
    expect(html).toContain('data-settings-notification-switch="title_returned:in_app"');
    expect(html).not.toContain(SETTINGS.themeHelper);
    expect(html).not.toContain('data-settings-appearance=""');
    expect(pageSrc).toContain("showIntro={false}");
    expect(pageSrc).toContain("SettingsEditPane");
    expect(pageSrc).not.toContain("AppearanceThemePicker");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SettingsPreferencesNotificationsPage()).rejects.toThrow("REDIRECT:/login");
  });
});
