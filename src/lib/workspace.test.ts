import { describe, expect, it } from "vitest";

import {
  isEducationPath,
  isSocialPath,
  parseWorkspaceCookie,
  resolveWorkspaceMode,
  WORKSPACE_COOKIE,
  workspaceCookieWrite,
  workspaceHome,
} from "./workspace";

describe("workspace mode", () => {
  it("persists aggregation, social, or education in a cookie like the rail collapse", () => {
    expect(WORKSPACE_COOKIE).toBe("24frame_workspace");
    expect(parseWorkspaceCookie(undefined)).toBe("aggregation");
    expect(parseWorkspaceCookie("social")).toBe("social");
    expect(parseWorkspaceCookie("education")).toBe("education");
    expect(parseWorkspaceCookie("nope")).toBe("aggregation");
    expect(workspaceCookieWrite("social")).toContain("24frame_workspace=social");
    expect(workspaceCookieWrite("education")).toContain("24frame_workspace=education");
    expect(workspaceHome("social")).toBe("/social");
    expect(workspaceHome("education")).toBe("/social/courses");
    expect(workspaceHome("aggregation")).toBe("/dashboard");
    expect(workspaceHome("education")).not.toBe("/education");
  });

  it("lets pathname win on destination routes and cookie win on shared ones", () => {
    expect(resolveWorkspaceMode("/social", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/dms/abc", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/leaderboard", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/courses", "aggregation")).toBe("education");
    expect(resolveWorkspaceMode("/social/courses/welcome-to-24frame", "aggregation")).toBe(
      "education",
    );
    expect(isEducationPath("/social/courses")).toBe(true);
    expect(isEducationPath("/social/courses/welcome-to-24frame")).toBe(true);
    expect(isEducationPath("/education")).toBe(true);
    expect(isEducationPath("/education/welcome-to-24frame")).toBe(true);
    expect(isEducationPath("/gc/education")).toBe(false);
    expect(isEducationPath("/social")).toBe(false);
    expect(resolveWorkspaceMode("/education", "aggregation")).toBe("education");
    expect(resolveWorkspaceMode("/education/welcome-to-24frame", "social")).toBe("education");
    expect(isSocialPath("/social/courses")).toBe(false);
    expect(isSocialPath("/social")).toBe(true);
    expect(resolveWorkspaceMode("/messages", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/titles/1", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/dashboard", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/home", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/overview", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/reports", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/analytics", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/earn", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/earn/p1", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/finance", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/settings/profile", "social")).toBe("social");
    expect(resolveWorkspaceMode("/settings/profile", "education")).toBe("education");
    expect(resolveWorkspaceMode("/help", "aggregation")).toBe("aggregation");
    expect(resolveWorkspaceMode("/help", "education")).toBe("education");
  });
});
