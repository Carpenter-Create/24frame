// Shared phone app-shell — Option 2 (Adam lock 2026-09-18, dest-chip amend).
// One primitive for Home · Social · Aggregation · Education · Co-Productions.
// Desktop header + desktop workspace switcher stay on HouseLeadChrome.
// Phone top: emblem alone on the left. No workspace pill. No hamburger
// — leading or trailing. Trailing is search (when needed) · 24Frame AI
// · bell · avatar. Theme stays desktop-only. Ask AI is header + Home
// module only (#465).
// Destinations that used to live in the Agg/Edu hamburger (and Social’s
// second float) live on one under-top HousePhoneDestChips row.
// Home has no dest chip row. Desktop left rails stay.
// Bottom bar owns workspace switching only. Glyphs only — no labels.
// Aggregation is films (FilmStrip), not a grid. Craft is Elevated
// Mercury (reference, not a pixel clone, not Nextdoor frost): one
// floating pill, house surface fill, hairline, restrained
// --elevation-float. No frost. No satellite FAB. No second
// float. Active tab is a light surface-muted pill behind the glyph.
// Inactive sit bare. Stroke is Regular for both the Mercury bar and
// the phone-top AI/bell cluster — one weight register — but the glyph
// boxes ride TWO independent size SoT tokens per Adam's #451
// authoritative lock (2026-09-19, live-glance): the Mercury bar sits
// at size-6 / 24px (HOUSE_PHONE_CHROME_ICON_CLASS) so the workspace
// switch reads at thumb weight, and the header trailing sits at
// size-4 / 16px (HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS) matching
// desktop chrome optical — AI mark, notification bell, and Social
// header search no longer tower over the emblem. Two literals, no
// alias — header must NOT re-export the bottom-chrome class. Arc:
// #447 shipped size-6 shared; #448 collapsed to size-5; #449 split
// header size-4 / bar size-6; #450 briefly pulled both to size-5
// and Adam bounced off it; #451 (this lock) restores the split with
// an explicit no-alias rule. Not Bold/Fill heavy. Active ink is
// accent on the chip; idle is ink-2 on both the bar off state and
// the top trailing (AI + bell + phone search) via
// HOUSE_PHONE_CHROME_IDLE_INK_CLASS — Regular on ink-3 optically
// drifts lighter than the same glyph on ink-2, which is what #442
// left over.
// House tokens only. Hide on scroll-down / show on scroll-up via
// social-tab-bar-scroll. Content pad stays when the bar hides.
// Not a Meta skin. Not Mercury lavender.

import { BookOpen, FilmStrip, House, Users, type IconWeight } from "@phosphor-icons/react";

import {
  HOUSE_CONTROL_PILL_CLASS,
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_PILL_SELECTED_CLASS,
} from "@/lib/house-shell";
import {
  isClientNavActive,
  isHouseAiNavItem,
  isSocialTabActive,
  mobileNavDestinations,
  type NavItem,
} from "@/lib/nav";
import { CO_PRODUCTIONS_HREF, CO_PRODUCTIONS_ICON, CO_PRODUCTIONS_LABEL } from "@/lib/co-productions";
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
  {
    id: "co-productions" as const,
    label: CO_PRODUCTIONS_LABEL,
    href: CO_PRODUCTIONS_HREF,
    icon: CO_PRODUCTIONS_ICON,
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

/** Phone Mercury bottom bar glyph size — 24px box.
 *  Bottom bar owns the workspace switch and sits at the base of the
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

export const HOUSE_PHONE_DESTS_CLASS =
  "flex w-full min-w-0 gap-[var(--space-2)] overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden";

// Coinbase register density (Adam 2026-09-19): a little taller than
// the first dest-chip ship — min-h-9 + space-2 pad. Calm, not chunky.
// Selected is accent fill + white label/icon (HOUSE_PILL_SELECTED_CLASS),
// not ink. Idle stays muted track. One SoT; every workspace inherits.
export const HOUSE_PHONE_DEST_ITEM_CLASS = `inline-flex min-h-9 shrink-0 items-center gap-[var(--space-1)] ${HOUSE_CONTROL_PILL_CLASS} px-[var(--space-3)] py-[var(--space-2)] t-body-sm`;

export const HOUSE_PHONE_DEST_ITEM_ON_CLASS = `${HOUSE_PILL_SELECTED_CLASS} font-medium`;

export const HOUSE_PHONE_DEST_ITEM_OFF_CLASS = HOUSE_FILTER_OFF_CLASS;

export function housePhoneDestItemClass(active: boolean): string {
  return `${HOUSE_PHONE_DEST_ITEM_CLASS} ${
    active ? HOUSE_PHONE_DEST_ITEM_ON_CLASS : HOUSE_PHONE_DEST_ITEM_OFF_CLASS
  }`;
}

/** Phone-only label for the Social feed dest. Desktop rail keeps "Home". */
export const SOCIAL_PHONE_FEED_LABEL = "Feed";

function relabelSocialFeed<T extends NavItem>(item: T): T {
  if (item.href !== SOCIAL_ROUTES.home) return item;
  return { ...item, label: SOCIAL_PHONE_FEED_LABEL };
}

/** Social phone dests keep Home as the leftmost pill, renamed to Feed. */
export const SOCIAL_PHONE_DESTS = mobileNavDestinations(false, "social").map(relabelSocialFeed);

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
  if (id === "home" || id === "co-productions") return;
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
  return mobileNavDestinations(isGcStaff, workspace)
    .filter((item) => !isHouseAiNavItem(item))
    .map((item) => (workspace === "social" ? relabelSocialFeed(item) : item));
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
