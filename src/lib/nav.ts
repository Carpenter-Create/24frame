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
  ChartBar,
  Wallet,
  Sparkle,
  Tray,
  Storefront,
  Users,
  BookOpen,
} from "@phosphor-icons/react";

import type { PhosphorIcon } from "@/lib/phosphor-icon";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { FINANCE_CLIENT, FINANCE_PAGE } from "@/lib/finance";
import { PRODUCT_NAME } from "@/lib/product";
import type { WorkspaceMode } from "@/lib/workspace";
import { EDUCATION_ADMIN, EDUCATION_HREF } from "@/lib/education";
import { SOCIAL_ROUTES } from "@/lib/social";
import { WORKSPACE_EDUCATION_LABEL } from "@/lib/workspace-menu";

export type PhosphorNavItem = {
  label: string;
  href: string;
  family: "phosphor";
  icon: PhosphorIcon;
  exact?: boolean;
  ariaLabel?: string;
};

export type LucideNavItem = {
  label: string;
  href: string;
  family: "lucide";
  icon: LucideIcon;
  exact?: boolean;
  ariaLabel?: string;
};

export type NavItem = PhosphorNavItem | LucideNavItem;

export function isPhosphorNavItem(item: NavItem): item is PhosphorNavItem {
  return item.family === "phosphor";
}

// GC's flat nav — only what exists or is v1-scoped. Settings stays deferred.
// Ask Globee is the /messages destination (href unchanged). Earn is the
// client recipient door. Staff ops stays on GC_NAV at /gc/finance.
// Glyphs: Figma 75:5 / 75:2 / 61:2 Phosphor Bold idle, Fill active.
export const NAV: PhosphorNavItem[] = [
  { label: "Dashboard", href: "/dashboard", family: "phosphor", icon: SquaresFour, exact: true },
  { label: "Titles", href: "/titles", family: "phosphor", icon: FilmSlate },
  { label: "Deliveries", href: "/deliveries", family: "phosphor", icon: PaperPlaneTilt },
  { label: "Catalog Health", href: "/catalog-health", family: "phosphor", icon: Pulse },
  { label: "Analytics", href: "/analytics", family: "phosphor", icon: ChartBar },
  {
    label: "Earn",
    href: "/earn",
    family: "phosphor",
    icon: Wallet,
    ariaLabel: FINANCE_CLIENT.navAria,
  },
  { label: ASK_GLOBEE.headline, href: "/messages", family: "phosphor", icon: Sparkle },
];

// Social workspace rail. Mobile tab keeps five jobs (Create stays).
// Desktop rail is Home / Explore / Messages / Profile — composer owns create.
// Messages here is DMs — never /messages. Groups / Courses / Leaderboard
// stay parked off this rail. Education land is house chrome + an
// Education rail on Route A — not Aggregation destinations, not STAFF,
// not Social feed chrome. Phosphor house glyphs only; no Education-only
// icon family. SOCIAL_NAV family stays Lucide for NavGlyph fallback.
// Social chrome rematch is SocialIcon (Social Figma V1).
export const SOCIAL_NAV: LucideNavItem[] = [
  { label: "Home", href: SOCIAL_ROUTES.home, family: "lucide", icon: House, exact: true },
  { label: "Explore", href: SOCIAL_ROUTES.explore, family: "lucide", icon: Compass },
  { label: "Create", href: SOCIAL_ROUTES.create, family: "lucide", icon: Plus },
  { label: "Messages", href: SOCIAL_ROUTES.dms, family: "lucide", icon: MessageCircle },
  { label: "Profile", href: SOCIAL_ROUTES.profile, family: "lucide", icon: UserRound },
];

export const SOCIAL_DESKTOP_NAV: LucideNavItem[] = SOCIAL_NAV.filter(
  (item) => item.href !== SOCIAL_ROUTES.create,
);

// Member Education rail. Browse stays Route A /social/courses.
// Staff CMS is /education (operator-gated) via EDUCATION_MANAGE_NAV —
// never a member manage destination on this rail.
export const EDUCATION_NAV: PhosphorNavItem[] = [
  {
    label: WORKSPACE_EDUCATION_LABEL,
    href: SOCIAL_ROUTES.courses,
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
    href: EDUCATION_HREF,
    family: "phosphor",
    icon: BookOpen,
  },
];

// Staff rail eyebrow. Not a 24Frame product wordmark.
export const STAFF_RAIL_EYEBROW = "Staff";

// Staff-only operator surfaces. Rendered by SideNav only when isGcStaff is true;
// the (operator) layout remains the authorization gate for these hrefs.
export const GC_NAV: PhosphorNavItem[] = [
  { label: "Queue", href: "/queue", family: "phosphor", icon: Tray },
  { label: `${PRODUCT_NAME} Deliveries`, href: "/gc/deliveries", family: "phosphor", icon: PaperPlaneTilt },
  { label: "Vendors", href: "/vendors", family: "phosphor", icon: Storefront },
  {
    label: "Finance",
    href: "/gc/finance",
    family: "phosphor",
    icon: Wallet,
    ariaLabel: FINANCE_PAGE.navAria,
  },
  { label: "Clients", href: "/gc/clients", family: "phosphor", icon: Users },
];

// Phone sheet copy. Client sheet is NAV only. Staff sheet is NAV + GC_NAV.
export const MOBILE_NAV = {
  open: "Open menu",
  close: "Close menu",
  sheet: "Menu",
} as const;

export function isClientNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/dashboard" && pathname === "/") return true;
  if (item.href === "/earn" && (pathname === "/finance" || pathname.startsWith("/finance/"))) {
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

// Client phone sheet stays the Aggregation NAV destinations. Staff already use
// those plus the operator set — do not leave them on a client-only menu.
// Social mobile tab is Home / Explore / Create / Messages / Profile.
// Desktop rail drops Create. Ask 24Frame AI and GC_NAV stay Aggregation-only.
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
