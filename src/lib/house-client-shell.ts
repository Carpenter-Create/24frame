import { SOCIAL_HOME_LANE_PARAM, SOCIAL_ROUTES } from "@/lib/social";
import { SOCIAL_CATEGORY_PARAM } from "@/lib/social-categories";
import { SOCIAL_FOLLOWING_WALL_CURSOR_PARAM } from "@/lib/social-home-bounds";
import { EDUCATION_ROOT, HOME_ROOT, SOCIAL_ROOT, STAFF_ROOT } from "@/lib/workspace";

// House client-shell SoT.
// Chrome (dock / rails / workspace switcher) stays mounted in AppShell.
// Visited screens stay mounted in HouseScreenCache. Soft RSC is boot /
// refresh only — a warm dock tap must not wait on a signed-URL waterfall.
//
// Client-owned: Social hot paths + last-visited workspace lands.
// Still RSC: auth gate, first document, Aggregation/Education/Staff first
// visit, and any dest that has never been painted this session.

export const HOUSE_CLIENT_SHELL = {
  cacheCap: 8,
  rscFallbackAttr: "data-house-rsc-fallback",
  screenAttr: "data-house-screen",
  screenActiveAttr: "data-house-screen-active",
} as const;

const HOUSE_EXACT_SCREENS = new Set<string>([
  SOCIAL_ROUTES.home,
  SOCIAL_ROUTES.explore,
  SOCIAL_ROUTES.profile,
  SOCIAL_ROUTES.profileEdit,
  SOCIAL_ROUTES.dms,
  SOCIAL_ROUTES.create,
  SOCIAL_ROUTES.stories,
  HOME_ROOT,
  "/",
]);

export function isHouseClientOwnedPath(pathname: string): boolean {
  if (HOUSE_EXACT_SCREENS.has(pathname)) return true;
  if (pathname.startsWith(`${SOCIAL_ROUTES.profileEdit}/`)) return true;
  if (pathname.startsWith(`${SOCIAL_ROUTES.home}/p/`)) return true;
  if (pathname.startsWith(`${SOCIAL_ROUTES.home}/u/`)) return true;
  if (pathname.startsWith(`${HOME_ROOT}/`)) return true;
  if (pathname.startsWith(`${SOCIAL_ROOT}/`)) return true;
  return false;
}

export function houseScreenKey(pathname: string, search = ""): string {
  const path = pathname || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (path === SOCIAL_ROUTES.home || path === `${SOCIAL_ROUTES.home}/`) {
    const topic = params.get(SOCIAL_CATEGORY_PARAM) ?? "";
    const lane = params.get(SOCIAL_HOME_LANE_PARAM) ?? "";
    const cursor = params.get(SOCIAL_FOLLOWING_WALL_CURSOR_PARAM) ?? "";
    if (!topic && !lane && !cursor) return SOCIAL_ROUTES.home;
    return `${SOCIAL_ROUTES.home}?${new URLSearchParams({
      ...(topic ? { [SOCIAL_CATEGORY_PARAM]: topic } : {}),
      ...(lane ? { [SOCIAL_HOME_LANE_PARAM]: lane } : {}),
      ...(cursor ? { [SOCIAL_FOLLOWING_WALL_CURSOR_PARAM]: cursor } : {}),
    }).toString()}`;
  }
  return path;
}

export function houseHrefKey(href: string): string {
  const url = new URL(href, "https://24frame.local");
  return houseScreenKey(url.pathname, url.search);
}

export function houseWorkspaceLandKey(pathname: string): string {
  if (pathname === "/" || pathname === HOME_ROOT || pathname.startsWith(`${HOME_ROOT}/`)) {
    return HOME_ROOT;
  }
  if (pathname === SOCIAL_ROOT || pathname.startsWith(`${SOCIAL_ROOT}/`)) return SOCIAL_ROOT;
  if (pathname === EDUCATION_ROOT || pathname.startsWith(`${EDUCATION_ROOT}/`)) return EDUCATION_ROOT;
  if (pathname === STAFF_ROOT || pathname.startsWith(`${STAFF_ROOT}/`)) return STAFF_ROOT;
  if (pathname.startsWith("/aggregation") || pathname.startsWith("/titles")) return "/aggregation";
  return pathname;
}

export function parseHouseHref(href: string): { pathname: string; search: string } {
  const url = new URL(href, "https://24frame.local");
  return { pathname: url.pathname, search: url.search };
}

export function housePathFromLocation(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export function houseShouldClientNavigate(
  dest: string,
  cachedKeys: Iterable<string>,
): boolean {
  if (!isHouseClientOwnedPath(parseHouseHref(dest).pathname)) return false;
  return new Set(cachedKeys).has(houseHrefKey(dest));
}

const paintedScreens = new Set<string>();

export function houseRememberPainted(key: string): string[] {
  const next = [key, ...[...paintedScreens].filter((item) => item !== key)].slice(
    0,
    HOUSE_CLIENT_SHELL.cacheCap,
  );
  paintedScreens.clear();
  for (const item of next) paintedScreens.add(item);
  return next;
}

export function houseForgetUnlisted(keys: readonly string[]): void {
  const keep = new Set(keys);
  for (const key of [...paintedScreens]) {
    if (!keep.has(key)) paintedScreens.delete(key);
  }
}

export function housePaintedKeys(): string[] {
  return [...paintedScreens];
}

export function resetHousePaintedForTests(): void {
  paintedScreens.clear();
}
