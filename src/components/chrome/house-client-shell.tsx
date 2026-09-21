"use client";

import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  HOUSE_CLIENT_SHELL,
  houseHrefKey,
  housePathFromLocation,
  houseScreenKey,
  houseShouldClientNavigate,
  parseHouseHref,
} from "@/lib/house-client-shell";
import { houseNavIgnorePendingClick, type HouseNavClickLike } from "@/lib/house-nav-pending";

type HouseClientApi = {
  pathname: string;
  search: string;
  href: string;
  screenKey: string;
  hasScreen: (href: string) => boolean;
  rememberScreen: (key: string, node: ReactNode) => void;
  syncScreens: (keys: readonly string[]) => void;
  navigateOwned: (href: string, event?: HouseNavClickLike) => boolean;
};

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

function rememberLru(order: string[], key: string, cap: number): string[] {
  const next = [key, ...order.filter((item) => item !== key)];
  return next.slice(0, cap);
}

export function HousePathProvider({ children }: { children: ReactNode }) {
  const nextPath = usePathname();
  const nextSearchParams = useSearchParams();
  const nextSearch = nextSearchParams.toString();
  const nextSearchPrefixed = nextSearch ? `?${nextSearch}` : "";
  const nextHref = housePathFromLocation(nextPath, nextSearchPrefixed);
  const [ownedHref, setOwnedHref] = useState<string | null>(null);
  const keysRef = useRef(new Set<string>());
  const [, bump] = useState(0);

  const href = ownedHref ?? nextHref;
  const parsed = parseHouseHref(href);
  const screenKey = houseScreenKey(parsed.pathname, parsed.search);

  const hasScreen = useCallback((dest: string) => keysRef.current.has(houseHrefKey(dest)), []);

  const rememberScreen = useCallback((key: string, _node: ReactNode) => {
    if (keysRef.current.has(key)) return;
    keysRef.current.add(key);
    bump((n) => n + 1);
  }, []);

  const syncScreens = useCallback((keys: readonly string[]) => {
    keysRef.current = new Set(keys);
    bump((n) => n + 1);
  }, []);

  const navigateOwned = useCallback(
    (dest: string, event?: HouseNavClickLike) => {
      if (event && houseNavIgnorePendingClick(event)) return false;
      if (!houseShouldClientNavigate(dest, keysRef.current)) return false;
      const { pathname, search } = parseHouseHref(dest);
      const next = housePathFromLocation(pathname, search);
      if (next === href) return true;
      window.history.pushState({ houseClient: true }, "", next);
      setOwnedHref(next);
      return true;
    },
    [href],
  );
  const navigateOwnedRef = useRef(navigateOwned);
  navigateOwnedRef.current = navigateOwned;

  useEffect(() => {
    if (ownedHref && houseHrefKey(ownedHref) === houseHrefKey(nextHref)) {
      setOwnedHref(null);
    }
  }, [nextHref, ownedHref]);

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
      if (!navigateOwnedRef.current(dest, event)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const api = useMemo<HouseClientApi>(
    () => ({
      pathname: parsed.pathname,
      search: parsed.search,
      href,
      screenKey,
      hasScreen,
      rememberScreen,
      syncScreens,
      navigateOwned,
    }),
    [hasScreen, href, navigateOwned, parsed.pathname, parsed.search, rememberScreen, screenKey, syncScreens],
  );

  return <HouseClientContext.Provider value={api}>{children}</HouseClientContext.Provider>;
}

export function HouseScreenCache({ children }: { children: ReactNode }) {
  const nextPath = usePathname();
  const nextSearchParams = useSearchParams();
  const nextSearch = nextSearchParams.toString();
  const nextSearchPrefixed = nextSearch ? `?${nextSearch}` : "";
  const nextKey = houseScreenKey(nextPath, nextSearchPrefixed);
  const house = useHouseClient();
  const cacheRef = useRef(new Map<string, ReactNode>());
  const orderRef = useRef<string[]>([]);
  const [, bump] = useState(0);
  const fallback = isHouseRscFallback(children);
  const activeKey = house?.screenKey ?? nextKey;

  useLayoutEffect(() => {
    if (fallback) return;
    cacheRef.current.set(nextKey, children);
    orderRef.current = rememberLru(orderRef.current, nextKey, HOUSE_CLIENT_SHELL.cacheCap);
    house?.rememberScreen(nextKey, children);
    const stale = [...cacheRef.current.keys()].filter((key) => !orderRef.current.includes(key));
    for (const key of stale) cacheRef.current.delete(key);
    house?.syncScreens(orderRef.current);
    bump((n) => n + 1);
  }, [children, fallback, house, nextKey]);

  const entries = [...cacheRef.current.entries()];
  const known = cacheRef.current.has(activeKey);
  // Unknown dest: paint the live RSC (or its loading.tsx). Known dest: the
  // mounted tree wins — never overwrite a warm screen with a skeleton.
  const ingress = known ? null : children;

  return (
    <>
      {entries.map(([key, node]) => (
        <div
          key={key}
          hidden={key !== activeKey}
          inert={key !== activeKey ? true : undefined}
          {...{ [HOUSE_CLIENT_SHELL.screenAttr]: key }}
          {...(key === activeKey ? { [HOUSE_CLIENT_SHELL.screenActiveAttr]: "" } : {})}
        >
          {node}
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
