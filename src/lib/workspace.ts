// One 24Frame account, two workspaces. Cookie persists the last chosen
// mode the same way gc_sidebar_collapsed persists the rail. Pathname
// still wins on destination routes so a /social bookmark shows Social
// destinations even if the cookie still says aggregation.

export const WORKSPACE_COOKIE = "24frame_workspace";

export type WorkspaceMode = "aggregation" | "social";

export const WORKSPACE_MODES = ["aggregation", "social"] as const;

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
  return value === "social" ? "social" : "aggregation";
}

export function workspaceHome(mode: WorkspaceMode): string {
  return mode === "social" ? "/social" : "/";
}

export function isSocialPath(pathname: string): boolean {
  return pathname === "/social" || pathname.startsWith("/social/");
}

export function isAggregationPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return AGGREGATION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveWorkspaceMode(pathname: string, cookie: WorkspaceMode): WorkspaceMode {
  if (isSocialPath(pathname)) return "social";
  if (isAggregationPath(pathname)) return "aggregation";
  return cookie;
}

export function workspaceCookieWrite(mode: WorkspaceMode): string {
  return `${WORKSPACE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
