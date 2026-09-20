import { OVERVIEW_HREF } from "@/lib/overview";
import { SOCIAL_ROUTES } from "@/lib/social";

// One pending / prefetch SoT for phone sheet + dock and the Social rail.
// Click paints the destination before the RSC page lands. No lookalike
// nav pending fork. Modified clicks are not same-document hops.

export type HouseNavClickLike = {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export function houseNavIgnorePendingClick(event: HouseNavClickLike): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function houseNavActivePath(pathname: string, pendingHref: string | null): string {
  return pendingHref ?? pathname;
}

/** Lands that must match exactly — a child dest is a different hop. */
const HOUSE_NAV_EXACT_PENDING = new Set<string>([SOCIAL_ROUTES.home, OVERVIEW_HREF]);

export function houseNavPendingSettled(pathname: string, pendingHref: string): boolean {
  if (HOUSE_NAV_EXACT_PENDING.has(pendingHref)) {
    return pathname === pendingHref;
  }
  return pathname === pendingHref || pathname.startsWith(`${pendingHref}/`);
}

export function prefetchHrefList(
  prefetch: (href: string) => void,
  hrefs: readonly string[],
): void {
  for (const href of hrefs) prefetch(href);
}
