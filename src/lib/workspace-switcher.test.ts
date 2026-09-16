import { describe, expect, it } from "vitest";

import { SOCIAL_WORKSPACE } from "./product";
import { settingsLandHref } from "./settings";
import { USER_MENU } from "./user-menu";
import { availableWorkspaceOptions, WORKSPACE_EDUCATION_HREF } from "./workspace-menu";
import {
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_ABSENT,
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS,
  WORKSPACE_SWITCHER_HEADER_MARK_CLASS,
  WORKSPACE_SWITCHER_MARK,
  WORKSPACE_SWITCHER_MARK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS,
  WORKSPACE_SWITCHER_PANEL_CLASS,
  WORKSPACE_SWITCHER_ROLE,
  WORKSPACE_SWITCHER_SETTINGS_CLASS,
  WORKSPACE_SWITCHER_STATIC_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  workspaceSwitcherChevronClass,
  workspaceSwitcherMarkLetter,
  workspaceSwitcherOptionClass,
  workspaceSwitcherOptions,
  workspaceSwitcherRole,
  workspaceSwitcherSettingsHref,
  workspaceSwitcherShowsChevron,
  workspaceSwitcherShowsSettings,
} from "./workspace-switcher";
import { persistWorkspaceCookie, workspaceHome } from "./workspace";

describe("workspace switcher lock", () => {
  it("reuses the account-menu Workspace word only as the control name", () => {
    expect(WORKSPACE_SWITCHER.label).toBe("Workspace");
    expect(WORKSPACE_SWITCHER.label).toBe(USER_MENU.workspace);
    expect(WORKSPACE_SWITCHER.settings).toBe(USER_MENU.settings);
    expect(WORKSPACE_SWITCHER.settings).toBe("Settings");
    expect(USER_MENU).not.toHaveProperty("workspaceHref");
  });

  it("lists only accessible lanes on Route A /social/courses", () => {
    expect(workspaceSwitcherOptions().map((option) => option.label)).toEqual([
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(workspaceSwitcherOptions().map((option) => option.href)).toEqual([
      "/",
      "/social",
      "/social/courses",
    ]);
    expect(availableWorkspaceOptions().map((option) => option.href)).toEqual(
      workspaceSwitcherOptions().map((option) => option.href),
    );
    expect(WORKSPACE_EDUCATION_HREF).toBe("/social/courses");
    expect(workspaceHome("education")).toBe("/social/courses");
    expect(workspaceHome("education")).not.toBe("/education");
  });

  it("hides the chevron when only one workspace is reachable", () => {
    const single = workspaceSwitcherOptions().slice(0, 1);
    expect(workspaceSwitcherShowsChevron()).toBe(true);
    expect(workspaceSwitcherShowsChevron(availableWorkspaceOptions())).toBe(true);
    expect(workspaceSwitcherShowsChevron(single)).toBe(false);
    expect(workspaceSwitcherShowsChevron([])).toBe(false);
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("size-4");
    expect(WORKSPACE_SWITCHER_STATIC_CLASS).toContain("t-body-sm");
    expect(WORKSPACE_SWITCHER_TRIGGER_CLASS).toContain("t-body-sm");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("border-hairline");
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).toContain("t-body-sm");
  });

  it("keeps the chevron hidden at rest and shows it on hover or while open", () => {
    expect(WORKSPACE_SWITCHER_TRIGGER_CLASS).toContain("group");
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("opacity-0");
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("group-hover:opacity-100");
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("group-focus-visible:opacity-100");
    expect(WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS).toBe("opacity-100");
    expect(workspaceSwitcherChevronClass(false)).toBe(WORKSPACE_SWITCHER_CHEVRON_CLASS);
    expect(workspaceSwitcherChevronClass(true)).toBe(
      `${WORKSPACE_SWITCHER_CHEVRON_CLASS} ${WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS}`,
    );
    expect(workspaceSwitcherChevronClass(false)).not.toBe(workspaceSwitcherChevronClass(true));
  });

  it("keeps labels flush-left and trails a Sporty Blue check", () => {
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).toContain("justify-between");
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).toContain("px-[var(--space-4)]");
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).not.toMatch(/\b(?:md|max-md):/);
    expect(WORKSPACE_SWITCHER_OPTION_LABEL_CLASS).toContain("text-left");
    expect(WORKSPACE_SWITCHER_OPTION_LABEL_CLASS).toContain("flex-1");
    expect(WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS).toBe("size-4 shrink-0");
    expect(WORKSPACE_SWITCHER_OPTION_CHECK_CLASS).toBe("text-accent");
    expect(WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS).toBe("bg-surface-muted");
    expect(workspaceSwitcherOptionClass(false)).toBe(WORKSPACE_SWITCHER_OPTION_CLASS);
    expect(workspaceSwitcherOptionClass(true)).toBe(
      `${WORKSPACE_SWITCHER_OPTION_CLASS} ${WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS}`,
    );
  });

  it("uses leading marks and the existing Settings door only", () => {
    expect(workspaceSwitcherMarkLetter("aggregation")).toBe("A");
    expect(workspaceSwitcherMarkLetter("social")).toBe("S");
    expect(workspaceSwitcherMarkLetter("education")).toBe("E");
    expect(WORKSPACE_SWITCHER_MARK).toEqual({ aggregation: "A", social: "S", education: "E" });
    expect(WORKSPACE_SWITCHER_MARK_CLASS).toContain("size-6");
    expect(WORKSPACE_SWITCHER_HEADER_MARK_CLASS).toContain("size-8");
    expect(workspaceSwitcherRole("aggregation")).toBe("Catalog");
    expect(workspaceSwitcherRole("social")).toBe(SOCIAL_WORKSPACE);
    expect(workspaceSwitcherRole("education")).toBe("Courses");
    expect(WORKSPACE_SWITCHER_ROLE.social).toBe(SOCIAL_WORKSPACE);
    expect(workspaceSwitcherShowsSettings()).toBe(true);
    expect(workspaceSwitcherSettingsHref("/")).toBe("/settings/aggregation");
    expect(workspaceSwitcherSettingsHref("/social")).toBe("/settings/social");
    expect(workspaceSwitcherSettingsHref("/social/courses")).toBe("/settings/education");
    expect(workspaceSwitcherSettingsHref("/")).toBe(settingsLandHref("/"));
    expect(WORKSPACE_SWITCHER_SETTINGS_CLASS).toContain("t-body-sm");
    expect(WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS).toContain("truncate");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("left-0");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("shadow-none");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).not.toContain("right-0");
    for (const absent of WORKSPACE_SWITCHER_ABSENT) {
      expect(WORKSPACE_SWITCHER).not.toHaveProperty(absent);
    }
  });

  it("reserves one trailing header cluster for the avatar", () => {
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("shrink-0");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("gap-[var(--space-3)]");
  });

  it("keeps the existing workspace cookie write — no second scheme", () => {
    expect(persistWorkspaceCookie.name).toBe("persistWorkspaceCookie");
    expect(workspaceHome("aggregation")).toBe("/");
    expect(workspaceHome("social")).toBe("/social");
  });
});
