// Shared phone app-shell — Option 2 (Adam lock 2026-09-18).
// One primitive for Home · Social · Aggregation · Education.
// Desktop header + desktop workspace switcher stay on HouseLeadChrome.
// Phone top drops the workspace pill. Bottom bar owns workspace
// switching. Dest-rail hamburger (Agg/Edu) is trailing — emblem
// owns the left alone (Apple addendum). Social's old floating tab
// bar is gone — local Social dests live in-page (SocialPhoneDests),
// not a second float.
// Craft matches Social's former float: hairline pill, r28, safe-area.
// Not a Meta skin. Tokens only.

import { BookOpen, House, SquaresFour, Users } from "@phosphor-icons/react";

import { SOCIAL_NAV } from "@/lib/nav";
import {
  OVERVIEW_HREF,
  OVERVIEW_PAGE,
  overviewLeadSelected,
  type OverviewLeadPillId,
} from "@/lib/overview";
import type { PhosphorIcon } from "@/lib/phosphor-icon";
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
    icon: SquaresFour,
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

/** Phone-only float. Safe-area inset. Content pad is HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS. */
export const HOUSE_PHONE_BOTTOM_NAV_CLASS =
  "fixed inset-x-0 bottom-0 z-40 flex justify-center px-[var(--space-4)] pb-[max(12px,env(safe-area-inset-bottom))] md:hidden";

export const HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS =
  "flex h-14 w-full max-w-[420px] items-center rounded-[28px] border border-hairline bg-surface px-1";

export const HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS = "flex h-12 w-full items-center";

export const HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS =
  "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[2px] px-1 t-label";

export const HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS = "size-5 shrink-0";

/** Clears the float once on main. Do not stack a second phone bottom pad on children. */
export const HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS =
  "max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]";

export const HOUSE_PHONE_DESTS_CLASS =
  "flex gap-[var(--space-2)] overflow-x-auto md:hidden";

export const HOUSE_PHONE_DEST_ITEM_CLASS =
  "inline-flex shrink-0 items-center gap-[var(--space-2)] rounded-full bg-surface-muted px-[var(--space-3)] py-[var(--space-2)] t-body-sm";

export const SOCIAL_PHONE_DESTS = SOCIAL_NAV.filter((item) => item.href !== SOCIAL_ROUTES.home);

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
