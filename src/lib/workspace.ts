// One 24Frame account, three workspace destinations. Cookie persists the
// last chosen mode the same way 24frame_sidebar_collapsed persists the
// rail. Pathname still wins on destination routes so a /social bookmark
// shows Social destinations even if the cookie still says aggregation.
// Education land is Route A /social/courses — do not invent /education.

export const WORKSPACE_COOKIE = "24frame_workspace";

export type WorkspaceMode = "aggregation" | "social" | "education";

export const WORKSPACE_MODES = ["aggregation", "social", "education"] as const;

const AGGREGATION_PREFIXES = [
  "/titles",
  "/deliveries",
  "/catalog-health",
  "/messages",
  "/queue",
  "/vendors",
  "/gc",
] as const;

export function parseWorkspaceCookie(value: string | undefined | null): WorkspaceMode {
  if (value === "social") return "social";
  if (value === "education") return "education";
  return "aggregation";
}

export function workspaceHome(mode: WorkspaceMode): string {
  if (mode === "social") return "/social";
  if (mode === "education") return "/social/courses";
  return "/";
}

export function isEducationPath(pathname: string): boolean {
  return pathname === "/social/courses" || pathname.startsWith("/social/courses/");
}

export function isSocialPath(pathname: string): boolean {
  if (isEducationPath(pathname)) return false;
  return pathname === "/social" || pathname.startsWith("/social/");
}

export function isAggregationPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return AGGREGATION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveWorkspaceMode(pathname: string, cookie: WorkspaceMode): WorkspaceMode {
  if (isEducationPath(pathname)) return "education";
  if (isSocialPath(pathname)) return "social";
  if (isAggregationPath(pathname)) return "aggregation";
  return cookie;
}

export function workspaceCookieWrite(mode: WorkspaceMode): string {
  return `${WORKSPACE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}

export function persistWorkspaceCookie(mode: WorkspaceMode): void {
  document.cookie = workspaceCookieWrite(mode);
}
