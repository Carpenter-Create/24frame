"use client";

import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  HOUSE_CLIENT_SHELL,
  houseForgetUnlisted,
  houseHrefKey,
  housePaintedKeys,
  housePathFromLocation,
  houseReconcileOwnedHref,
  houseRememberPainted,
  houseScreenKey,
  houseShouldClientNavigate,
  houseTouchOrder,
  parseHouseHref,
} from "@/lib/house-client-shell";
import { houseNavIgnorePendingClick, type HouseNavClickLike } from "@/lib/house-nav-pending";

type HouseClientApi = {
  pathname: string;
  search: string;
  href: string;
  screenKey: string;
  hasScreen: (href: string) => boolean;
  navigateOwned: (href: string, event?: HouseNavClickLike) => boolean;
};

type ScreenStore = {
  order: string[];
  nodes: Record<string, ReactNode>;
};

const EMPTY_STORE: ScreenStore = { order: [], nodes: {} };

const HouseClientContext = createContext<HouseClientApi | null>(null);

export function useHousePathname(): string {
  const house = useContext(HouseClientContext);
  const next = usePathname();
  return house?.pathname ?? next;
}

export function useHouseClient(): HouseClientApi | null {
  return useContext(HouseClientContext);
}

export function isHouseRscFallback(node: ReactNode): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.some(isHouseRscFallback);
  if (!isValidElement(node)) return false;
  const props = node.props as { [HOUSE_CLIENT_SHELL.rscFallbackAttr]?: unknown; children?: ReactNode };
  if (props[HOUSE_CLIENT_SHELL.rscFallbackAttr] !== undefined) return true;
  return isHouseRscFallback(props.children);
}

function nextScreenStore(store: ScreenStore, key: string, node: ReactNode): ScreenStore {
  if (store.nodes[key] === node && store.order[0] === key) return store;
  const order = houseTouchOrder(store.order, key);
  const nodes: Record<string, ReactNode> = { [key]: node };
  for (const item of order) {
    if (item !== key && item in store.nodes) nodes[item] = store.nodes[item];
  }
  return { order, nodes };
}

function touchScreenStore(store: ScreenStore, key: string): ScreenStore {
  if (!(key in store.nodes) || store.order[0] === key) return store;
  const order = houseTouchOrder(store.order, key);
  const nodes: Record<string, ReactNode> = {};
  for (const item of order) {
    if (item in store.nodes) nodes[item] = store.nodes[item];
  }
  return { order, nodes };
}

export function HousePathProvider({ children }: { children: ReactNode }) {
  const nextPath = usePathname();
  const nextSearchParams = useSearchParams();
  const nextSearch = nextSearchParams.toString();
  const nextSearchPrefixed = nextSearch ? `?${nextSearch}` : "";
  const nextHref = housePathFromLocation(nextPath, nextSearchPrefixed);
  const [ownedHref, setOwnedHref] = useState<string | null>(null);
  const [seenNextHref, setSeenNextHref] = useState(nextHref);

  const reconciled = houseReconcileOwnedHref(ownedHref, nextHref, seenNextHref);
  if (reconciled !== ownedHref) {
    setOwnedHref(reconciled);
  }
  if (houseHrefKey(seenNextHref) !== houseHrefKey(nextHref)) {
    setSeenNextHref(nextHref);
  }

  const href = ownedHref ?? nextHref;
  const parsed = parseHouseHref(href);
  const screenKey = houseScreenKey(parsed.pathname, parsed.search);

  const api = useMemo<HouseClientApi>(
    () => ({
      pathname: parsed.pathname,
      search: parsed.search,
      href,
      screenKey,
      hasScreen: (dest: string) => houseShouldClientNavigate(dest, housePaintedKeys()),
      navigateOwned: (dest: string, event?: HouseNavClickLike) => {
        if (event && houseNavIgnorePendingClick(event)) return false;
        if (!houseShouldClientNavigate(dest, housePaintedKeys())) return false;
        const parsedDest = parseHouseHref(dest);
        const next = housePathFromLocation(parsedDest.pathname, parsedDest.search);
        if (next === href) return true;
        window.history.pushState({ houseClient: true }, "", next);
        setOwnedHref(next);
        return true;
      },
    }),
    [href, parsed.pathname, parsed.search, screenKey, setOwnedHref],
  );

  useEffect(() => {
    const onPop = () => {
      setOwnedHref(`${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onClick = (event: globalThis.MouseEvent) => {
      if (houseNavIgnorePendingClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;
      let dest: string;
      try {
        const url = new URL(raw, window.location.origin);
        if (url.origin !== window.location.origin) return;
        dest = `${url.pathname}${url.search}`;
      } catch {
        return;
      }
      if (!api.navigateOwned(dest, event)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [api]);

  return <HouseClientContext.Provider value={api}>{children}</HouseClientContext.Provider>;
}

export function HouseScreenCache({ children }: { children: ReactNode }) {
  const nextPath = usePathname();
  const nextSearchParams = useSearchParams();
  const nextSearch = nextSearchParams.toString();
  const nextSearchPrefixed = nextSearch ? `?${nextSearch}` : "";
  const nextKey = houseScreenKey(nextPath, nextSearchPrefixed);
  const house = useHouseClient();
  const [store, setStore] = useState<ScreenStore>(EMPTY_STORE);
  const fallback = isHouseRscFallback(children);
  const activeKey = house?.screenKey ?? nextKey;

  let nextStore = store;
  if (!fallback && !(nextKey in store.nodes)) {
    nextStore = nextScreenStore(store, nextKey, children);
  }
  if (activeKey in nextStore.nodes) {
    nextStore = touchScreenStore(nextStore, activeKey);
  }
  if (nextStore !== store) {
    setStore(nextStore);
    houseRememberPainted(nextStore.order[0] ?? activeKey);
    houseForgetUnlisted(nextStore.order);
  }

  const known = activeKey in nextStore.nodes;
  // Unknown dest: paint the live RSC (or its loading.tsx). Known dest: the
  // mounted tree wins — never overwrite a warm screen with a skeleton.
  const ingress = known ? null : children;

  return (
    <>
      {nextStore.order.map((key) => (
        <div
          key={key}
          hidden={key !== activeKey}
          inert={key !== activeKey ? true : undefined}
          {...{ [HOUSE_CLIENT_SHELL.screenAttr]: key }}
          {...(key === activeKey ? { [HOUSE_CLIENT_SHELL.screenActiveAttr]: "" } : {})}
        >
          {nextStore.nodes[key]}
        </div>
      ))}
      {ingress}
    </>
  );
}

export function houseOwnedClick(
  href: string,
  event: MouseEvent<HTMLElement> | HouseNavClickLike | undefined,
  navigateOwned: ((dest: string, click?: HouseNavClickLike) => boolean) | undefined,
): boolean {
  if (!navigateOwned) return false;
  return navigateOwned(href, event);
}
