// Rail-collapse chevron tokens and sidebar-collapsed cookie.
// House names only. Data attr values stay on RAIL_COLLAPSE_*.

import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";

export const RAIL_COLLAPSE_CHEVRON = "chevron";

export const RAIL_COLLAPSE_CHEVRON_CLASS =
  `flex h-7 w-7 shrink-0 items-center justify-center ${HOUSE_ICON_BUTTON_CLASS} text-ink-3 transition-colors hover:bg-surface-muted hover:text-ink-2`;

export const RAIL_COLLAPSE_CHEVRON_ICON_CLASS = "h-4 w-4";

export const RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT = "bold" as const;

export const RAIL_COLLAPSE_EXPAND_ROW_CLASS = "flex h-8 items-center justify-center";

/** Shared dest rail width. Collapsed overrides `--sidebar-width` to the collapsed var. */
export const RAIL_WIDTH_CLASS = "w-[calc(var(--sidebar-width)-16px)]";

export const RAIL_COLLAPSE_WIDTH_VAR = "var(--sidebar-width-collapsed)";

export const SIDEBAR_COLLAPSED_COOKIE = "24frame_sidebar_collapsed";

export const SIDEBAR_COLLAPSED_COOKIE_LEGACY = "gc_sidebar_collapsed";

const COOKIE_ATTRS = "path=/; max-age=31536000; samesite=lax";
const COOKIE_CLEAR_ATTRS = "path=/; max-age=0; samesite=lax";

export function parseSidebarCollapsedCookie(value: string | undefined | null): boolean {
  return value === "1";
}

/** Prefer the house cookie. Fall back to the one-time legacy name. */
export function readSidebarCollapsed(get: (name: string) => string | undefined): boolean {
  const next = get(SIDEBAR_COLLAPSED_COOKIE);
  if (next === "1" || next === "0") return next === "1";
  return parseSidebarCollapsedCookie(get(SIDEBAR_COLLAPSED_COOKIE_LEGACY));
}

export function sidebarCollapsedCookieWrite(collapsed: boolean): string {
  return `${SIDEBAR_COLLAPSED_COOKIE}=${collapsed ? "1" : "0"}; ${COOKIE_ATTRS}`;
}

export function sidebarCollapsedCookieClearLegacy(): string {
  return `${SIDEBAR_COLLAPSED_COOKIE_LEGACY}=; ${COOKIE_CLEAR_ATTRS}`;
}

export function shouldMigrateSidebarCollapsedCookie(cookieHeader: string): boolean {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const hasLegacy = parts.some((part) => part.startsWith(`${SIDEBAR_COLLAPSED_COOKIE_LEGACY}=`));
  const hasNext = parts.some((part) => part.startsWith(`${SIDEBAR_COLLAPSED_COOKIE}=`));
  return hasLegacy && !hasNext;
}

export function persistSidebarCollapsed(collapsed: boolean): void {
  document.cookie = sidebarCollapsedCookieWrite(collapsed);
  document.cookie = sidebarCollapsedCookieClearLegacy();
}

export function migrateSidebarCollapsedCookie(collapsed: boolean): void {
  if (shouldMigrateSidebarCollapsedCookie(document.cookie)) {
    persistSidebarCollapsed(collapsed);
  }
}
