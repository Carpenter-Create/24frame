import { describe, expect, it } from "vitest";

import { USER_MENU } from "./user-menu";
import { availableWorkspaceOptions, WORKSPACE_EDUCATION_HREF } from "./workspace-menu";
import {
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
  APP_HEADER_WORKSPACE_PILL_HOST_CLASS,
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_ABSENT,
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS,
  WORKSPACE_SWITCHER_HEADER_CLASS,
  WORKSPACE_SWITCHER_MARK,
  WORKSPACE_SWITCHER_MARK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS,
  WORKSPACE_SWITCHER_PANEL_CLASS,
  WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_PILL_PANEL_CLASS,
  WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS,
  WORKSPACE_SWITCHER_STATIC_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  workspaceSwitcherChevronClass,
  workspaceSwitcherMarkLetter,
  workspaceSwitcherOptionClass,
  workspaceSwitcherOptions,
  workspaceSwitcherPanelClass,
  workspaceSwitcherShowsChevron,
  workspaceSwitcherTriggerClass,
} from "./workspace-switcher";
import { persistWorkspaceCookie, workspaceHome } from "./workspace";

describe("workspace switcher lock", () => {
  it("names the control Workspace and the quiet menu heading Workspaces", () => {
    expect(WORKSPACE_SWITCHER.label).toBe("Workspace");
    expect(WORKSPACE_SWITCHER.label).toBe(USER_MENU.workspace);
    expect(WORKSPACE_SWITCHER.heading).toBe("Workspaces");
    expect(WORKSPACE_SWITCHER).not.toHaveProperty("settings");
    expect(USER_MENU).not.toHaveProperty("workspaceHref");
  });

  it("lists only accessible lanes on Route A /social/courses", () => {
    expect(workspaceSwitcherOptions().map((option) => option.label)).toEqual([
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(workspaceSwitcherOptions().map((option) => option.href)).toEqual([
      "/dashboard",
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

  it("keeps the chevron hidden at rest on md+ and always-on for phone", () => {
    expect(WORKSPACE_SWITCHER_TRIGGER_CLASS).toContain("group");
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("opacity-0");
    expect(WORKSPACE_SWITCHER_CHEVRON_CLASS).toContain("max-md:opacity-100");
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

  it("uses leading row marks and a quiet Workspaces heading — no identity header or Settings", () => {
    expect(workspaceSwitcherMarkLetter("aggregation")).toBe("A");
    expect(workspaceSwitcherMarkLetter("social")).toBe("S");
    expect(workspaceSwitcherMarkLetter("education")).toBe("E");
    expect(WORKSPACE_SWITCHER_MARK).toEqual({ aggregation: "A", social: "S", education: "E" });
    expect(WORKSPACE_SWITCHER_MARK_CLASS).toContain("size-6");
    expect(WORKSPACE_SWITCHER_HEADER_CLASS).toContain("t-label");
    expect(WORKSPACE_SWITCHER_HEADER_CLASS).toContain("text-ink-3");
    expect(WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS).toContain("truncate");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("right-0");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("shadow-none");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).not.toContain("left-0");
    for (const absent of WORKSPACE_SWITCHER_ABSENT) {
      expect(WORKSPACE_SWITCHER).not.toHaveProperty(absent);
    }
  });

  it("reserves a phone leading pill after the hamburger and a desktop trailing cluster", () => {
    expect(APP_HEADER_LEADING_CLASS).toContain("gap-[var(--space-2)]");
    expect(APP_HEADER_WORKSPACE_PILL_HOST_CLASS).toBe("shrink-0 md:hidden");
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toBe("hidden md:contents");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("shrink-0");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("gap-[var(--space-2)]");
    expect(workspaceSwitcherTriggerClass("pill")).toBe(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS);
    expect(workspaceSwitcherTriggerClass("plain")).toBe(WORKSPACE_SWITCHER_TRIGGER_CLASS);
    expect(workspaceSwitcherPanelClass("pill")).toBe(WORKSPACE_SWITCHER_PILL_PANEL_CLASS);
    expect(workspaceSwitcherPanelClass()).toBe(WORKSPACE_SWITCHER_PANEL_CLASS);
    expect(workspaceSwitcherChevronClass(false, "pill")).toBe(WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS);
    expect(workspaceSwitcherChevronClass(true, "pill")).toBe(WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS);
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("border-hairline");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("bg-surface-muted");
    expect(WORKSPACE_SWITCHER_PILL_PANEL_CLASS).toContain("left-0");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).toContain("right-0");
    expect(WORKSPACE_SWITCHER_PANEL_CLASS).not.toContain("left-0");
  });

  it("keeps the existing workspace cookie write — no second scheme", () => {
    expect(persistWorkspaceCookie.name).toBe("persistWorkspaceCookie");
    expect(workspaceHome("aggregation")).toBe("/dashboard");
    expect(workspaceHome("social")).toBe("/social");
  });
});
