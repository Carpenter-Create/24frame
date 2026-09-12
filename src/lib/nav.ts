import {
  LayoutDashboard,
  Clapperboard,
  Send,
  Activity,
  Sparkles,
  Inbox,
  Store,
  Users,
  House,
  UserRound,
  UsersRound,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import { PRODUCT_NAME } from "@/lib/product";
import type { WorkspaceMode } from "@/lib/workspace";
import { SOCIAL_ROUTES } from "@/lib/social";

export type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

// GC's flat nav — only what exists or is v1-scoped. Deferred until their slices land:
// Statements, Settings. Ask Globee is the /messages destination (href unchanged).
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Titles", href: "/titles", icon: Clapperboard },
  { label: "Deliveries", href: "/deliveries", icon: Send },
  { label: "Catalog Health", href: "/catalog-health", icon: Activity },
  { label: ASK_GLOBEE.headline, href: "/messages", icon: Sparkles },
];

// Social workspace rail. Messages here is DMs — never /messages.
export const SOCIAL_NAV: NavItem[] = [
  { label: "Home", href: SOCIAL_ROUTES.home, icon: House, exact: true },
  { label: "Profile", href: SOCIAL_ROUTES.profile, icon: UserRound },
  { label: "Groups", href: SOCIAL_ROUTES.groups, icon: UsersRound },
  { label: "Messages", href: SOCIAL_ROUTES.dms, icon: MessageCircle },
];

// Staff-only operator surfaces. Rendered by SideNav only when isGcStaff is true;
// the (operator) layout remains the authorization gate for these hrefs.
export const GC_NAV: NavItem[] = [
  { label: "Queue", href: "/queue", icon: Inbox },
  { label: `${PRODUCT_NAME} Deliveries`, href: "/gc/deliveries", icon: Send },
  { label: "Vendors", href: "/vendors", icon: Store },
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

// Client phone sheet stays the five NAV destinations. Staff already use those
// plus the operator set — do not leave them on a client-only menu.
// Social mode is Home / Profile / Groups / DMs. Ask 24Frame AI and GC_NAV
// stay Aggregation-only.
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
