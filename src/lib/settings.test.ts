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
  parseSettingsSectionQuery,
  settingsCanAccessSection,
  settingsContextSection,
  settingsHeaderBack,
  settingsHubNav,
  settingsHubSection,
  settingsLandHref,
  settingsManageCoursesVisible,
  settingsPathFromQuery,
  settingsRailActive,
  settingsSection,
  settingsSectionHref,
} from "./settings";

describe("settings hub lock", () => {
  it("titles the hub Settings and keeps existing You doors", () => {
    expect(SETTINGS.title).toBe("Settings");
    expect(SETTINGS.title).toBe(USER_MENU.settings);
    expect(SETTINGS.href).toBe("/settings");
    expect(SETTINGS.href).toBe(USER_MENU.settingsHref);
    expect(SETTINGS.you).toBe("You");
    expect(SETTINGS.youHref).toBe("/settings/you");
    expect(SETTINGS.social).toBe("Social");
    expect(SETTINGS.socialHref).toBe("/settings/social");
    expect(SETTINGS.education).toBe("Education");
    expect(SETTINGS.educationHref).toBe("/settings/education");
    expect(SETTINGS.aggregation).toBe("Aggregation");
    expect(SETTINGS.aggregationHref).toBe("/settings/aggregation");
    expect(SETTINGS.sectionQuery).toBe("section");
    expect(SETTINGS.profile).toBe("Profile");
    expect(SETTINGS.profileHref).toBe("/settings/profile");
    expect(SETTINGS.agreements).toBe("Agreements");
    expect(SETTINGS.agreementsHref).toBe("/settings/agreements");
    expect(SETTINGS.agreementsEmpty).toBe("No agreements on this account.");
    expect(SETTINGS.refer).toBe("Refer a friend");
    expect(SETTINGS.referHref).toBe("/settings/refer");
    expect(SETTINGS.dashboard).toBe("Home");
    expect(SETTINGS.dashboardHref).toBe("/");
    expect(SETTINGS.company).toBe("Company");
    expect(SETTINGS).not.toHaveProperty("companyHref");
    expect(SETTINGS.profileHref).toBe(USER_MENU.profileHref);
    expect(SETTINGS.agreementsHref).toBe(USER_MENU.agreementsHref);
    expect(SETTINGS.referHref).toBe(USER_MENU.referHref);
  });

  it("locks section order You · Social · Education · Aggregation", () => {
    expect(SETTINGS_HUB_ORDER).toEqual(["you", "social", "education", "aggregation"]);
    expect(SETTINGS_HUB_NAV.map((item) => item.kind)).toEqual([
      "you",
      "social",
      "education",
      "aggregation",
    ]);
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).toEqual([
      "You",
      "Social",
      "Education",
      "Aggregation",
    ]);
    expect(SETTINGS_HUB_NAV.map((item) => item.href)).toEqual([
      "/settings/you",
      "/settings/social",
      "/settings/education",
      "/settings/aggregation",
    ]);
  });

  it("omits a workspace section when the user has no lane", () => {
    expect(settingsHubNav(["social"]).map((item) => item.kind)).toEqual(["you", "social"]);
    expect(settingsHubNav(["education"]).map((item) => item.kind)).toEqual(["you", "education"]);
    expect(settingsHubNav([]).map((item) => item.kind)).toEqual(["you"]);
    expect(settingsCanAccessSection("you", [])).toBe(true);
    expect(settingsCanAccessSection("education", ["social"])).toBe(false);
    expect(settingsCanAccessSection("education", ["education"])).toBe(true);
  });

  it("opens a hub section from the path — You doors wash You", () => {
    expect(settingsHubSection("/settings/you")).toBe("you");
    expect(settingsHubSection("/settings")).toBe("you");
    expect(settingsHubSection("/settings/profile")).toBe("you");
    expect(settingsHubSection("/settings/agreements")).toBe("you");
    expect(settingsHubSection("/settings/refer")).toBe("you");
    expect(settingsHubSection("/settings/social")).toBe("social");
    expect(settingsSection("/settings/social")).toBe("social");
    expect(settingsSection("/settings/education")).toBe("education");
    expect(settingsSection("/settings/aggregation")).toBe("aggregation");
    expect(settingsSection("")).toBe("you");
    expect(settingsSection(null)).toBe("you");
  });

  it("documents context land: path + ?section= alias, no context → You", () => {
    expect(parseSettingsSectionQuery("education")).toBe("education");
    expect(parseSettingsSectionQuery("social")).toBe("social");
    expect(parseSettingsSectionQuery("aggregation")).toBe("aggregation");
    expect(parseSettingsSectionQuery("you")).toBe("you");
    expect(parseSettingsSectionQuery("profile")).toBeNull();
    expect(parseSettingsSectionQuery("")).toBeNull();
    expect(settingsPathFromQuery("education")).toBe("/settings/education");
    expect(settingsPathFromQuery("nope")).toBeNull();
    expect(settingsSectionHref("education")).toBe("/settings/education");

    expect(settingsContextSection("/social/courses")).toBe("education");
    expect(settingsContextSection("/social/courses/welcome")).toBe("education");
    expect(settingsContextSection("/education")).toBe("education");
    expect(settingsContextSection("/gc/education")).toBe("education");
    expect(settingsContextSection("/social")).toBe("social");
    expect(settingsContextSection("/social/profile/edit")).toBe("social");
    expect(settingsContextSection("/")).toBe("aggregation");
    expect(settingsContextSection("/titles")).toBe("aggregation");
    expect(settingsContextSection("/help")).toBe("you");
    expect(settingsContextSection("/settings")).toBe("you");
    expect(settingsContextSection("/settings/education")).toBe("education");
    expect(settingsContextSection(null)).toBe("you");

    expect(settingsLandHref("/social/courses")).toBe("/settings/education");
    expect(settingsLandHref("/social")).toBe("/settings/social");
    expect(settingsLandHref("/")).toBe("/settings/aggregation");
    expect(settingsLandHref("/help")).toBe("/settings/you");
    expect(settingsLandHref("/settings/education")).toBe("/settings/education");
  });

  it("keeps Manage courses staff-only and linked to /education", () => {
    expect(SETTINGS.manageCourses).toBe("Manage courses");
    expect(SETTINGS.manageCoursesHref).toBe("/education");
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
    const blob = `${SETTINGS.you} ${SETTINGS.profile} ${SETTINGS.agreements} ${SETTINGS.agreementsEmpty} ${SETTINGS.refer}`;
    for (const absent of SETTINGS_ABSENT) {
      expect(blob).not.toContain(absent);
    }
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).not.toContain("Company");
    expect(SETTINGS_HUB_NAV.map((item) => item.kind)).not.toContain("company");
    expect(SETTINGS.agreementsEmpty).not.toMatch(/accepted yet|download|view agreement/i);
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).toContain("settings");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("agreements");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("help");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("refer");
  });

  it("treats every /settings path as the focused shell", () => {
    expect(isSettingsPath("/settings")).toBe(true);
    expect(isSettingsPath("/settings/you")).toBe(true);
    expect(isSettingsPath("/settings/profile")).toBe(true);
    expect(isSettingsPath("/settings/education")).toBe(true);
    expect(isSettingsPath("/settings/social")).toBe(true);
    expect(isSettingsPath("/settings/aggregation")).toBe(true);
    expect(isSettingsPath("/")).toBe(false);
    expect(isSettingsPath("/titles")).toBe(false);
    expect(isSettingsPath("/help")).toBe(false);
    expect(isSettingsPath("/education")).toBe(false);
    expect(isSettingsPath("/social/courses")).toBe(false);
  });

  it("washes the current hub section", () => {
    expect(settingsRailActive("you", "you")).toBe(true);
    expect(settingsRailActive("education", "education")).toBe(true);
    expect(settingsRailActive("you", "education")).toBe(false);
    expect(settingsRailActive("social", "aggregation")).toBe(false);
  });

  it("backs the phone header Home on the list and Settings on a pushed pane", () => {
    expect(settingsHeaderBack("/settings")).toEqual({ href: "/", label: "Home" });
    expect(settingsHeaderBack("/settings/education")).toEqual({
      href: "/settings",
      label: "Settings",
    });
    expect(settingsHeaderBack("/settings/you")).toEqual({
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
      "Company",
      "Manage courses",
      "Home",
    ]);
  });
});
