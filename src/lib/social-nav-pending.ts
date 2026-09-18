import { SOCIAL_ROUTES } from "@/lib/social";

/** Modified / non-primary clicks are not same-document Social navigations. */
export type SocialNavClickLike = {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export function socialNavIgnorePendingClick(event: SocialNavClickLike): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

/** Treat an in-flight Social href as the current path so the destination lights immediately. */
export function socialNavActivePath(pathname: string, pendingHref: string | null): string {
  return pendingHref ?? pathname;
}

/** Clear pending once the App Router lands on that destination (or a child of it). */
export function socialNavPendingSettled(pathname: string, pendingHref: string): boolean {
  if (pendingHref === SOCIAL_ROUTES.home) {
    return pathname === SOCIAL_ROUTES.home;
  }
  return pathname === pendingHref || pathname.startsWith(`${pendingHref}/`);
}
