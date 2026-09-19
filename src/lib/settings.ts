// Settings hub. Copy and path contract live here, not in JSX.
//
// Universal Account/Settings hub — not owned by Aggregation / Social /
// Education. Title Settings. One door from every workspace.
// CMS is not inside Settings — staff Manage courses is a href out
// under Preferences. Not a GC Staff admin surface.
//
// Hub sections:
//   Profile · Organization · Preferences
// Same URLs regardless of active workspace. Do not keep You / Social /
// Education / Aggregation as the IA spine.
// Profile is account identity only (name / photo / sign-in email +
// Save). Public / Social profile is Social-owned — edit it from
// Social, not from a Settings door.
// Organization holds the company profile (moved from Aggregation
// settings). Org Team / invite / roles are out of scope this PR —
// this section hosts Team next.
// Preferences holds Appearance (same gc-theme SoT as the header
// sun/moon) and the notification matrix. Leftover workspace prefs
// may appear as optional subsections only — never as a You / Social /
// Education / Aggregation spine.
//
// Canonical paths only (hard-cut — no users yet, no redirects):
//   /settings → hub (mobile list) / Profile pane (desktop)
//   /settings/profile
//   /settings/organization
//   /settings/preferences
// Retired /settings/you|social|education|aggregation and ?section=
// aliases are gone. Dead paths 404. Do not add a redirect table.
//
// Account menu Settings always opens the hub. settingsLandHref is
// /settings from every workspace — no context land that swaps the
// spine. Section switch is not a workspace switch (no cookie write).
//
// Existing /settings/agreements, /settings/refer stay Profile doors.
// Company persist stays organizations.name.
// Theme SoT is gc-theme — header sun/moon and Preferences Appearance
// share it. Help stays /help.
//
// 600:881 shell — one 220 rail occupies the Access slot on every
// /settings path. Pad 16. Active wash follows the hub section.
// Rail keeps house Settings title + Profile · Organization · Preferences.
// Body H1 is the hub section only — never repeat Settings in the pane.
// House muted wash. Sporty Blue only (no new brand colors).
// Desktop: section rail + pane. Mobile: list → push.
// Spacing 8 / 16 / 24 / 48 (Mercury density). Design polish may follow.

import { HOUSE_CARD_PAD, HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";
import { ASK_ASSISTANT } from "@/lib/product";
import { EDUCATION_MANAGE_HREF } from "@/lib/education";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import { USER_MENU } from "@/lib/user-menu";

export const SETTINGS = {
  title: "Settings",
  href: "/settings",
  profile: USER_MENU.profile,
  profileHref: USER_MENU.profileHref,
  organization: "Organization",
  organizationHref: "/settings/organization",
  preferences: "Preferences",
  preferencesHref: "/settings/preferences",
  manageCourses: "Manage courses",
  manageCoursesHref: EDUCATION_MANAGE_HREF,
  organizationEmpty: "No organization on this account.",
  company: "Company",
  agreements: USER_MENU.agreements,
  agreementsHref: USER_MENU.agreementsHref,
  agreementsEmpty: "No agreements on this account.",
  refer: USER_MENU.refer,
  referHref: USER_MENU.referHref,
  dashboard: "Home",
  dashboardHref: DASHBOARD_HREF,
} as const;

export const SETTINGS_ABSENT = [
  "User Profile",
  "Company Profile",
  "Phone",
  "Job",
  "Used to sign in.",
  "Name and email on this account.",
  "Edit public profile",
] as const;

export type SettingsHubSection = "profile" | "organization" | "preferences";

export type SettingsRailKind = SettingsHubSection;

export const SETTINGS_HUB_ORDER = [
  "profile",
  "organization",
  "preferences",
] as const satisfies readonly SettingsHubSection[];

export const SETTINGS_HUB_HREFS = {
  profile: SETTINGS.profileHref,
  organization: SETTINGS.organizationHref,
  preferences: SETTINGS.preferencesHref,
} as const;

export const SETTINGS_HUB_LABELS = {
  profile: SETTINGS.profile,
  organization: SETTINGS.organization,
  preferences: SETTINGS.preferences,
} as const;

export type SettingsHubNavItem = {
  kind: SettingsHubSection;
  label: (typeof SETTINGS_HUB_LABELS)[SettingsHubSection];
  href: (typeof SETTINGS_HUB_HREFS)[SettingsHubSection];
};

const SETTINGS_HUB_ALL: readonly SettingsHubNavItem[] = SETTINGS_HUB_ORDER.map((kind) => ({
  kind,
  label: SETTINGS_HUB_LABELS[kind],
  href: SETTINGS_HUB_HREFS[kind],
}));

/** Universal hub. Same three sections from every workspace. */
export function settingsHubNav(): readonly SettingsHubNavItem[] {
  return SETTINGS_HUB_ALL;
}

/** Desktop rail + mobile list. Profile · Organization · Preferences. */
export const SETTINGS_HUB_NAV = settingsHubNav();

// Rail chrome — 220 slot, pad 16, 8 between rows. Do not put Titles,
// Appearance, Workspace, Account, Users, API, Team, or Manage courses here.
export const SETTINGS_RAIL_PAD_CLASS = "p-[var(--space-4)]";
export const SETTINGS_RAIL_NAV_CLASS = "flex flex-col gap-[var(--space-2)]";
export const SETTINGS_RAIL_ITEM_CLASS =
  "flex items-center rounded-full px-[var(--space-2)] py-[var(--space-2)] t-body leading-5";
export const SETTINGS_RAIL_DASHBOARD_CLASS = "gap-[var(--space-2)]";
export const SETTINGS_RAIL_ACTIVE_CLASS = "bg-surface-muted text-ink";
export const SETTINGS_RAIL_IDLE_CLASS =
  "text-ink-2 hover:bg-surface-muted hover:text-ink";
export const SETTINGS_RAIL_CHEVRON_CLASS = "size-4 shrink-0";
/** House Settings rail title — keep existing t-section treatment. */
export const SETTINGS_RAIL_TITLE_CLASS = "t-section text-ink";
/** Body page title. Hub section only. */
export const SETTINGS_PANE_TITLE_CLASS = "t-section text-ink";

export const SETTINGS_PANE_CLASS = "flex flex-col gap-[var(--space-12)]";
export const SETTINGS_SECTION_CLASS = "flex flex-col gap-[var(--space-6)]";
export const SETTINGS_QUIET_ROW_CLASS =
  "flex items-center justify-between t-body leading-5 text-ink";

// Preferences Appearance — house muted module + pad 16. Same surface
// as dashboard / directory modules. Not card-surface (Profile /
// Organization form frame). Notification groups are not this card.
export const SETTINGS_PREF_BLOCK_CLASS =
  `${HOUSE_MODULE_CLASS} ${HOUSE_CARD_PAD} flex flex-col gap-[var(--space-3)]`;
export const SETTINGS_PREF_TITLE_CLASS = "t-heading text-ink";

// 623:785 — phone header left slot. Hub list back is Home. Pushed
// section back is Settings (list). Hidden at md, where the rail stays.
export const SETTINGS_HEADER_PAD_CLASS = MOBILE_CHROME_LEAD_PAD_CLASS;
export const SETTINGS_HEADER_BACK_CLASS =
  "flex items-center gap-[var(--space-2)] t-body md:hidden";

export const SETTINGS_RAIL_ABSENT = [
  "Titles",
  "Deliveries",
  "Recent activity",
  "Activity",
  ASK_ASSISTANT,
  "Queue",
  "Avails",
  "Channels",
  "Finance",
  "Clients",
  "Account",
  "Users",
  "API",
  "Appearance",
  "Workspace",
  "You",
  "Social",
  "Education",
  "Aggregation",
  "Company",
  "Team",
  SETTINGS.manageCourses,
  "Home",
] as const;

export function isSettingsPath(pathname: string): boolean {
  return pathname === SETTINGS.href || pathname.startsWith(`${SETTINGS.href}/`);
}

/** Account-menu Settings door. Always the hub — never a workspace land. */
export function settingsLandHref(pathname?: string | null): string {
  void pathname;
  return SETTINGS.href;
}

export function settingsManageCoursesVisible(isGcStaff: boolean): boolean {
  return isGcStaff === true;
}

export function settingsHeaderBack(pathname: string | null | undefined): {
  href: string;
  label: string;
} {
  if (!pathname || pathname === SETTINGS.href) {
    return { href: SETTINGS.dashboardHref, label: SETTINGS.dashboard };
  }
  return { href: SETTINGS.href, label: SETTINGS.title };
}

function pathSection(pathname: string): SettingsHubSection {
  if (
    pathname === SETTINGS.organizationHref
    || pathname.startsWith(`${SETTINGS.organizationHref}/`)
  ) {
    return "organization";
  }
  if (
    pathname === SETTINGS.preferencesHref
    || pathname.startsWith(`${SETTINGS.preferencesHref}/`)
  ) {
    return "preferences";
  }
  return "profile";
}

/** Hub section from the path. Profile doors (agreements / refer) wash Profile. */
export function settingsHubSection(pathname: string | null | undefined): SettingsHubSection {
  if (!pathname) return "profile";
  return pathSection(pathname);
}

/** Body page title — hub section only. Never SETTINGS.title. */
export function settingsPaneTitle(section: SettingsHubSection): string {
  return SETTINGS_HUB_LABELS[section];
}

/** Active follows the hub section. */
export function settingsRailActive(kind: SettingsRailKind, section: SettingsHubSection): boolean {
  return kind === section;
}
