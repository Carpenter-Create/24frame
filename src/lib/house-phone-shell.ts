// Shared phone app-shell — IA A (Adam lock: dests in the dock).
// One primitive for Home · Aggregation · Social · Education.
// Desktop header + desktop workspace pills stay on HouseLeadChrome.
// Phone header: emblem + current workspace name/mark. Tap opens a
// calm house sheet — Home · Aggregation · Social · Education.
// One tap open, one tap switch. No workspace item in the dock.
// Avatar stays Settings / account — not a second workspace door.
// Destinations live in the Mercury floating dock (in-workspace
// only). Social dest order stays Feed · Profile · Explore ·
// Create · Messages. Create is Social-only. Aggregation ·
// Education · Home each keep their own dests. Dock hops use the
// house pending / prefetch SoT — prefetchHrefList on mount,
// optimistic dest light on tap. No under-top dest chip rail. No
// peer workspace pill rail.
// Phone OS dark is not the product theme. One house SoT.
// Trailing is search (when needed) · theme · 24Frame AI · bell ·
// avatar. Sun/moon is shared immediately left of Ask on every
// breakpoint. One trail. No phone-only sun/moon twin.
// Ask AI is header + Home module only (#465).
// Craft is Elevated Mercury (reference, not a pixel clone, not
// Nextdoor frost): one floating pill, house surface fill, hairline,
// restrained --elevation-float. No frost. No satellite FAB. No
// second float. Active dest is a light surface-muted pill behind
// the glyph. Inactive sit bare. Stroke is Regular for both the
// Mercury bar and the phone-top AI/bell cluster — one weight
// register — but the glyph boxes ride TWO independent size SoT
// tokens per Adam's #451 authoritative lock (2026-09-19,
// live-glance): the Mercury bar sits at size-6 / 24px
// (HOUSE_PHONE_CHROME_ICON_CLASS) so dests read at thumb weight,
// and the header trailing sits at size-4 / 16px
// (HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS) matching desktop chrome
// optical. Two literals, no alias — header must NOT re-export the
// bottom-chrome class. Not Bold/Fill heavy. Active ink is accent
// on the chip; idle is ink-2 on both the bar off state and the top
// trailing (AI + bell + phone search) via
// HOUSE_PHONE_CHROME_IDLE_INK_CLASS.
// House tokens only. Hide on scroll-down / show on scroll-up via
// social-tab-bar-scroll. Content pad stays when the bar hides.
// Not a Meta skin. Not Mercury lavender.

import { BookOpen, FilmStrip, House, Newspaper, Users, type IconWeight } from "@phosphor-icons/react";

import {
  isClientNavActive,
  isHouseAiNavItem,
  isPhosphorNavItem,
  isSocialTabActive,
  mobileNavDestinations,
  type NavItem,
  type PhosphorNavItem,
} from "@/lib/nav";
import { NEWS_HREF, NEWS_PAGE } from "@/lib/news";
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
import { workspaceHome, type WorkspaceMode } from "@/lib/workspace";

export type HousePhoneWorkspaceId = Exclude<OverviewLeadPillId, "co-productions">;

export type HousePhoneWorkspaceTab = {
  id: HousePhoneWorkspaceId;
  label: string;
  href: string;
  icon: PhosphorIcon;
};

export const HOUSE_PHONE_WORKSPACE_TABS = [
  { id: "home" as const, label: OVERVIEW_PAGE.title, href: OVERVIEW_HREF, icon: House },
  {
    id: "aggregation" as const,
    label: WORKSPACE_AGGREGATION_LABEL,
    href: workspaceHome("aggregation"),
    icon: FilmStrip,
  },
  {
    id: "social" as const,
    label: WORKSPACE_SOCIAL_LABEL,
    href: workspaceHome("social"),
    icon: Users,
  },
  {
    id: "education" as const,
    label: WORKSPACE_EDUCATION_LABEL,
    href: WORKSPACE_EDUCATION_HREF,
    icon: BookOpen,
  },
] as const satisfies readonly HousePhoneWorkspaceTab[];

export const HOUSE_PHONE_BOTTOM_NAV = {
  label: "Destinations",
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

/** Phone Mercury bottom bar glyph size — 24px box.
 *  Bottom bar owns in-workspace dests and sits at the base of the
 *  screen, so its glyphs stay at thumb weight. The phone header
 *  trailing cluster uses a SEPARATE size literal
 *  (HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS) — never aliased to this
 *  constant per Adam #451. Two tokens, two sizes. */
export const HOUSE_PHONE_CHROME_ICON_CLASS = "size-6 shrink-0";

/** Phone header trailing glyph size — 16px box, matches desktop chrome.
 *  AI mark + bell + phone search read off this token. Its value is a
 *  standalone literal, not an alias of HOUSE_PHONE_CHROME_ICON_CLASS
 *  — Adam #451 explicitly forbade re-exporting the bottom-chrome
 *  class as the header token so a bottom-bar shrink can never leak
 *  into the header, and vice versa. Phone and desktop coincide at
 *  16px today; the md:size-4 override on HOUSE_HEADER_TRAILING_ICON_CLASS
 *  stays so any future phone-header shift only touches this constant. */
export const HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS = "size-4 shrink-0";

/** One phone chrome stroke register — bottom bar + top trailing. Not Bold/Fill. */
export const HOUSE_PHONE_CHROME_ICON_WEIGHT = "regular" satisfies IconWeight;

/** Idle ink shared by the phone top trailing cluster and the phone bottom bar
 *  off state. Perceived stroke weight is not just line thickness — a Regular
 *  glyph on ink-3 reads visibly lighter than the same glyph on ink-2 sitting
 *  in the Mercury bar. One ink SoT is what makes the two Regular clusters
 *  read as one register (#442 shipped weight+stroke, this locks the ink). */
export const HOUSE_PHONE_CHROME_IDLE_INK_CLASS = "text-ink-2";

export const HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS = HOUSE_PHONE_CHROME_IDLE_INK_CLASS;

/** Soft light pill behind the selected glyph. Scales with the 24px box. */
export const HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS =
  "flex h-12 min-w-14 items-center justify-center rounded-full bg-surface-muted";

/** Phone 16px; desktop header keeps the 16px phosphor chrome box. Phone
 *  and desktop coincide today; the md:size-4 override stays so any
 *  future phone divergence only touches HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS. */
export const HOUSE_HEADER_TRAILING_ICON_CLASS = `${HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS} md:size-4`;

/** Phone header trailing instance — Regular size-4 on bottom-bar idle ink.
 *  Hidden from md+, so the ink override does not touch desktop text-ink-3. */
export const HOUSE_HEADER_TRAILING_PHONE_CLASS = `${HOUSE_HEADER_TRAILING_ICON_CLASS} md:hidden ${HOUSE_PHONE_CHROME_IDLE_INK_CLASS}`;

/** Desktop header trailing instance — 16px phosphor idle / filled AI. */
export const HOUSE_HEADER_TRAILING_DESKTOP_CLASS = `${PHOSPHOR_CHROME_ICON_CLASS} hidden md:block`;

/** Bottom nav rides the 24px SoT (HOUSE_PHONE_CHROME_ICON_CLASS)
 *  independently of the phone header trailing per Adam #451. The two
 *  clusters share weight (Regular) and idle ink (text-ink-2), but the
 *  size tokens are two independent literals. Never Bold/Fill. */
export const HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS = HOUSE_PHONE_CHROME_ICON_CLASS;

export const HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT = HOUSE_PHONE_CHROME_ICON_WEIGHT;

/** Clears the float once on main. Do not stack a second phone bottom pad on children.
 *  Pad stays when the bar hides so scroll-hide does not jump the page. */
export const HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS =
  "max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]";

/** Phone-only label for the Social feed dest. Desktop rail keeps "Home". */
export const SOCIAL_PHONE_FEED_LABEL = "Feed";

function relabelSocialFeed<T extends NavItem>(item: T): T {
  if (item.href !== SOCIAL_ROUTES.home) return item;
  return { ...item, label: SOCIAL_PHONE_FEED_LABEL };
}

/** Social phone dests keep Home as the leftmost dest, renamed to Feed. */
export const SOCIAL_PHONE_DESTS = mobileNavDestinations(false, "social").map(relabelSocialFeed);

/** Home-owned dests. Industry news is a Home child, not a workspace. */
export const HOME_PHONE_DESTS = [
  {
    label: OVERVIEW_PAGE.title,
    href: OVERVIEW_HREF,
    family: "phosphor",
    icon: House,
    exact: true,
  },
  {
    label: NEWS_PAGE.title,
    href: NEWS_HREF,
    family: "phosphor",
    icon: Newspaper,
  },
] as const satisfies readonly PhosphorNavItem[];

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

export function housePhonePrefetchDestHrefs(items: readonly NavItem[]): string[] {
  return items.map((item) => item.href);
}

export function housePhoneShowsBottomDests({
  workspace,
  homeOwned = false,
  accountChrome = false,
  coProductions = false,
}: {
  workspace: WorkspaceMode;
  homeOwned?: boolean;
  accountChrome?: boolean;
  coProductions?: boolean;
}): boolean {
  if (accountChrome || coProductions) return false;
  if (homeOwned) return true;
  return workspace === "social" || workspace === "aggregation" || workspace === "education";
}

export function housePhoneDestinations(
  isGcStaff: boolean,
  workspace: WorkspaceMode,
): NavItem[] {
  return mobileNavDestinations(isGcStaff, workspace)
    .filter((item) => !isHouseAiNavItem(item))
    .map((item) => (workspace === "social" ? relabelSocialFeed(item) : item));
}

export function housePhoneDockDestinations({
  isGcStaff,
  workspace,
  homeOwned = false,
}: {
  isGcStaff: boolean;
  workspace: WorkspaceMode;
  homeOwned?: boolean;
}): NavItem[] {
  if (homeOwned) return [...HOME_PHONE_DESTS];
  return housePhoneDestinations(isGcStaff, workspace);
}

export function housePhoneDestGlyph(item: NavItem): PhosphorIcon {
  return isPhosphorNavItem(item) ? item.icon : House;
}

export function housePhoneDestIsCreate(item: NavItem): boolean {
  return item.href === SOCIAL_ROUTES.create;
}

export function housePhoneDestActive(
  pathname: string,
  item: NavItem,
  workspace: WorkspaceMode,
): boolean {
  if (workspace === "social") return isSocialTabActive(pathname, item);
  return isClientNavActive(pathname, item);
}

export function housePhoneDestActiveIndex(
  pathname: string,
  items: readonly NavItem[],
  workspace: WorkspaceMode,
): number {
  return items.findIndex((item) => housePhoneDestActive(pathname, item, workspace));
}

export function housePhoneDestChipsLabel(workspace: WorkspaceMode): string {
  if (workspace === "social") return WORKSPACE_SOCIAL_LABEL;
  if (workspace === "education") return WORKSPACE_EDUCATION_LABEL;
  return WORKSPACE_AGGREGATION_LABEL;
}

export function housePhoneDockLabel({
  workspace,
  homeOwned = false,
}: {
  workspace: WorkspaceMode;
  homeOwned?: boolean;
}): string {
  if (homeOwned) return OVERVIEW_PAGE.title;
  return housePhoneDestChipsLabel(workspace);
}
