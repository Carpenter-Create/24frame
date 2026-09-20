import {
  House,
  Compass,
  Plus,
  ChatCircle,
  User,
  SquaresFour,
  FilmSlate,
  PaperPlaneTilt,
  Pulse,
  ChartBar,
  Wallet,
  Tray,
  CheckCircle,
  Storefront,
  Users,
  BookOpen,
} from "@phosphor-icons/react";

import type { PhosphorIcon } from "@/lib/phosphor-icon";
import { AVAILS_HREF, AVAILS_PAGE } from "@/lib/avails";
import { FINANCE_HREF, FINANCE_PAGE } from "@/lib/finance";
import { CHANNELS_HREF } from "@/lib/channel-card";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import {
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  EDUCATION_MANAGE_HREF,
} from "@/lib/education";
import { ATTENTION_HREF } from "@/lib/findings";
import { GC_DELIVERIES_HREF, GC_LICENSING_STATUS } from "@/lib/gc-deliveries";
import { QUEUE_HREF } from "@/lib/queue";
import { REPORTS_HREF, REPORTS_PAGE } from "@/lib/reports";
import { SOCIAL_ROUTES } from "@/lib/social";
import { TITLES_HREF } from "@/lib/title-public-id";
import {
  aggregationPath,
  isAggregationNavActive,
  isEducationManagePath,
  type WorkspaceMode,
} from "@/lib/workspace";
import { WORKSPACE_EDUCATION_LABEL } from "@/lib/workspace-menu";

export type PhosphorNavItem = {
  label: string;
  href: string;
  family: "phosphor";
  icon: PhosphorIcon;
  exact?: boolean;
  ariaLabel?: string;
};

export type HouseAiNavItem = {
  label: string;
  href: string;
  family: "house-ai";
  exact?: boolean;
  ariaLabel?: string;
};

export type NavItem = PhosphorNavItem | HouseAiNavItem;

export function isPhosphorNavItem(item: NavItem): item is PhosphorNavItem {
  return item.family === "phosphor";
}

export function isHouseAiNavItem(item: NavItem): item is HouseAiNavItem {
  return item.family === "house-ai";
}

// GC's flat nav — only what exists or is v1-scoped. Settings stays deferred.
// Notifications is chrome-level /activity (bell peek). It is not an Aggregation
// rail row. Recent activity stays catalog findings (/attention).
// Ask 24Frame AI is the shell overlay (`?ai=1`), never a workspace
// destination and never an Aggregation rail row. Desktop entry is
// the header HouseAiMark only.
// Reports is the one client activity door. Staff ops stays on GC_NAV
// at /gc/finance. Glyphs: Figma 75:5 / 75:2 / 61:2 Phosphor Bold idle,
// Fill active. Overlay chrome still uses the house sparkle cluster
// (HouseAiMark), not a Phosphor catalog glyph.
export const NAV: PhosphorNavItem[] = [
  { label: "Dashboard", href: DASHBOARD_HREF, family: "phosphor", icon: SquaresFour, exact: true },
  { label: "Titles", href: TITLES_HREF, family: "phosphor", icon: FilmSlate },
  { label: "Recent activity", href: ATTENTION_HREF, family: "phosphor", icon: Pulse },
  {
    label: REPORTS_PAGE.title,
    href: REPORTS_HREF,
    family: "phosphor",
    icon: ChartBar,
    ariaLabel: REPORTS_PAGE.navAria,
  },
];

// Social workspace rail. Phone local dests are HousePhoneDestChips
// under the top (Feed / Profile / Explore / Create / Messages).
// Desktop rail is Home / Profile / Explore / Messages — composer owns create.
// Profile second (Adam 2026-09-19) — phone reach; avatar remains account menu.
// Messages here is DMs — never /messages. Groups / Courses / Leaderboard
// stay parked off this rail. Education land is house chrome + an
// Education rail on Route A — not Aggregation destinations, not STAFF,
// not Social feed chrome. Phosphor house glyphs only; no Education-only
// icon family. SOCIAL_NAV uses the same Phosphor family as Aggregation.
// Social interiors stay SocialIcon (Social Figma V1).
export const SOCIAL_NAV: PhosphorNavItem[] = [
  { label: "Home", href: SOCIAL_ROUTES.home, family: "phosphor", icon: House, exact: true },
  { label: "Profile", href: SOCIAL_ROUTES.profile, family: "phosphor", icon: User },
  { label: "Explore", href: SOCIAL_ROUTES.explore, family: "phosphor", icon: Compass },
  { label: "Create", href: SOCIAL_ROUTES.create, family: "phosphor", icon: Plus },
  { label: "Messages", href: SOCIAL_ROUTES.dms, family: "phosphor", icon: ChatCircle },
];

export const SOCIAL_DESKTOP_NAV: PhosphorNavItem[] = SOCIAL_NAV.filter(
  (item) => item.href !== SOCIAL_ROUTES.create,
);

// Member Education rail. Browse is /education.
// Staff CMS is /education/manage (operator-gated) via EDUCATION_MANAGE_NAV —
// never a member manage destination on this rail.
export const EDUCATION_NAV: PhosphorNavItem[] = [
  {
    label: WORKSPACE_EDUCATION_LABEL,
    href: EDUCATION_HREF,
    family: "phosphor",
    icon: BookOpen,
  },
];

// Staff-only Manage courses. Rendered in Education workspace when
// isGcStaff. Members never see this. Not on GC_NAV — Education is the
// staff path, not Aggregation Staff /gc.
export const EDUCATION_MANAGE_NAV: PhosphorNavItem[] = [
  {
    label: EDUCATION_ADMIN.manage,
    href: EDUCATION_MANAGE_HREF,
    family: "phosphor",
    icon: BookOpen,
  },
];

// Staff-block rail eyebrow. Same isGcStaff gate. Not a 24Frame product wordmark.
export const STAFF_RAIL_EYEBROW = "Team";

// Staff-only operator surfaces. Rendered by SideNav only when isGcStaff is true;
// the (operator) layout remains the authorization gate for these hrefs.
export const GC_NAV: PhosphorNavItem[] = [
  { label: "Queue", href: QUEUE_HREF, family: "phosphor", icon: Tray },
  { label: AVAILS_PAGE.title, href: AVAILS_HREF, family: "phosphor", icon: CheckCircle },
  { label: GC_LICENSING_STATUS.title, href: GC_DELIVERIES_HREF, family: "phosphor", icon: PaperPlaneTilt },
  { label: "Channels", href: CHANNELS_HREF, family: "phosphor", icon: Storefront },
  {
    label: "Finance",
    href: FINANCE_HREF,
    family: "phosphor",
    icon: Wallet,
    ariaLabel: FINANCE_PAGE.navAria,
  },
  { label: "Clients", href: aggregationPath("gc/clients"), family: "phosphor", icon: Users },
];

// Phone dest-chip copy leftover. Hamburger sheet is gone — dests live
// on HousePhoneDestChips. Keep labels so account-sheet tests can still
// prove the avatar sheet is not a Menu overlay.
export const MOBILE_NAV = {
  open: "Open menu",
  close: "Close menu",
  sheet: "Menu",
} as const;

export function isClientNavActive(pathname: string, item: NavItem): boolean {
  if (isHouseAiNavItem(item)) return false;
  if (item.href === EDUCATION_MANAGE_HREF) {
    return isEducationManagePath(pathname);
  }
  if (item.href === EDUCATION_HREF) {
    return (
      !isEducationManagePath(pathname) &&
      (pathname === EDUCATION_HREF || pathname.startsWith(`${EDUCATION_HREF}/`))
    );
  }
  if (isAggregationNavActive(pathname, item.href, item.exact)) {
    return true;
  }
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Flush Social tab bar. Stories sit under Home. Public profiles sit under Profile. */
export function isSocialTabActive(pathname: string, item: NavItem): boolean {
  if (item.href === SOCIAL_ROUTES.home) {
    return pathname === SOCIAL_ROUTES.home || pathname.startsWith(SOCIAL_ROUTES.stories);
  }
  if (item.href === SOCIAL_ROUTES.profile) {
    return (
      pathname === SOCIAL_ROUTES.profile ||
      pathname.startsWith(`${SOCIAL_ROUTES.profile}/`) ||
      pathname.startsWith(`${SOCIAL_ROUTES.profileByHandle}/`)
    );
  }
  return isClientNavActive(pathname, item);
}

export function clientNavCurrent(pathname: string): NavItem {
  return NAV.find((item) => isClientNavActive(pathname, item)) ?? NAV[0];
}

// Phone dest chips use this list (HousePhoneDestChips still filters
// house-ai so a leftover overlay trigger cannot become a dest chip).
// Staff already use the operator set — do not leave them on a
// client-only row. Social phone dests keep the feed pill (relabelled
// Feed on phone; desktop rail keeps Home) so /social is reachable
// from the chip row. Desktop rail drops Create. Activity is the
// header bell, not a dest chip. Ask 24Frame AI is header + overlay.
export function mobileNavDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode = "aggregation",
): NavItem[] {
  if (workspace === "social") return SOCIAL_NAV;
  if (workspace === "education") {
    return isGcStaff ? [...EDUCATION_NAV, ...EDUCATION_MANAGE_NAV] : EDUCATION_NAV;
  }
  return isGcStaff ? [...NAV, ...GC_NAV] : NAV;
}

export function railDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode = "aggregation",
): { items: NavItem[]; staffItems: NavItem[] } {
  if (workspace === "social") return { items: SOCIAL_DESKTOP_NAV, staffItems: [] };
  if (workspace === "education") {
    return { items: EDUCATION_NAV, staffItems: isGcStaff ? EDUCATION_MANAGE_NAV : [] };
  }
  return { items: NAV, staffItems: isGcStaff ? GC_NAV : [] };
}
