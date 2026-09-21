"use client";

import {
  createContext,
  isValidElement,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  houseReadScroll,
  houseReconcileOwnedHref,
  houseRememberPainted,
  houseRememberScroll,
  houseScreenKey,
  houseShouldClientNavigate,
  houseShouldKeepAlive,
  houseTouchOrder,
  parseHouseHref,
} from "@/lib/house-client-shell";
import { houseNavIgnorePendingClick, type HouseNavClickLike } from "@/lib/house-nav-pending";

type HouseClientApi = {
  pathname: string;
  search: string;
  href: string;
  screenKey: string;
  nextPathname: string;
  nextSearch: string;
  nextKey: string;
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

function captureLeadScroll(key: string): void {
  const scroller = document.querySelector(`[${HOUSE_CLIENT_SHELL.scrollAttr}]`);
  if (scroller instanceof HTMLElement) houseRememberScroll(key, scroller.scrollTop);
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

// useSearchParams must stay in this gated child. Always-mounted chrome
// and static Settings RSC (agreements, theme, refer, …) prerender
// through the empty-search fallback. Do not call the hook from
// HouseScreenCache or AppShell.
export function HousePathProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<HousePathProviderCore nextSearch="">{children}</HousePathProviderCore>}>
      <HousePathSearchBound>{children}</HousePathSearchBound>
    </Suspense>
  );
}

function HousePathSearchBound({ children }: { children: ReactNode }) {
  const nextSearchParams = useSearchParams();
  const nextSearch = nextSearchParams.toString();
  return (
    <HousePathProviderCore nextSearch={nextSearch ? `?${nextSearch}` : ""}>
      {children}
    </HousePathProviderCore>
  );
}

function HousePathProviderCore({
  children,
  nextSearch,
}: {
  children: ReactNode;
  nextSearch: string;
}) {
  const nextPath = usePathname();
  const nextHref = housePathFromLocation(nextPath, nextSearch);
  const nextKey = houseScreenKey(nextPath, nextSearch);
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
      nextPathname: nextPath,
      nextSearch,
      nextKey,
      hasScreen: (dest: string) => houseShouldClientNavigate(dest, housePaintedKeys()),
      navigateOwned: (dest: string, event?: HouseNavClickLike) => {
        if (event && houseNavIgnorePendingClick(event)) return false;
        if (!houseShouldClientNavigate(dest, housePaintedKeys())) return false;
        const parsedDest = parseHouseHref(dest);
        const next = housePathFromLocation(parsedDest.pathname, parsedDest.search);
        if (next === href) return true;
        captureLeadScroll(screenKey);
        window.history.pushState({ houseClient: true }, "", next);
        setOwnedHref(next);
        return true;
      },
    }),
    [href, nextKey, nextPath, nextSearch, parsed.pathname, parsed.search, screenKey],
  );

  useEffect(() => {
    const onPop = () => {
      captureLeadScroll(screenKey);
      setOwnedHref(`${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [screenKey]);

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
      if (houseHrefKey(dest) !== screenKey) captureLeadScroll(screenKey);
      if (!api.navigateOwned(dest, event)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [api, screenKey]);

  return <HouseClientContext.Provider value={api}>{children}</HouseClientContext.Provider>;
}

export function HouseScreenCache({ children }: { children: ReactNode }) {
  const fallbackPath = usePathname();
  const house = useHouseClient();
  const nextPath = house?.nextPathname ?? fallbackPath;
  const nextKey = house?.nextKey ?? houseScreenKey(nextPath, house?.nextSearch ?? "");
  const [store, setStore] = useState<ScreenStore>(EMPTY_STORE);
  const previousKey = useRef<string | null>(null);
  const fallback = isHouseRscFallback(children);
  const activeKey = house?.screenKey ?? nextKey;

  let nextStore = store;
  if (!fallback && houseShouldKeepAlive(nextPath) && !(nextKey in store.nodes)) {
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

  useEffect(() => {
    const scroller = document.querySelector(`[${HOUSE_CLIENT_SHELL.scrollAttr}]`);
    if (!(scroller instanceof HTMLElement)) {
      previousKey.current = activeKey;
      return;
    }
    const from = previousKey.current;
    if (from && from !== activeKey) {
      scroller.scrollTop = houseReadScroll(activeKey);
    }
    previousKey.current = activeKey;
  }, [activeKey]);

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
