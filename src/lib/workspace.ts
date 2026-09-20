// One 24Frame account, three workspace destinations. Cookie persists the
// last chosen mode the same way 24frame_sidebar_collapsed persists the
// rail. Pathname still wins on destination routes so a /social bookmark
// shows Social destinations even if the cookie still says aggregation.
//
// Adam lock 2026-09-18: workspace owns the first path segment.
//   Home         /home
//   Aggregation  /aggregation
//   Social       /social
//   Education    /education
// Home is Home-owned — never nest /home under /aggregation. /home/news
// still uses Aggregation chrome so a Social cookie cannot steal it.
// Not a fifth workspace.
//
// Education: member browse/consume and staff CMS share the /education
// prefix. Role gates chrome, not a parallel product. Member land is
// /education. Staff CMS is /education/manage (collision at /education
// and /education/[slug] forced that one documented staff subpath).
//
// Adam amend 2026-09-18: no leftover redirects. 24Frame has no users
// yet. Hard-cut to these prefixes only.
// Founder lock 2026-09-19: signed-in default land is /home
// (AUTH_DEFAULT_NEXT). `/` hops to that SoT — not Aggregation dashboard.
//
// Adam lock 2026-09-19: Co-Productions is /co-productions — Home-pattern
// lead land, not a workspace cookie mode. Do not add it to WorkspaceMode
// or WORKSPACE_MODES.
//
// Adam lock 2026-09-19: Activity is chrome-level /activity. Cookie
// wins (same as /settings and /help). Do not treat it as Aggregation.
//
// Adam lock 2026-09-19: Get Help is chrome-level /help. Cookie still
// wins for resolveWorkspaceMode so a Social/Education cookie is not
// rewritten. Do not nest /education/help or treat Help as Education.
// Account chrome leaves workspace thumbs idle and hides the product
// rail (overviewLeadSelected + AppShell).

export const WORKSPACE_COOKIE = "24frame_workspace";

export type WorkspaceMode = "aggregation" | "social" | "education";

export const WORKSPACE_MODES = ["aggregation", "social", "education"] as const;

export const AGGREGATION_ROOT = "/aggregation";
export const HOME_ROOT = "/home";
export const SOCIAL_ROOT = "/social";
export const EDUCATION_ROOT = "/education";
export const EDUCATION_MANAGE_SEGMENT = "manage";

export const AGGREGATION_HOME_SEGMENT = "dashboard";

export function aggregationPath(...segments: string[]): string {
  const parts = segments
    .flatMap((segment) => segment.split("/"))
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "aggregation");
  return parts.length === 0 ? AGGREGATION_ROOT : `${AGGREGATION_ROOT}/${parts.join("/")}`;
}

export function parseWorkspaceCookie(value: string | undefined | null): WorkspaceMode {
  if (value === "social") return "social";
  if (value === "education") return "education";
  return "aggregation";
}

export function workspaceHome(mode: WorkspaceMode): string {
  if (mode === "social") return SOCIAL_ROOT;
  if (mode === "education") return EDUCATION_ROOT;
  return aggregationPath(AGGREGATION_HOME_SEGMENT);
}

export function isEducationManagePath(pathname: string): boolean {
  const manage = `${EDUCATION_ROOT}/${EDUCATION_MANAGE_SEGMENT}`;
  return pathname === manage || pathname.startsWith(`${manage}/`);
}

export function isEducationPath(pathname: string): boolean {
  return pathname === EDUCATION_ROOT || pathname.startsWith(`${EDUCATION_ROOT}/`);
}

export function isSocialPath(pathname: string): boolean {
  if (isEducationPath(pathname)) return false;
  return pathname === SOCIAL_ROOT || pathname.startsWith(`${SOCIAL_ROOT}/`);
}

export function isHomePath(pathname: string): boolean {
  return pathname === HOME_ROOT || pathname.startsWith(`${HOME_ROOT}/`);
}

export function isAggregationPath(pathname: string): boolean {
  if (pathname === "/" || pathname === AGGREGATION_ROOT || pathname.startsWith(`${AGGREGATION_ROOT}/`)) {
    return true;
  }
  return isHomePath(pathname);
}

export function isAggregationNavActive(
  pathname: string,
  canonicalHref: string,
  exact = false,
): boolean {
  if (exact) {
    return pathname === canonicalHref || pathname === "/";
  }
  return pathname === canonicalHref || pathname.startsWith(`${canonicalHref}/`);
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
