import { describe, expect, it } from "vitest";

import { USER_MENU } from "./user-menu";
import { availableWorkspaceOptions, WORKSPACE_EDUCATION_HREF } from "./workspace-menu";
import {
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_PANEL_CLASS,
  WORKSPACE_SWITCHER_STATIC_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_CLASS,
  workspaceSwitcherOptions,
  workspaceSwitcherShowsChevron,
} from "./workspace-switcher";
import { persistWorkspaceCookie, workspaceHome } from "./workspace";

describe("workspace switcher lock", () => {
  it("reuses the account-menu Workspace word only as the control name", () => {
    expect(WORKSPACE_SWITCHER.label).toBe("Workspace");
    expect(WORKSPACE_SWITCHER.label).toBe(USER_MENU.workspace);
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

  it("keeps the existing workspace cookie write — no second scheme", () => {
    expect(persistWorkspaceCookie.name).toBe("persistWorkspaceCookie");
    expect(workspaceHome("aggregation")).toBe("/");
    expect(workspaceHome("social")).toBe("/social");
  });
});
