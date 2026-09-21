import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement, isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import FollowsLoading from "@/app/(app)/social/u/[handle]/follows/loading";

import {
  HOUSE_CLIENT_SHELL,
  houseCanIngest,
  houseFocusBelongsToInactiveScreen,
  houseHrefKey,
  houseNavHop,
  housePaintedKeys,
  houseReadScroll,
  houseReconcileOwnedHref,
  houseRememberPainted,
  houseRememberScroll,
  houseResolveDisplay,
  houseScreenKey,
  houseShouldClientNavigate,
  houseShouldKeepAlive,
  houseTouchOrder,
  houseWorkspaceLandKey,
  isHouseClientOwnedPath,
  resetHousePaintedForTests,
} from "@/lib/house-client-shell";
import { isHouseRscFallback } from "@/components/chrome/house-client-shell";
import { SOCIAL_ROUTES } from "@/lib/social";

describe("house client shell SoT", () => {
  it("owns Social hot paths and Home land", () => {
    expect(isHouseClientOwnedPath(SOCIAL_ROUTES.home)).toBe(true);
    expect(isHouseClientOwnedPath(SOCIAL_ROUTES.explore)).toBe(true);
    expect(isHouseClientOwnedPath(SOCIAL_ROUTES.profile)).toBe(true);
    expect(isHouseClientOwnedPath(SOCIAL_ROUTES.profileEdit)).toBe(true);
    expect(isHouseClientOwnedPath(`${SOCIAL_ROUTES.profileEdit}/bio`)).toBe(true);
    expect(isHouseClientOwnedPath("/social/p/11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isHouseClientOwnedPath("/social/u/ada")).toBe(true);
    expect(isHouseClientOwnedPath("/home")).toBe(true);
    expect(isHouseClientOwnedPath("/login")).toBe(false);
  });

  it("keys dests by the query params that change the painted tree", () => {
    expect(houseScreenKey("/social")).toBe("/social");
    expect(houseScreenKey("/social", "?topic=Music")).toBe("/social?topic=Music");
    expect(houseScreenKey("/social/explore", "?q=ada")).toBe("/social/explore?q=ada");
    expect(houseScreenKey("/social/profile", "?tab=credits")).toBe("/social/profile?tab=credits");
    expect(houseScreenKey("/social/profile", "?tab=activity&activity=likes")).toBe(
      "/social/profile?tab=activity&activity=likes",
    );
    expect(houseScreenKey("/social/u/ada/follows", "?tab=following&q=ada")).toBe(
      "/social/u/ada/follows?tab=following&q=ada",
    );
    expect(houseScreenKey("/home", "?period=ytd")).toBe("/home?period=ytd");
    expect(houseHrefKey("/social/explore")).toBe("/social/explore");
    expect(houseShouldClientNavigate("/social/profile?tab=credits", ["/social/profile"])).toBe(false);
    expect(houseWorkspaceLandKey("/social/u/ada")).toBe("/social");
    expect(houseWorkspaceLandKey("/home/news")).toBe("/home");
    expect(HOUSE_CLIENT_SHELL.cacheCap).toBeGreaterThanOrEqual(6);
  });

  it("does not keep live camera dests mounted", () => {
    expect(houseShouldKeepAlive("/social/create/live")).toBe(false);
    expect(houseShouldKeepAlive("/social/stories/new")).toBe(false);
    expect(houseShouldKeepAlive("/social")).toBe(true);
    expect(houseShouldClientNavigate("/social/create/live", ["/social/create/live"])).toBe(false);
  });

  it("remembers scroll per screen key", () => {
    resetHousePaintedForTests();
    houseRememberScroll("/social", 480);
    expect(houseReadScroll("/social")).toBe(480);
    expect(houseReadScroll("/social/explore")).toBe(0);
  });

  it("remembers painted screens for warm client hops", () => {
    resetHousePaintedForTests();
    houseRememberPainted("/social");
    houseRememberPainted("/social/explore");
    expect(housePaintedKeys()[0]).toBe("/social/explore");
    expect(houseShouldClientNavigate("/social", housePaintedKeys())).toBe(true);
    resetHousePaintedForTests();
    expect(houseShouldClientNavigate("/social", housePaintedKeys())).toBe(false);
  });

  it("does not swallow a profile return when Next is stuck on that pathname", () => {
    expect(houseNavHop({ cached: true, ownedIsDest: false, nextIsDest: true })).toBe("owned");
    expect(houseNavHop({ cached: true, ownedIsDest: true, nextIsDest: true })).toBe("stay");
    expect(houseNavHop({ cached: false, ownedIsDest: false, nextIsDest: true })).toBe("refresh-next");
    expect(houseNavHop({ cached: false, ownedIsDest: false, nextIsDest: false })).toBe("next");
    expect(houseFocusBelongsToInactiveScreen(true, true)).toBe(true);
    expect(houseFocusBelongsToInactiveScreen(false, true)).toBe(false);
    expect(houseFocusBelongsToInactiveScreen(true, false)).toBe(false);
  });

  it("client-navigates only when the dest is owned and already mounted", () => {
    const cached = ["/social", "/social/explore", "/social/profile"];
    expect(houseShouldClientNavigate("/social", cached)).toBe(true);
    expect(houseShouldClientNavigate("/social/explore", cached)).toBe(true);
    expect(houseShouldClientNavigate("/social/p/11111111-1111-4111-8111-111111111111", cached)).toBe(
      false,
    );
    expect(houseShouldClientNavigate("/login", cached)).toBe(false);
    expect(houseShouldClientNavigate("/social", [])).toBe(false);
  });

  it("clears owned href when Next navigates to a different dest", () => {
    expect(houseReconcileOwnedHref("/social", "/social", "/social/explore")).toBeNull();
    expect(houseReconcileOwnedHref("/social", "/social/explore", "/social/explore")).toBe(
      "/social",
    );
    expect(houseReconcileOwnedHref("/social", "/social/search", "/social/explore")).toBeNull();
    expect(houseReconcileOwnedHref(null, "/social", "/social")).toBeNull();
  });

  it("touches a revisited screen to the front of the cap", () => {
    expect(houseTouchOrder(["/social", "/social/explore", "/home"], "/home", 8)).toEqual([
      "/home",
      "/social",
      "/social/explore",
    ]);
    expect(houseTouchOrder(["/a", "/b", "/c"], "/d", 3)).toEqual(["/d", "/a", "/b"]);
  });

  it("treats the RSC fallback marker as a skeleton, not a screen", () => {
    const fallback = createElement("div", { "data-house-rsc-fallback": "" }, null);
    expect(isValidElement(fallback)).toBe(true);
    expect(isHouseRscFallback(fallback)).toBe(true);
    expect(isHouseRscFallback(createElement("div", null, "Home"))).toBe(false);
  });
});

describe("houseCanIngest — stable-ingest guard", () => {
  it("blocks ingest when children are stale (pathname-flip render)", () => {
    expect(
      houseCanIngest("/social/profile", "/social/profile", "/social/profile", false, false, true),
    ).toBe(false);
    expect(
      houseCanIngest("/social/explore", "/social/explore", "/social/explore", false, false, true),
    ).toBe(false);
  });

  it("allows ingest once children are fresh (RSC slot has swapped)", () => {
    expect(
      houseCanIngest("/social/profile", "/social/profile", "/social/profile", false, false, false),
    ).toBe(true);
  });

  it("blocks ingest when children is an RSC fallback", () => {
    expect(
      houseCanIngest("/social/profile", "/social/profile", "/social/profile", true, false, false),
    ).toBe(false);
  });

  it("blocks ingest when the key is already in the store", () => {
    expect(
      houseCanIngest("/social/profile", "/social/profile", "/social/profile", false, true, false),
    ).toBe(false);
  });

  it("blocks ingest when activeKey differs from nextKey (warm hop while Next lags)", () => {
    expect(
      houseCanIngest("/social", "/social/profile", "/social", false, false, false),
    ).toBe(false);
  });

  it("blocks ingest for non-keepalive dests", () => {
    expect(
      houseCanIngest("/social/create/live", "/social/create/live", "/social/create/live", false, false, false),
    ).toBe(false);
  });
});

describe("houseResolveDisplay — cold-nav display", () => {
  const storeHas = (keys: string[]) => (k: string) => keys.includes(k);

  it("shows the cached screen when activeKey is known", () => {
    const result = houseResolveDisplay("/social", true, false, null, storeHas(["/social"]));
    expect(result).toEqual({ displayKey: "/social", showIngress: false });
  });

  it("shows ingress (skeleton) when children is an RSC fallback", () => {
    const result = houseResolveDisplay("/social/profile", false, true, "/social", storeHas(["/social"]));
    expect(result).toEqual({ displayKey: null, showIngress: true });
  });

  it("keeps the previous cached screen when children is stale (not fallback, not known)", () => {
    const result = houseResolveDisplay("/social/profile", false, false, "/social", storeHas(["/social"]));
    expect(result).toEqual({ displayKey: "/social", showIngress: false });
  });

  it("returns null displayKey when no previous screen is cached", () => {
    const result = houseResolveDisplay("/social/profile", false, false, null, storeHas([]));
    expect(result).toEqual({ displayKey: null, showIngress: false });
  });

  it("returns null displayKey when previous screen has been evicted", () => {
    const result = houseResolveDisplay("/social/profile", false, false, "/social", storeHas([]));
    expect(result).toEqual({ displayKey: null, showIngress: false });
  });
});

describe("cold-nav poison prevention (integration)", () => {
  it("cold nav must NOT mark the dest painted when children are stale", () => {
    resetHousePaintedForTests();
    houseRememberPainted("/social");

    const nextKey = "/social/profile";
    const canIngest = houseCanIngest(nextKey, nextKey, nextKey, false, false, true);
    expect(canIngest).toBe(false);

    expect(housePaintedKeys()).not.toContain("/social/profile");
    expect(housePaintedKeys()).toContain("/social");
  });

  it("after children refresh, ingest is allowed and housePaintedKeys includes the new key", () => {
    resetHousePaintedForTests();
    const nextKey = "/social/profile";
    const canIngest = houseCanIngest(nextKey, nextKey, nextKey, false, false, false);
    expect(canIngest).toBe(true);

    houseRememberPainted(nextKey);
    expect(housePaintedKeys()).toContain("/social/profile");
  });

  it("fallback children never get remembered as painted", () => {
    resetHousePaintedForTests();
    const canIngest = houseCanIngest(
      "/social/profile",
      "/social/profile",
      "/social/profile",
      true,
      false,
      false,
    );
    expect(canIngest).toBe(false);
    expect(housePaintedKeys()).not.toContain("/social/profile");
  });

  it("warm hop still client-navigates only when key is painted", () => {
    resetHousePaintedForTests();
    houseRememberPainted("/social");
    houseRememberPainted("/social/explore");

    expect(houseShouldClientNavigate("/social/explore", housePaintedKeys())).toBe(true);
    expect(houseShouldClientNavigate("/social/profile", housePaintedKeys())).toBe(false);
  });
});

const FOLLOWS_KEY = houseScreenKey("/social/u/ada/follows", "?tab=following");
const FOLLOWS_PATH = "/social/u/ada/follows";

function walkLoadingFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walkLoadingFiles(path, out);
    else if (name === "loading.tsx") out.push(path);
  }
  return out;
}

function routeFromLoadingFile(file: string): string {
  const route = file
    .replace(/\\/g, "/")
    .replace(/^src\/app\/\(app\)/, "")
    .replace(/\/loading\.tsx$/, "");
  return route || "/";
}

/**
 * Cold Profile → Following. Pathname flips first (stale profile), then
 * loading.tsx, then the resolved list. The shell must paint the skeleton
 * as ingress and store only the resolved list.
 */
function coldFollowsNav(loading: ReactNode, page: ReactNode) {
  const profile = createElement("div", { "data-social-profile": "" }, "profile");
  let nodes: Record<string, ReactNode> = { "/social/profile": profile };
  let order = ["/social/profile"];
  const has = (key: string) => key in nodes;
  const lead = () => order[0] ?? null;

  const apply = (children: ReactNode, stale: boolean) => {
    const fallback = isHouseRscFallback(children);
    if (houseCanIngest(FOLLOWS_KEY, FOLLOWS_KEY, FOLLOWS_PATH, fallback, has(FOLLOWS_KEY), stale)) {
      nodes = { ...nodes, [FOLLOWS_KEY]: children };
      order = [FOLLOWS_KEY, ...order.filter((key) => key !== FOLLOWS_KEY)];
    }
    return houseResolveDisplay(FOLLOWS_KEY, has(FOLLOWS_KEY), fallback, lead(), has);
  };

  return {
    flip: apply(profile, true),
    loading: apply(loading, false),
    page: apply(page, false),
    stored: nodes[FOLLOWS_KEY],
  };
}

describe("follows cold nav leaves the skeleton", () => {
  const page = createElement("div", { "data-social-follows": "" }, "list");

  it("marks every client-owned loading.tsx so the shell cannot cache it", () => {
    const owned = walkLoadingFiles("src/app/(app)").filter((file) =>
      isHouseClientOwnedPath(routeFromLoadingFile(file)),
    );
    expect(owned.length).toBeGreaterThan(0);
    const bare = owned.filter(
      (file) => !readFileSync(file, "utf8").includes(HOUSE_CLIENT_SHELL.rscFallbackAttr),
    );
    expect(bare).toEqual([]);
  });

  it("treats Follows loading as ingress and stores the resolved list", () => {
    const loading = FollowsLoading();
    expect(isHouseRscFallback(loading)).toBe(true);
    const nav = coldFollowsNav(loading, page);
    expect(nav.flip).toEqual({ displayKey: "/social/profile", showIngress: false });
    expect(nav.loading).toEqual({ displayKey: null, showIngress: true });
    expect(nav.page).toEqual({ displayKey: FOLLOWS_KEY, showIngress: false });
    expect(nav.stored).toBe(page);
  });

  it("an unmarked skeleton is stored and blocks the resolved list", () => {
    const unmarked = createElement("div", { "data-social-follows-skeleton": "" });
    expect(isHouseRscFallback(unmarked)).toBe(false);
    const nav = coldFollowsNav(unmarked, page);
    expect(nav.loading).toEqual({ displayKey: FOLLOWS_KEY, showIngress: false });
    expect(nav.page.displayKey).toBe(FOLLOWS_KEY);
    expect(nav.page.showIngress).toBe(false);
    expect(nav.stored).toBe(unmarked);
    expect(nav.stored).not.toBe(page);
  });
});
