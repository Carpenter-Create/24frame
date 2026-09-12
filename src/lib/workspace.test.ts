import { describe, expect, it } from "vitest";

import {
  parseWorkspaceCookie,
  resolveWorkspaceMode,
  WORKSPACE_COOKIE,
  workspaceCookieWrite,
  workspaceHome,
} from "./workspace";

describe("workspace mode", () => {
  it("persists aggregation or social in a cookie like the rail collapse", () => {
    expect(WORKSPACE_COOKIE).toBe("24frame_workspace");
    expect(parseWorkspaceCookie(undefined)).toBe("aggregation");
    expect(parseWorkspaceCookie("social")).toBe("social");
    expect(parseWorkspaceCookie("nope")).toBe("aggregation");
    expect(workspaceCookieWrite("social")).toContain("24frame_workspace=social");
    expect(workspaceHome("social")).toBe("/social");
    expect(workspaceHome("aggregation")).toBe("/");
  });

  it("lets pathname win on destination routes and cookie win on shared ones", () => {
    expect(resolveWorkspaceMode("/social", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/dms/abc", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/social/leaderboard", "aggregation")).toBe("social");
    expect(resolveWorkspaceMode("/messages", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/titles/1", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/", "social")).toBe("aggregation");
    expect(resolveWorkspaceMode("/settings/profile", "social")).toBe("social");
    expect(resolveWorkspaceMode("/help", "aggregation")).toBe("aggregation");
  });
});
