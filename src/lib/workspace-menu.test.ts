import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { USER_MENU } from "./user-menu";
import {
  availableWorkspaceOptions,
  WORKSPACE_EDUCATION_HREF,
  WORKSPACE_EDUCATION_LABEL,
  WORKSPACE_FLYOUT_OPTIONS,
  WORKSPACE_MENU,
  WORKSPACE_MENU_CANDIDATES,
  workspaceCandidateAccessible,
  workspaceModeLabel,
} from "./workspace-menu";

const here = dirname(fileURLToPath(import.meta.url));

describe("workspace menu copy", () => {
  it("lists Home, Aggregation, Social, and Education on Route A /social/courses", () => {
    expect(WORKSPACE_MENU.title).toBe("Workspace");
    expect(WORKSPACE_MENU.title).toBe(USER_MENU.workspace);
    expect(WORKSPACE_MENU).not.toHaveProperty("back");
    expect(WORKSPACE_MENU).not.toHaveProperty("href");
    expect(WORKSPACE_MENU_CANDIDATES.map((option) => option.id)).toEqual([
      "overview",
      "aggregation",
      "social",
      "education",
    ]);
    expect(WORKSPACE_MENU_CANDIDATES.map((option) => option.label)).toEqual([
      "Home",
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(workspaceCandidateAccessible("overview")).toBe(true);
    expect(workspaceCandidateAccessible("aggregation")).toBe(true);
    expect(workspaceCandidateAccessible("social")).toBe(true);
    expect(workspaceCandidateAccessible("education")).toBe(true);
    expect(WORKSPACE_FLYOUT_OPTIONS.map((option) => option.mode)).toEqual([
      "overview",
      "aggregation",
      "social",
      "education",
    ]);
    expect(WORKSPACE_FLYOUT_OPTIONS.map((option) => option.label)).toEqual([
      "Home",
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(availableWorkspaceOptions().map((option) => option.label)).toEqual([
      "Home",
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(availableWorkspaceOptions().map((option) => option.href)).toEqual([
      "/home",
      "/dashboard",
      "/social",
      "/social/courses",
    ]);
    expect(WORKSPACE_EDUCATION_HREF).toBe("/social/courses");
    expect(WORKSPACE_EDUCATION_HREF).not.toBe("/education");
    expect(WORKSPACE_EDUCATION_LABEL).toBe("Education");
    expect(existsSync(join(here, "../app/(app)/education/page.tsx"))).toBe(false);
    expect(existsSync(join(here, "../app/(app)/account/workspace/page.tsx"))).toBe(false);
    expect(existsSync(join(here, "../app/(app)/social/courses/lessons/[id]/page.tsx"))).toBe(
      false,
    );
    expect(WORKSPACE_MENU).not.toHaveProperty("href");
    expect(workspaceModeLabel("overview")).toBe("Home");
    expect(workspaceModeLabel("aggregation")).toBe("Aggregation");
    expect(workspaceModeLabel("social")).toBe("Social");
    expect(workspaceModeLabel("education")).toBe("Education");
  });
});
