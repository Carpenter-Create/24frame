import { describe, expect, it } from "vitest";

import {
  isEducationPath,
  isSocialPath,
  parseWorkspaceCookie,
  resolveWorkspaceMode,
  WORKSPACE_COOKIE,
  WORKSPACE_MODES,
  workspaceCookieWrite,
  workspaceHome,
} from "./workspace";

describe("workspace mode", () => {
  it("persists aggregation, social, or education in a cookie like the rail collapse", () => {
    expect(WORKSPACE_COOKIE).toBe("24frame_workspace");
    expect(WORKSPACE_MODES).toEqual(["aggregation", "social", "education"]);
    expect(WORKSPACE_MODES).not.toContain("news");
    expect(parseWorkspaceCookie(undefined)).toBe("aggregation");
    expect(parseWorkspaceCookie("social")).toBe("social");
    expect(parseWorkspaceCookie("education")).toBe("education");
    expect(parseWorkspaceCookie("nope")).toBe("aggregation");
    expect(workspaceCookieWrite("social")).toContain("24frame_workspace=social");
    expect(workspaceCookieWrite("education")).toContain("24frame_workspace=education");
    expect(workspaceHome("social")).toBe("/social");
    expect(workspaceHome("education")).toBe("/education");
    expect(workspaceHome("aggregation")).toBe("/aggregation/dashboard");
    expect(workspaceHome("education")).not.toBe("/social/courses");
  });

  it("lets pathname win on destination routes and cookie win on shared ones", () => {
    expect(resolveWorkspaceMode("/social", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/dms/abc", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/leaderboard", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/courses", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/courses/welcome-to-24frame", "aggregation")).toBe(
      "social",
    );
    expect(isEducationPath("/social/courses")).toBe(false);
    expect(isEducationPath("/social/courses/welcome-to-24frame")).toBe(false);
    expect(isEducationPath("/education")).toBe(true);
    expect(isEducationPath("/education/welcome-to-24frame")).toBe(true);
    expect(isEducationPath("/education/manage")).toBe(true);
    expect(isEducationPath("/education/manage/orientation")).toBe(true);
    expect(isEducationPath("/gc/education")).toBe(false);
    expect(isEducationPath("/social")).toBe(false);
    expect(resolveWorkspaceMode("/education", "aggregation")).toBe("education");
    expect(resolveWorkspaceMode("/education/welcome-to-24frame", "social")).toBe("education");
    expect(isSocialPath("/social/courses")).toBe(true);
    expect(isSocialPath("/social")).toBe(true);
    expect(resolveWorkspaceMode("/aggregation/dashboard", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/aggregation/reports", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/activity", "social")).toBe("social");
    expect(resolveWorkspaceMode("/activity", "education")).toBe("education");
    expect(resolveWorkspaceMode("/activity", "aggregation")).toBe("aggregation");
    expect(resolveWorkspaceMode("/aggregation/activity", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/home/news", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/home/news", "education")).toBe("aggregation");
    expect(resolveWorkspaceMode("/aggregation/messages", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/aggregation/titles/1", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/home", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/titles", "social")).toBe("social");
    expect(resolveWorkspaceMode("/dashboard", "education")).toBe("education");
    expect(resolveWorkspaceMode("/reports", "education")).toBe("education");
    expect(resolveWorkspaceMode("/settings", "social")).toBe("social");
    expect(resolveWorkspaceMode("/settings/profile", "social")).toBe("social");
    expect(resolveWorkspaceMode("/settings/organization", "education")).toBe("education");
    expect(resolveWorkspaceMode("/settings/preferences", "education")).toBe("education");
    expect(resolveWorkspaceMode("/settings/profile", "education")).toBe("education");
    expect(resolveWorkspaceMode("/help", "aggregation")).toBe("aggregation");
    expect(resolveWorkspaceMode("/help", "education")).toBe("education");
    expect(resolveWorkspaceMode("/co-productions", "social")).toBe("social");
    expect(resolveWorkspaceMode("/co-productions", "education")).toBe("education");
  });
});
