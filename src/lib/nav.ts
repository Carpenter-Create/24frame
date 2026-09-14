import {
  House,
  UserRound,
  Compass,
  Plus,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import {
  SquaresFour,
  FilmSlate,
  PaperPlaneTilt,
  Pulse,
  Wallet,
  Sparkle,
  Tray,
  Storefront,
  Users,
} from "@phosphor-icons/react";

import type { PhosphorIcon } from "@/lib/phosphor-icon";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { PRODUCT_NAME } from "@/lib/product";
import type { WorkspaceMode } from "@/lib/workspace";
import { SOCIAL_ROUTES } from "@/lib/social";

export type PhosphorNavItem = {
  label: string;
  href: string;
  family: "phosphor";
  icon: PhosphorIcon;
  exact?: boolean;
};

export type LucideNavItem = {
  label: string;
  href: string;
  family: "lucide";
  icon: LucideIcon;
  exact?: boolean;
};

export type NavItem = PhosphorNavItem | LucideNavItem;

export function isPhosphorNavItem(item: NavItem): item is PhosphorNavItem {
  return item.family === "phosphor";
}

// GC's flat nav — only what exists or is v1-scoped. Settings stays deferred.
// Ask Globee is the /messages destination (href unchanged). Finance is the
// client recipient door. Staff ops stays on GC_NAV at /gc/finance.
// Glyphs: Figma 75:5 / 61:2 Phosphor Bold idle, Fill active.
export const NAV: PhosphorNavItem[] = [
  { label: "Home", href: "/", family: "phosphor", icon: SquaresFour, exact: true },
  { label: "Titles", href: "/titles", family: "phosphor", icon: FilmSlate },
  { label: "Deliveries", href: "/deliveries", family: "phosphor", icon: PaperPlaneTilt },
  { label: "Catalog Health", href: "/catalog-health", family: "phosphor", icon: Pulse },
  { label: "Finance", href: "/finance", family: "phosphor", icon: Wallet },
  { label: ASK_GLOBEE.headline, href: "/messages", family: "phosphor", icon: Sparkle },
];

// Social workspace rail. Five primary jobs. Messages here is DMs — never
// /messages. Groups / Courses / Leaderboard stay parked off this rail.
// Lucide stays until the Social V1 sole-writer PR rematches this set.
export const SOCIAL_NAV: LucideNavItem[] = [
  { label: "Home", href: SOCIAL_ROUTES.home, family: "lucide", icon: House, exact: true },
  { label: "Explore", href: SOCIAL_ROUTES.explore, family: "lucide", icon: Compass },
  { label: "Create", href: SOCIAL_ROUTES.create, family: "lucide", icon: Plus },
  { label: "Messages", href: SOCIAL_ROUTES.dms, family: "lucide", icon: MessageCircle },
  { label: "Profile", href: SOCIAL_ROUTES.profile, family: "lucide", icon: UserRound },
];

// Phone Social jobs. Create is the FAB, not a pill destination.
export const SOCIAL_MOBILE_PILL: LucideNavItem[] = SOCIAL_NAV.filter(
  (item) => item.href !== SOCIAL_ROUTES.create,
);

// Staff rail eyebrow. Not a 24Frame product wordmark.
export const STAFF_RAIL_EYEBROW = "Staff";

// Staff-only operator surfaces. Rendered by SideNav only when isGcStaff is true;
// the (operator) layout remains the authorization gate for these hrefs.
export const GC_NAV: PhosphorNavItem[] = [
  { label: "Queue", href: "/queue", family: "phosphor", icon: Tray },
  { label: `${PRODUCT_NAME} Deliveries`, href: "/gc/deliveries", family: "phosphor", icon: PaperPlaneTilt },
  { label: "Vendors", href: "/vendors", family: "phosphor", icon: Storefront },
  { label: "Finance", href: "/gc/finance", family: "phosphor", icon: Wallet },
  { label: "Clients", href: "/gc/clients", family: "phosphor", icon: Users },
];

// Phone sheet copy. Client sheet is NAV only. Staff sheet is NAV + GC_NAV.
export const MOBILE_NAV = {
  open: "Open menu",
  close: "Close menu",
  sheet: "Menu",
} as const;

export function isClientNavActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function clientNavCurrent(pathname: string): NavItem {
  return NAV.find((item) => isClientNavActive(pathname, item)) ?? NAV[0];
}

// Client phone sheet stays the Aggregation NAV destinations. Staff already use
// those plus the operator set — do not leave them on a client-only menu.
// Social mode is Home / Explore / Create / Messages / Profile.
// Ask 24Frame AI and GC_NAV stay Aggregation-only.
export function mobileNavDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode = "aggregation",
): NavItem[] {
  if (workspace === "social") return SOCIAL_NAV;
  return isGcStaff ? [...NAV, ...GC_NAV] : NAV;
}

export function railDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode = "aggregation",
): { items: NavItem[]; staffItems: NavItem[] } {
  if (workspace === "social") return { items: SOCIAL_NAV, staffItems: [] };
  return { items: NAV, staffItems: isGcStaff ? GC_NAV : [] };
}
