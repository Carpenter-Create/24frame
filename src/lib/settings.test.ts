import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { MOBILE_CHROME_LEAD_PAD_CLASS } from "./mobile-chrome";
import { SOCIAL_ROUTES } from "./social";
import { USER_MENU, USER_MENU_ACTIONS } from "./user-menu";
import {
  SETTINGS,
  SETTINGS_ABSENT,
  SETTINGS_HUB_NAV,
  SETTINGS_HUB_ORDER,
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_HEADER_PAD_CLASS,
  SETTINGS_RAIL_ABSENT,
  SETTINGS_RAIL_ACTIVE_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  SETTINGS_RAIL_ITEM_CLASS,
  SETTINGS_RAIL_PAD_CLASS,
  isSettingsPath,
  settingsHeaderBack,
  settingsHubNav,
  settingsHubSection,
  settingsLandHref,
  settingsManageCoursesVisible,
  settingsRailActive,
  settingsSection,
  settingsSectionHref,
} from "./settings";

const RETIRED_SETTINGS_PATHS = [
  "/settings/you",
  "/settings/social",
  "/settings/education",
  "/settings/aggregation",
] as const;

const RETIRED_SETTINGS_PAGES = [
  "src/app/(app)/settings/you/page.tsx",
  "src/app/(app)/settings/social/page.tsx",
  "src/app/(app)/settings/education/page.tsx",
  "src/app/(app)/settings/aggregation/page.tsx",
] as const;

describe("settings hub lock", () => {
  it("titles the hub Settings and keeps Profile doors", () => {
    expect(SETTINGS.title).toBe("Settings");
    expect(SETTINGS.title).toBe(USER_MENU.settings);
    expect(SETTINGS.href).toBe("/settings");
    expect(SETTINGS.href).toBe(USER_MENU.settingsHref);
    expect(SETTINGS.profile).toBe("Profile");
    expect(SETTINGS.profileHref).toBe("/settings/profile");
    expect(SETTINGS.organization).toBe("Organization");
    expect(SETTINGS.organizationHref).toBe("/settings/organization");
    expect(SETTINGS.preferences).toBe("Preferences");
    expect(SETTINGS.preferencesHref).toBe("/settings/preferences");
    expect(SETTINGS).not.toHaveProperty("sectionQuery");
    expect(SETTINGS.agreements).toBe("Agreements");
    expect(SETTINGS.agreementsHref).toBe("/settings/agreements");
    expect(SETTINGS.agreementsEmpty).toBe("No agreements on this account.");
    expect(SETTINGS.refer).toBe("Refer a friend");
    expect(SETTINGS.referHref).toBe("/settings/refer");
    expect(SETTINGS.dashboard).toBe("Home");
    expect(SETTINGS.dashboardHref).toBe("/aggregation/dashboard");
    expect(SETTINGS.company).toBe("Company");
    expect(SETTINGS).not.toHaveProperty("companyHref");
    expect(SETTINGS).not.toHaveProperty("youHref");
    expect(SETTINGS).not.toHaveProperty("socialHref");
    expect(SETTINGS).not.toHaveProperty("educationHref");
    expect(SETTINGS).not.toHaveProperty("aggregationHref");
    expect(SETTINGS.profileHref).toBe(USER_MENU.profileHref);
    expect(SETTINGS.agreementsHref).toBe(USER_MENU.agreementsHref);
    expect(SETTINGS.referHref).toBe(USER_MENU.referHref);
  });

  it("locks section order Profile · Organization · Preferences", () => {
    expect(SETTINGS_HUB_ORDER).toEqual(["profile", "organization", "preferences"]);
    expect(settingsHubNav()).toEqual(SETTINGS_HUB_NAV);
    expect(SETTINGS_HUB_NAV.map((item) => item.kind)).toEqual([
      "profile",
      "organization",
      "preferences",
    ]);
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).toEqual([
      "Profile",
      "Organization",
      "Preferences",
    ]);
    expect(SETTINGS_HUB_NAV.map((item) => item.href)).toEqual([
      "/settings/profile",
      "/settings/organization",
      "/settings/preferences",
    ]);
    expect(settingsSectionHref("profile")).toBe("/settings/profile");
    expect(settingsSectionHref("organization")).toBe("/settings/organization");
    expect(settingsSectionHref("preferences")).toBe("/settings/preferences");
  });

  it("opens a hub section from the path — agreements / refer wash Profile", () => {
    expect(settingsHubSection("/settings/profile")).toBe("profile");
    expect(settingsHubSection("/settings")).toBe("profile");
    expect(settingsHubSection("/settings/agreements")).toBe("profile");
    expect(settingsHubSection("/settings/refer")).toBe("profile");
    expect(settingsHubSection("/settings/organization")).toBe("organization");
    expect(settingsHubSection("/settings/preferences")).toBe("preferences");
    expect(settingsSection("/settings/organization")).toBe("organization");
    expect(settingsSection("/settings/preferences")).toBe("preferences");
    expect(settingsSection("")).toBe("profile");
    expect(settingsSection(null)).toBe("profile");
  });

  it("hard-cuts retired workspace-spine paths — no redirect table", () => {
    const settingsSrc = readFileSync("src/lib/settings.ts", "utf8");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(settingsSrc).not.toContain("SETTINGS_LEGACY");
    expect(settingsSrc).not.toContain("settingsLegacyRedirect");
    expect(settingsSrc).not.toContain("permanentRedirect");
    expect(settingsSrc).not.toContain("sectionQuery");
    expect(settingsSrc).not.toContain("parseSettingsSectionQuery");
    for (const path of RETIRED_SETTINGS_PATHS) {
      expect(settingsSrc).not.toContain(`"${path}"`);
      expect(nextConfig).not.toContain(`source: "${path}"`);
    }
    expect(nextConfig).not.toContain('source: "/settings"');
    for (const page of RETIRED_SETTINGS_PAGES) {
      expect(existsSync(page)).toBe(false);
    }
  });

  it("opens Settings on the universal hub from every workspace", () => {
    expect(settingsLandHref("/social/courses")).toBe("/settings");
    expect(settingsLandHref("/social")).toBe("/settings");
    expect(settingsLandHref("/")).toBe("/settings");
    expect(settingsLandHref("/help")).toBe("/settings");
    expect(settingsLandHref("/settings/preferences")).toBe("/settings");
    expect(settingsLandHref(null)).toBe("/settings");
    expect(settingsLandHref()).toBe(SETTINGS.href);
    expect(settingsLandHref()).toBe(USER_MENU.settingsHref);
  });

  it("keeps Manage courses staff-only and linked to /education", () => {
    expect(SETTINGS.manageCourses).toBe("Manage courses");
    expect(SETTINGS.manageCoursesHref).toBe("/education/manage");
    expect(settingsManageCoursesVisible(true)).toBe(true);
    expect(settingsManageCoursesVisible(false)).toBe(false);
    expect(SETTINGS_RAIL_ABSENT).toContain("Manage courses");
  });

  it("deep-links Edit public profile to the existing Social editor", () => {
    expect(SETTINGS.editPublicProfile).toBe("Edit public profile");
    expect(SETTINGS.editPublicProfileHref).toBe("/social/profile/edit");
    expect(SETTINGS.editPublicProfileHref).toBe(SOCIAL_ROUTES.profileEdit);
  });

  it("does not invent Phone, Job, or the old email helper", () => {
    const blob = `${SETTINGS.profile} ${SETTINGS.organization} ${SETTINGS.preferences} ${SETTINGS.agreements} ${SETTINGS.agreementsEmpty} ${SETTINGS.refer}`;
    for (const absent of SETTINGS_ABSENT) {
      expect(blob).not.toContain(absent);
    }
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("Company");
    expect(SETTINGS_HUB_NAV.map((item) => item.kind)).not.toContain("company");
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("You");
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("Social");
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("Education");
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("Aggregation");
    expect(SETTINGS.agreementsEmpty).not.toMatch(/accepted yet|download|view agreement/i);
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).toContain("settings");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("agreements");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("help");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("refer");
  });

  it("treats every /settings path as the focused shell", () => {
    expect(isSettingsPath("/settings")).toBe(true);
    expect(isSettingsPath("/settings/profile")).toBe(true);
    expect(isSettingsPath("/settings/organization")).toBe(true);
    expect(isSettingsPath("/settings/preferences")).toBe(true);
    expect(isSettingsPath("/settings/agreements")).toBe(true);
    expect(isSettingsPath("/")).toBe(false);
    expect(isSettingsPath("/titles")).toBe(false);
    expect(isSettingsPath("/help")).toBe(false);
    expect(isSettingsPath("/education")).toBe(false);
    expect(isSettingsPath("/social/courses")).toBe(false);
  });

  it("washes the current hub section", () => {
    expect(settingsRailActive("profile", "profile")).toBe(true);
    expect(settingsRailActive("preferences", "preferences")).toBe(true);
    expect(settingsRailActive("profile", "preferences")).toBe(false);
    expect(settingsRailActive("organization", "profile")).toBe(false);
  });

  it("backs the phone header Home on the list and Settings on a pushed pane", () => {
    expect(settingsHeaderBack("/settings")).toEqual({
      href: SETTINGS.dashboardHref,
      label: "Home",
    });
    expect(settingsHeaderBack("/settings/preferences")).toEqual({
      href: "/settings",
      label: "Settings",
    });
    expect(settingsHeaderBack("/settings/profile")).toEqual({
      href: "/settings",
      label: "Settings",
    });
    expect(SETTINGS_HEADER_BACK_CLASS).toBe(
      "flex items-center gap-[var(--space-2)] t-body md:hidden",
    );
    expect(SETTINGS_HEADER_PAD_CLASS).toBe(MOBILE_CHROME_LEAD_PAD_CLASS);
    expect(SETTINGS_HEADER_PAD_CLASS).toBe("px-[var(--space-6)]");
    expect(SETTINGS_HEADER_BACK_CLASS).not.toContain("t-body-sm");
    expect(SETTINGS_HEADER_BACK_CLASS).not.toContain("t-title");
  });

  it("locks the settings rail on 220 pad 16, 15 Regular, house wash", () => {
    expect(SETTINGS_RAIL_PAD_CLASS).toBe("p-[var(--space-4)]");
    expect(SETTINGS_RAIL_ITEM_CLASS).toContain("t-body");
    expect(SETTINGS_RAIL_ITEM_CLASS).not.toContain("font-normal");
    expect(SETTINGS_RAIL_ITEM_CLASS).not.toContain("t-body-sm");
    expect(SETTINGS_RAIL_CHEVRON_CLASS).toBe("size-4 shrink-0");
    expect(SETTINGS_RAIL_ACTIVE_CLASS).toContain("bg-surface-muted");
    expect(SETTINGS_RAIL_ACTIVE_CLASS).not.toMatch(/accent|purple|blue/);
    expect(SETTINGS_RAIL_ABSENT).toEqual([
      "Titles",
      "Deliveries",
      "Recent activity",
      "Activity",
      "Ask 24Frame AI",
      "Queue",
      "Avails",
      "Channels",
      "Finance",
      "Clients",
      "Account",
      "Users",
      "API",
      "Appearance",
      "Workspace",
      "You",
      "Social",
      "Education",
      "Aggregation",
      "Company",
      "Team",
      "Manage courses",
      "Home",
    ]);
  });
});
