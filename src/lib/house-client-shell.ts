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
 * `snapshot` is the child tree captured when the URL key moved and that
 * tree had not swapped yet. It stays set across the render-phase
 * restart so the same reference is still stale after setState commits.
 * `child` is the last tree rendered. A child that arrives already
 * different from `child` on the key-change render is not snapshotted.
 */
export type HouseChildSeen = {
  key: string;
  snapshot: unknown;
  child: unknown;
};

/**
 * Stale on the key-change render itself — do not wait for setState.
 *
 * `keyChanged || (guard.key === nextKey && child === snapshot)`.
 * The committed guard still has the previous key on the flip render,
 * so a check that requires `guard.key === nextKey` misses that frame,
 * ingests the previous tree, and `storeHasKey` blocks the real screen.
 */
export function houseSyncChildSeen(
  seen: HouseChildSeen | null,
  nextKey: string,
  child: unknown,
): { seen: HouseChildSeen; childrenStale: boolean } {
  if (seen === null) {
    return { seen: { key: nextKey, snapshot: null, child }, childrenStale: false };
  }

  const keyChanged = seen.key !== nextKey;
  const childrenStale =
    keyChanged ||
    (seen.key === nextKey && seen.snapshot !== null && child === seen.snapshot);

  if (keyChanged) {
    return {
      seen: {
        key: nextKey,
        snapshot: child === seen.child ? child : null,
        child,
      },
      childrenStale,
    };
  }

  if (seen.snapshot !== null && child === seen.snapshot) {
    if (seen.child === child) return { seen, childrenStale };
    return { seen: { ...seen, child }, childrenStale };
  }

  if (seen.snapshot === null && seen.child === child) {
    return { seen, childrenStale };
  }

  return { seen: { key: nextKey, snapshot: null, child }, childrenStale };
}

/**
 * History entry for a warm client hop.
 *
 * Next 16 patches `history.pushState` and, unless the state is marked
 * `__NA`, dispatches ACTION_RESTORE with the *previous* FlightRouterState
 * and the new URL. That restore keeps the previous screen (and its rail
 * selection) mounted while the address bar already shows the dest.
 * `__NA` is the same flag Next sets on its own history writes to skip
 * that restore. The previous flight tree is copied so Back is not a
 * full reload.
 */
export function houseClientHistoryState(prior: unknown): Record<string, unknown> & {
  __NA: true;
  houseClient: true;
} {
  const base =
    prior !== null && typeof prior === "object" ? { ...(prior as Record<string, unknown>) } : {};
  return { ...base, __NA: true, houseClient: true };
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
  storedDiffers = false,
): boolean {
  if (fallback) return false;
  if (storeHasKey && !storedDiffers) return false;
  if (!houseShouldKeepAlive(nextPath)) return false;
  if (activeKey !== nextKey) return false;
  if (childrenStale) return false;
  return true;
}

/**
 * One cache render. Stale is decided from the committed guard before
 * setState. A stale or fallback tree already stored under `nextKey`
 * is dropped. A proven-fresh tree replaces that slot.
 */
export function houseApplyCachedChild<T>(input: {
  seen: HouseChildSeen | null;
  nextKey: string;
  activeKey: string;
  nextPath: string;
  child: T;
  fallback: boolean;
  order: readonly string[];
  nodes: Record<string, T>;
}): {
  seen: HouseChildSeen;
  childrenStale: boolean;
  order: readonly string[];
  nodes: Record<string, T>;
  displayKey: string | null;
  showIngress: boolean;
} {
  const advanced = houseSyncChildSeen(input.seen, input.nextKey, input.child);
  let order = input.order;
  let nodes = input.nodes;

  const poisoned =
    (advanced.childrenStale || input.fallback) &&
    input.nextKey in nodes &&
    nodes[input.nextKey] === input.child;
  if (poisoned) {
    const nextNodes = { ...nodes };
    delete nextNodes[input.nextKey];
    nodes = nextNodes;
    order = order.filter((key) => key !== input.nextKey);
  }

  const has = input.nextKey in nodes;
  const storedDiffers = has && nodes[input.nextKey] !== input.child;
  if (
    houseCanIngest(
      input.nextKey,
      input.activeKey,
      input.nextPath,
      input.fallback,
      has,
      advanced.childrenStale,
      storedDiffers,
    )
  ) {
    const nextOrder = houseTouchOrder(order, input.nextKey);
    const nextNodes: Record<string, T> = { [input.nextKey]: input.child };
    for (const key of nextOrder) {
      if (key !== input.nextKey && key in nodes) nextNodes[key] = nodes[key] as T;
    }
    nodes = nextNodes;
    order = nextOrder;
  }

  if (input.activeKey in nodes && order[0] !== input.activeKey) {
    const nextOrder = houseTouchOrder(order, input.activeKey);
    const nextNodes: Record<string, T> = {};
    for (const key of nextOrder) {
      if (key in nodes) nextNodes[key] = nodes[key] as T;
    }
    nodes = nextNodes;
    order = nextOrder;
  }

  const display = houseResolveDisplay(input.activeKey, input.activeKey in nodes, input.fallback);
  const orderSame =
    order === input.order ||
    (order.length === input.order.length && order.every((key, index) => key === input.order[index]));
  if (advanced.seen === input.seen && nodes === input.nodes && orderSame) {
    return {
      seen: advanced.seen,
      childrenStale: advanced.childrenStale,
      order: input.order,
      nodes: input.nodes,
      displayKey: display.displayKey,
      showIngress: display.showIngress,
    };
  }

  return {
    seen: advanced.seen,
    childrenStale: advanced.childrenStale,
    order,
    nodes,
    displayKey: display.displayKey,
    showIngress: display.showIngress,
  };
}

/**
 * Resolves which cached screen to display and whether to paint
 * ingress (live RSC / loading skeleton).
 *
 * When activeKey is not in the store, the live children are either a
 * skeleton or still the previous screen. Paint the skeleton. Do not
 * keep the previous screen visible — the URL and rail have already
 * moved, and a stuck slot would leave that screen up forever.
 */
export function houseResolveDisplay(
  activeKey: string,
  known: boolean,
  fallback: boolean,
): { displayKey: string | null; showIngress: boolean } {
  if (known) return { displayKey: activeKey, showIngress: false };
  if (fallback) return { displayKey: null, showIngress: true };
  return { displayKey: null, showIngress: false };
}
