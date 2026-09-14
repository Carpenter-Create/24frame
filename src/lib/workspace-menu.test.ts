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
  it("lists Aggregation and Social — Education stays HOLD without a route", () => {
    expect(WORKSPACE_MENU.title).toBe("Workspace");
    expect(WORKSPACE_MENU.title).toBe(USER_MENU.workspace);
    expect(WORKSPACE_MENU.back).toBe("Back");
    expect(WORKSPACE_MENU.back).not.toBe("Back to main menu");
    expect(WORKSPACE_MENU_CANDIDATES.map((option) => option.id)).toEqual([
      "aggregation",
      "social",
      "education",
    ]);
    expect(WORKSPACE_MENU_CANDIDATES.map((option) => option.label)).toEqual([
      "Aggregation",
      "Social",
      "Education",
    ]);
    expect(workspaceCandidateAccessible("aggregation")).toBe(true);
    expect(workspaceCandidateAccessible("social")).toBe(true);
    expect(workspaceCandidateAccessible("education")).toBe(false);
    expect(WORKSPACE_FLYOUT_OPTIONS.map((option) => option.mode)).toEqual([
      "aggregation",
      "social",
    ]);
    expect(WORKSPACE_FLYOUT_OPTIONS.map((option) => option.label)).toEqual([
      "Aggregation",
      "Social",
    ]);
    expect(availableWorkspaceOptions().map((option) => option.label)).toEqual([
      "Aggregation",
      "Social",
    ]);
    expect(availableWorkspaceOptions().map((option) => option.href)).toEqual(["/", "/social"]);
    expect(availableWorkspaceOptions().map((option) => option.label)).not.toContain(
      WORKSPACE_EDUCATION_LABEL,
    );
    expect(WORKSPACE_EDUCATION_HREF).toBeNull();
    expect(WORKSPACE_EDUCATION_LABEL).toBe("Education");
    expect(existsSync(join(here, "../app/(app)/education/page.tsx"))).toBe(false);
    expect(existsSync(join(here, "../app/(app)/account/workspace/page.tsx"))).toBe(false);
    expect(WORKSPACE_MENU).not.toHaveProperty("href");
    expect(workspaceModeLabel("aggregation")).toBe("Aggregation");
    expect(workspaceModeLabel("social")).toBe("Social");
  });
});
