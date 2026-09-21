import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  HOUSE_CLIENT_SHELL,
  houseHrefKey,
  housePaintedKeys,
  houseReadScroll,
  houseReconcileOwnedHref,
  houseRememberPainted,
  houseRememberScroll,
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
