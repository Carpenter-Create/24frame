import {
  LayoutDashboard,
  Clapperboard,
  Send,
  Activity,
  Sparkles,
  Inbox,
  Store,
  Users,
  Wallet,
  House,
  UserRound,
  Compass,
  Plus,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import { PRODUCT_NAME } from "@/lib/product";
import type { WorkspaceMode } from "@/lib/workspace";
import { SOCIAL_ROUTES } from "@/lib/social";

export type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

// GC's flat nav — only what exists or is v1-scoped. Settings stays deferred.
// Ask Globee is the /messages destination (href unchanged). Finance is the
// client recipient door. Staff ops stays on GC_NAV at /gc/finance.
export const NAV: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Titles", href: "/titles", icon: Clapperboard },
  { label: "Deliveries", href: "/deliveries", icon: Send },
  { label: "Catalog Health", href: "/catalog-health", icon: Activity },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: ASK_GLOBEE.headline, href: "/messages", icon: Sparkles },
];

// Social workspace rail. Five primary jobs. Messages here is DMs — never
// /messages. Groups / Courses / Leaderboard stay parked off this rail.
export const SOCIAL_NAV: NavItem[] = [
  { label: "Home", href: SOCIAL_ROUTES.home, icon: House, exact: true },
  { label: "Explore", href: SOCIAL_ROUTES.explore, icon: Compass },
  { label: "Create", href: SOCIAL_ROUTES.create, icon: Plus },
  { label: "Messages", href: SOCIAL_ROUTES.dms, icon: MessageCircle },
  { label: "Profile", href: SOCIAL_ROUTES.profile, icon: UserRound },
];

// Phone Social jobs. Create is the FAB, not a pill destination.
export const SOCIAL_MOBILE_PILL: NavItem[] = SOCIAL_NAV.filter(
  (item) => item.href !== SOCIAL_ROUTES.create,
);

// Staff rail eyebrow. Not a 24Frame product wordmark.
export const STAFF_RAIL_EYEBROW = "Staff";

// Staff-only operator surfaces. Rendered by SideNav only when isGcStaff is true;
// the (operator) layout remains the authorization gate for these hrefs.
export const GC_NAV: NavItem[] = [
  { label: "Queue", href: "/queue", icon: Inbox },
  { label: `${PRODUCT_NAME} Deliveries`, href: "/gc/deliveries", icon: Send },
  { label: "Vendors", href: "/vendors", icon: Store },
  { label: "Finance", href: "/gc/finance", icon: Wallet },
  { label: "Clients", href: "/gc/clients", icon: Users },
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
