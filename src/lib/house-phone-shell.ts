// Shared phone app-shell — Option 2 (Adam lock 2026-09-18, dest-chip amend).
// One primitive for Home · Social · Aggregation · Education.
// Desktop header + desktop workspace switcher stay on HouseLeadChrome.
// Phone top: emblem alone on the left. No workspace pill. No hamburger
// — leading or trailing. Trailing is search (when needed) · 24Frame AI
// · bell · avatar. Theme stays desktop-only. Avatar-sheet AI may stay
// as a secondary door.
// Destinations that used to live in the Agg/Edu hamburger (and Social’s
// second float) live on one under-top HousePhoneDestChips row.
// Home has no dest chip row. Desktop left rails stay.
// Bottom bar owns workspace switching only. Glyphs only — no labels.
// Aggregation is films (FilmStrip), not a grid. Craft is Elevated
// Mercury (reference, not a pixel clone, not Nextdoor frost): one
// floating pill, house surface fill, hairline, restrained
// --elevation-float. No frost. No satellite FAB. No second
// float. Active tab is a light surface-muted pill behind the glyph.
// Inactive sit bare. Stroke is Regular at size-4 (bell box, not
// Bold/Fill heavy). Active ink is accent on the chip; idle is ink-2.
// House tokens only. Hide on scroll-down / show on scroll-up via
// social-tab-bar-scroll. Content pad stays when the bar hides.
// Not a Meta skin. Not Mercury lavender.

import { BookOpen, FilmStrip, House, Users, type IconWeight } from "@phosphor-icons/react";

import {
  HOUSE_CONTROL_PILL_CLASS,
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
} from "@/lib/house-shell";
import {
  isClientNavActive,
  isHouseAiNavItem,
  isSocialTabActive,
  mobileNavDestinations,
  type NavItem,
} from "@/lib/nav";
import {
  OVERVIEW_HREF,
  OVERVIEW_PAGE,
  overviewLeadSelected,
  type OverviewLeadPillId,
} from "@/lib/overview";
import { PHOSPHOR_CHROME_ICON_CLASS, type PhosphorIcon } from "@/lib/phosphor-icon";
import { SOCIAL_ROUTES } from "@/lib/social";
import {
  WORKSPACE_AGGREGATION_LABEL,
  WORKSPACE_SOCIAL_LABEL,
} from "@/lib/product";
import {
  WORKSPACE_EDUCATION_HREF,
  WORKSPACE_EDUCATION_LABEL,
} from "@/lib/workspace-menu";
import { persistWorkspaceCookie, workspaceHome, type WorkspaceMode } from "@/lib/workspace";

export type HousePhoneWorkspaceId = OverviewLeadPillId;

export type HousePhoneWorkspaceTab = {
  id: HousePhoneWorkspaceId;
  label: string;
  href: string;
  icon: PhosphorIcon;
};

export const HOUSE_PHONE_WORKSPACE_TABS = [
  { id: "home" as const, label: OVERVIEW_PAGE.title, href: OVERVIEW_HREF, icon: House },
  {
    id: "social" as const,
    label: WORKSPACE_SOCIAL_LABEL,
    href: workspaceHome("social"),
    icon: Users,
  },
  {
    id: "aggregation" as const,
    label: WORKSPACE_AGGREGATION_LABEL,
    href: workspaceHome("aggregation"),
    icon: FilmStrip,
  },
  {
    id: "education" as const,
    label: WORKSPACE_EDUCATION_LABEL,
    href: WORKSPACE_EDUCATION_HREF,
    icon: BookOpen,
  },
] as const satisfies readonly HousePhoneWorkspaceTab[];

export const HOUSE_PHONE_BOTTOM_NAV = {
  label: "Workspaces",
} as const;

export const HOUSE_PHONE_DEST_CHIPS = {
  label: "Destinations",
} as const;

/** Phone-only float. Safe-area inset. Content pad is HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS. */
export const HOUSE_PHONE_BOTTOM_NAV_CLASS =
  "fixed inset-x-0 bottom-0 z-40 flex justify-center px-[var(--space-4)] pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out md:hidden";

export const HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS = "pointer-events-none translate-y-full";

export const HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS =
  "flex h-14 w-full max-w-[420px] items-center rounded-[28px] border border-hairline bg-surface px-2 shadow-[var(--elevation-float)]";

export const HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS = "flex h-12 w-full items-center";

export const HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS =
  "flex h-full min-w-0 flex-1 items-center justify-center px-1";

export const HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS = "text-accent";

export const HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS = "text-ink-2";

/** Soft light pill behind the selected glyph. House muted, not a brand fill. */
export const HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS =
  "flex h-10 min-w-12 items-center justify-center rounded-full bg-surface-muted";

/** Same size-4 box as the phone-top bell. Regular stroke, not Bold/Fill. */
export const HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS = PHOSPHOR_CHROME_ICON_CLASS;

export const HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT = "regular" satisfies IconWeight;

/** Clears the float once on main. Do not stack a second phone bottom pad on children.
 *  Pad stays when the bar hides so scroll-hide does not jump the page. */
export const HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS =
  "max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]";

export const HOUSE_PHONE_DESTS_CLASS =
  "flex w-full min-w-0 gap-[var(--space-2)] overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden";

export const HOUSE_PHONE_DEST_ITEM_CLASS = `inline-flex shrink-0 items-center gap-[var(--space-1)] ${HOUSE_CONTROL_PILL_CLASS} px-[var(--space-3)] py-[var(--space-1)] t-body-sm`;

export const HOUSE_PHONE_DEST_ITEM_ON_CLASS = `${HOUSE_FILTER_ON_CLASS} font-medium`;

export const HOUSE_PHONE_DEST_ITEM_OFF_CLASS = HOUSE_FILTER_OFF_CLASS;

export function housePhoneDestItemClass(active: boolean): string {
  return `${HOUSE_PHONE_DEST_ITEM_CLASS} ${
    active ? HOUSE_PHONE_DEST_ITEM_ON_CLASS : HOUSE_PHONE_DEST_ITEM_OFF_CLASS
  }`;
}

/** Social phone dests drop Home — the workspace tab owns /social. */
export const SOCIAL_PHONE_DESTS = mobileNavDestinations(false, "social").filter(
  (item) => item.href !== SOCIAL_ROUTES.home,
);

export function housePhoneWorkspaceSelected(
  id: HousePhoneWorkspaceId,
  pathname: string,
  workspace: WorkspaceMode,
): boolean {
  return overviewLeadSelected(id, pathname, workspace);
}

export function housePhoneWorkspaceHref(id: HousePhoneWorkspaceId): string {
  const tab = HOUSE_PHONE_WORKSPACE_TABS.find((row) => row.id === id);
  return tab?.href ?? OVERVIEW_HREF;
}

export function persistHousePhoneWorkspace(id: HousePhoneWorkspaceId): void {
  if (id === "home") return;
  persistWorkspaceCookie(id);
}

export function housePhoneShowsDestChips({
  workspace,
  homeChrome = false,
  settingsPage = false,
}: {
  workspace: WorkspaceMode;
  homeChrome?: boolean;
  settingsPage?: boolean;
}): boolean {
  if (homeChrome || settingsPage) return false;
  return workspace === "social" || workspace === "aggregation" || workspace === "education";
}

export function housePhoneDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode,
): NavItem[] {
  return mobileNavDestinations(isGcStaff, workspace).filter((item) => {
    if (isHouseAiNavItem(item)) return false;
    if (workspace === "social" && item.href === SOCIAL_ROUTES.home) return false;
    return true;
  });
}

export function housePhoneDestActive(
  pathname: string,
  item: NavItem,
  workspace: WorkspaceMode,
): boolean {
  if (workspace === "social") return isSocialTabActive(pathname, item);
  return isClientNavActive(pathname, item);
}

export function housePhoneDestChipsLabel(workspace: WorkspaceMode): string {
  if (workspace === "social") return WORKSPACE_SOCIAL_LABEL;
  if (workspace === "education") return WORKSPACE_EDUCATION_LABEL;
  return WORKSPACE_AGGREGATION_LABEL;
}
