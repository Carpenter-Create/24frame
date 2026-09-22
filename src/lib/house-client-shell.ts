import { SOCIAL_ACTIVITY_PILL_PARAM } from "@/lib/social-activity";
import {
  SOCIAL_CREATE_KIND_PARAM,
  SOCIAL_FOLLOWS_SEARCH_PARAM,
  SOCIAL_HOME_LANE_PARAM,
  SOCIAL_PROFILE_TAB_PARAM,
  SOCIAL_ROUTES,
} from "@/lib/social";
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
  scrollAttr: "data-house-lead-scroll",
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

export function houseShouldKeepAlive(pathname: string): boolean {
  // Live capture keeps camera/mic on mount. Hidden keep-alive would
  // leave the stream open after a dock tap. Cold RSC remounts those dests.
  return pathname !== SOCIAL_ROUTES.createLive && pathname !== SOCIAL_ROUTES.storiesNew;
}

export function houseScreenQueryNames(pathname: string): readonly string[] {
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname || "/";
  if (path === SOCIAL_ROUTES.home) {
    return [SOCIAL_CATEGORY_PARAM, SOCIAL_HOME_LANE_PARAM, SOCIAL_FOLLOWING_WALL_CURSOR_PARAM];
  }
  if (path === SOCIAL_ROUTES.explore || path === SOCIAL_ROUTES.search) {
    return ["q"];
  }
  if (path === SOCIAL_ROUTES.create) return [SOCIAL_CREATE_KIND_PARAM];
  if (path === SOCIAL_ROUTES.profile || /^\/social\/u\/[^/]+$/.test(path)) {
    return [SOCIAL_PROFILE_TAB_PARAM, SOCIAL_ACTIVITY_PILL_PARAM];
  }
  if (path.startsWith("/social/u/") && path.endsWith("/follows")) {
    return [SOCIAL_PROFILE_TAB_PARAM, SOCIAL_FOLLOWS_SEARCH_PARAM];
  }
  if (path === HOME_ROOT || path === "/") return ["period"];
  return [];
}

export function houseScreenKey(pathname: string, search = ""): string {
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const picked = new URLSearchParams();
  for (const name of houseScreenQueryNames(path)) {
    const value = params.get(name)?.trim() ?? "";
    if (value) picked.set(name, value);
  }
  const query = picked.toString();
  return query ? `${path}?${query}` : path;
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
  const parsed = parseHouseHref(dest);
  if (!isHouseClientOwnedPath(parsed.pathname)) return false;
  if (!houseShouldKeepAlive(parsed.pathname)) return false;
  return new Set(cachedKeys).has(houseHrefKey(dest));
}

export type HouseNavHop = "stay" | "owned" | "refresh-next" | "next";

/**
 * Dock tap while a warm hop has the App Router pathname stuck on the
 * previous screen. A cached dest switches in place. An uncached dest
 * whose Next pathname already matches must refresh — a plain Link
 * click is a no-op. Otherwise Next navigates.
 */
export function houseNavHop(input: {
  cached: boolean;
  ownedIsDest: boolean;
  nextIsDest: boolean;
}): HouseNavHop {
  if (input.cached) return input.ownedIsDest ? "stay" : "owned";
  if (input.nextIsDest && !input.ownedIsDest) return "refresh-next";
  return "next";
}

/** Focus trapped in a hidden keep-alive screen eats later dock clicks. */
export function houseFocusBelongsToInactiveScreen(
  screenHidden: boolean,
  focusInsideScreen: boolean,
): boolean {
  return screenHidden && focusInsideScreen;
}

export function houseTouchOrder(
  order: readonly string[],
  key: string,
  cap: number = HOUSE_CLIENT_SHELL.cacheCap,
): string[] {
  return [key, ...order.filter((item) => item !== key)].slice(0, cap);
}

// Warm client hops keep ownedHref until Next catches up. A later cold
// Next navigation (uncached dest, form GET, router.push) must drop it
// so chrome and the screen cache follow the live RSC dest.
export function houseReconcileOwnedHref(
  ownedHref: string | null,
  nextHref: string,
  previousNextHref: string,
): string | null {
  if (!ownedHref) return null;
  if (houseHrefKey(ownedHref) === houseHrefKey(nextHref)) return null;
  if (houseHrefKey(nextHref) !== houseHrefKey(previousNextHref)) return null;
  return ownedHref;
}

const paintedScreens = new Set<string>();
const houseScroll = new Map<string, number>();

export function houseRememberScroll(key: string, top: number): void {
  houseScroll.set(key, Math.max(0, top));
}

export function houseReadScroll(key: string): number {
  return houseScroll.get(key) ?? 0;
}

export function houseRememberPainted(key: string): string[] {
  const next = houseTouchOrder([...paintedScreens], key);
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
  houseScroll.clear();
}

/**
 * What the shell last committed for the live RSC slot.
 * `stale` means `child` was still the previous screen's tree when the
 * URL key moved — do not store it under the new key, and keep treating
 * that same reference as stale after the render-phase state restart.
 */
export type HouseChildSeen = {
  key: string;
  child: unknown;
  stale: boolean;
  /**
   * Child that must not be stored under `key`. Set when a warm-hop
   * history entry is restored: its flight data is the screen we left.
   */
  rejected?: unknown;
};

export type HouseFlightHistory = {
  state: unknown;
  href: string;
};

/**
 * Advance the child-seen record and say whether `child` still belongs
 * to the previous URL key.
 *
 * A cold soft-nav flips the key before the RSC slot swaps. The first
 * render (and React's restart after setState during render) must both
 * report stale, or the previous tree is stored under the new key and
 * never replaced. A same-render key+child change is a real landing.
 *
 * `flight` is the live history entry. A warm-hop entry (`houseClient`)
 * whose URL Next has caught up to is not that landing: the restored
 * child is the previous screen, even when the element identity changed.
 * The following distinct page is the fetch and may be stored.
 */
export function houseSyncChildSeen(
  seen: HouseChildSeen | null,
  nextKey: string,
  child: unknown,
  flight: HouseFlightHistory | null = null,
  fallback = false,
): { seen: HouseChildSeen; childrenStale: boolean } {
  const foreign =
    flight !== null && houseClientFlightForeign(flight.state, nextKey, flight.href);
  if (!foreign) {
    if (seen !== null && seen.key === nextKey && seen.child === child) {
      return { seen, childrenStale: seen.stale };
    }
    if (seen !== null && seen.key !== nextKey && seen.child === child) {
      return {
        seen: { key: nextKey, child, stale: true },
        childrenStale: true,
      };
    }
    return {
      seen: { key: nextKey, child, stale: false },
      childrenStale: false,
    };
  }

  if (seen !== null && seen.key === nextKey && seen.child === child && !seen.stale) {
    return { seen, childrenStale: false };
  }
  if (
    !fallback &&
    seen !== null &&
    seen.key === nextKey &&
    seen.rejected !== undefined &&
    seen.rejected !== child
  ) {
    return {
      seen: { key: nextKey, child, stale: false },
      childrenStale: false,
    };
  }
  const rejected =
    seen !== null && seen.key === nextKey && seen.rejected !== undefined ? seen.rejected : child;
  const nextSeen: HouseChildSeen = { key: nextKey, child, stale: true, rejected };
  if (
    seen !== null &&
    seen.key === nextSeen.key &&
    seen.child === nextSeen.child &&
    seen.stale &&
    seen.rejected === nextSeen.rejected
  ) {
    return { seen, childrenStale: true };
  }
  return { seen: nextSeen, childrenStale: true };
}

const NEXT_FLIGHT_TREE_KEY = "__PRIVATE_NEXTJS_INTERNALS_TREE";

/**
 * History entry for a warm client hop.
 *
 * Next 16 patches `history.pushState` and, unless the state is marked
 * `__NA`, dispatches ACTION_RESTORE with the previous FlightRouterState
 * and the new URL. That restore keeps the previous screen mounted while
 * the address bar already shows the dest. `__NA` is the flag Next sets
 * on its own history writes to skip that restore, and it keeps Back from
 * being a full reload.
 *
 * The previous flight tree is not copied. A later Back or Forward would
 * restore it as `children` for the dest URL, and after the dest has been
 * evicted that tree would be stored under the dest key.
 */
export function houseClientHistoryState(prior: unknown): Record<string, unknown> & {
  __NA: true;
  houseClient: true;
} {
  const base =
    prior !== null && typeof prior === "object" ? { ...(prior as Record<string, unknown>) } : {};
  delete base[NEXT_FLIGHT_TREE_KEY];
  return { ...base, __NA: true, houseClient: true };
}

/**
 * True when Next has caught up to a warm-hop history entry.
 * That entry's flight data is the screen we left, not the dest.
 */
export function houseClientFlightForeign(
  historyState: unknown,
  nextKey: string,
  locationHref: string,
): boolean {
  if (historyState === null || typeof historyState !== "object") return false;
  if ((historyState as { houseClient?: unknown }).houseClient !== true) return false;
  return houseHrefKey(locationHref) === nextKey;
}

/** Evicted warm-hop entries must be fetched. A cached dest is already on screen. */
export function houseShouldRefetchHistoryEntry(
  historyState: unknown,
  href: string,
  cachedKeys: Iterable<string>,
): boolean {
  if (historyState === null || typeof historyState !== "object") return false;
  if ((historyState as { houseClient?: unknown }).houseClient !== true) return false;
  return !houseShouldClientNavigate(href, cachedKeys);
}

/**
 * Stable-ingest guard. Returns true only when it is safe to capture
 * live `children` into the keep-alive store under `nextKey`.
 *
 * On a cold Next soft-nav the pathname flips before the RSC slot
 * swaps, so `children` is still the *previous* screen's tree.
 * Ingesting that stale tree under the new key poisons the cache.
 *
 * `childrenStale` comes from `houseSyncChildSeen`.
 */
export function houseCanIngest(
  nextKey: string,
  activeKey: string,
  nextPath: string,
  fallback: boolean,
  storeHasKey: boolean,
  childrenStale: boolean,
): boolean {
  if (fallback) return false;
  if (storeHasKey) return false;
  if (!houseShouldKeepAlive(nextPath)) return false;
  if (activeKey !== nextKey) return false;
  if (childrenStale) return false;
  return true;
}

function houseScreenPath(key: string): string {
  const query = key.indexOf("?");
  return query === -1 ? key : key.slice(0, query);
}

/**
 * Resolves which cached screen to display and whether to paint
 * ingress (live RSC / loading skeleton).
 *
 * When activeKey is not in the store, the live children are either a
 * skeleton or still the previous screen. A path change hides that
 * screen — the URL and rail have moved. A query-only hop stays on the
 * same pathname and does not paint `loading.tsx`, so keep that
 * pathname's lead mounted until the new key is stored.
 */
export function houseResolveDisplay(
  activeKey: string,
  known: boolean,
  fallback: boolean,
  holdKey: string | null = null,
): { displayKey: string | null; showIngress: boolean } {
  if (known) return { displayKey: activeKey, showIngress: false };
  if (fallback) return { displayKey: null, showIngress: true };
  if (
    holdKey &&
    holdKey !== activeKey &&
    houseScreenPath(holdKey) === houseScreenPath(activeKey)
  ) {
    return { displayKey: holdKey, showIngress: false };
  }
  return { displayKey: null, showIngress: false };
}
