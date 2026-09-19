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
// (and leftover /news) still uses Aggregation chrome so a Social cookie
// cannot steal it. Not a fifth workspace.
//
// Education: member browse/consume and staff CMS share the /education
// prefix. Role gates chrome, not a parallel product. Member land is
// /education. Staff CMS is /education/manage (collision at /education
// and /education/[slug] forced that one documented staff subpath).
// Legacy /social/courses is a redirect source only.

export const WORKSPACE_COOKIE = "24frame_workspace";

export type WorkspaceMode = "aggregation" | "social" | "education";

export const WORKSPACE_MODES = ["aggregation", "social", "education"] as const;

export const AGGREGATION_ROOT = "/aggregation";
export const HOME_ROOT = "/home";
export const SOCIAL_ROOT = "/social";
export const EDUCATION_ROOT = "/education";
export const EDUCATION_MANAGE_SEGMENT = "manage";

export const AGGREGATION_HOME_SEGMENT = "dashboard";

/**
 * Former first-segment Aggregation destinations. Redirect sources only.
 * /home and /news stay Home-owned and are not in this list.
 */
export const LEGACY_AGGREGATION_PREFIXES = [
  "/dashboard",
  "/overview",
  "/titles",
  "/attention",
  "/activity",
  "/deliveries",
  "/catalog-health",
  "/reports",
  "/analytics",
  "/earn",
  "/finance",
  "/messages",
  "/queue",
  "/avails",
  "/vendors",
  "/channels",
  "/gc",
] as const;

export const LEGACY_EDUCATION_PREFIX = "/social/courses";

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

export function isLegacyEducationPath(pathname: string): boolean {
  return pathname === LEGACY_EDUCATION_PREFIX || pathname.startsWith(`${LEGACY_EDUCATION_PREFIX}/`);
}

export function isEducationManagePath(pathname: string): boolean {
  const manage = `${EDUCATION_ROOT}/${EDUCATION_MANAGE_SEGMENT}`;
  return pathname === manage || pathname.startsWith(`${manage}/`);
}

export function isEducationPath(pathname: string): boolean {
  return (
    pathname === EDUCATION_ROOT ||
    pathname.startsWith(`${EDUCATION_ROOT}/`) ||
    isLegacyEducationPath(pathname)
  );
}

export function isSocialPath(pathname: string): boolean {
  if (isEducationPath(pathname)) return false;
  return pathname === SOCIAL_ROOT || pathname.startsWith(`${SOCIAL_ROOT}/`);
}

export function isHomePath(pathname: string): boolean {
  return (
    pathname === HOME_ROOT ||
    pathname.startsWith(`${HOME_ROOT}/`) ||
    pathname === "/news" ||
    pathname.startsWith("/news/")
  );
}

export function isLegacyAggregationPath(pathname: string): boolean {
  return LEGACY_AGGREGATION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAggregationPath(pathname: string): boolean {
  if (pathname === "/" || pathname === AGGREGATION_ROOT || pathname.startsWith(`${AGGREGATION_ROOT}/`)) {
    return true;
  }
  if (isHomePath(pathname)) return true;
  return isLegacyAggregationPath(pathname);
}

/** True when pathname is the canonical href or its pre-prefix leftover. */
export function isAggregationCanonicalOrLegacy(pathname: string, canonicalHref: string): boolean {
  if (pathname === canonicalHref || pathname.startsWith(`${canonicalHref}/`)) return true;
  if (canonicalHref === aggregationPath(AGGREGATION_HOME_SEGMENT) && pathname === "/") return true;
  if (!canonicalHref.startsWith(`${AGGREGATION_ROOT}/`)) return false;
  const rest = canonicalHref.slice(AGGREGATION_ROOT.length);
  return pathname === rest || pathname.startsWith(`${rest}/`);
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
