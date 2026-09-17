// Settings hub. Copy and path contract live here, not in JSX.
//
// One Account/Settings hub. Title Settings. Not three Settings apps.
// CMS is not inside Settings — staff Manage courses is a link out.
//
// Hub sections (omit a workspace section if the user has no lane):
//   You · Social · Education · Aggregation
// You is always present. You is identity + sign-in already in product
// (name / photo / sign-in email). Edit public profile deep-links to the
// existing Social editor — do not duplicate that editor here.
// Workspace panes are mode prefs only. HouseEmpty if none exist yet.
// Aggregation holds the existing company Settings surface.
//
// Context land contract:
//   Path: /settings/{you|social|education|aggregation}
//   Query alias: /settings?section={you|social|education|aggregation}
//   Account menu Settings uses settingsLandHref(pathname).
//   Open from Education / Social / Aggregation land → that section.
//   No workspace context → You.
//   /settings/{section} is already in-hub — stay on that section.
//   Section switch is not a workspace switch (no cookie write).
//
// Staff-only Education row: exact label Manage courses → /education.
// Members never see it. Member Education land stays /social/courses.
// Do not invent /education as a member workspace door here.
//
// Existing /settings/profile, /settings/agreements, /settings/refer
// stay You doors. Company persist stays organizations.name.
// Appearance stays in-menu. Help stays /help.
//
// 600:881 shell — one 220 rail occupies the Access slot on every
// /settings path. Pad 16. Active wash follows the hub section.
// House muted wash. Sporty Blue only (no new brand colors).
// Desktop: section rail + pane. Mobile: list → push.
// Spacing 8 / 16 / 24 / 48 (Mercury density). Design polish may follow.

import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";
import {
  ASK_ASSISTANT,
  WORKSPACE_AGGREGATION_LABEL,
  WORKSPACE_SOCIAL_LABEL,
} from "@/lib/product";
import { SOCIAL_ROUTES } from "@/lib/social";
import { USER_MENU } from "@/lib/user-menu";
import { WORKSPACE_EDUCATION_LABEL } from "@/lib/workspace-menu";
import {
  isAggregationPath,
  isEducationPath,
  isSocialPath,
  type WorkspaceMode,
} from "@/lib/workspace";

export const SETTINGS = {
  title: "Settings",
  href: "/settings",
  you: "You",
  youHref: "/settings/you",
  social: WORKSPACE_SOCIAL_LABEL,
  socialHref: "/settings/social",
  education: WORKSPACE_EDUCATION_LABEL,
  educationHref: "/settings/education",
  aggregation: WORKSPACE_AGGREGATION_LABEL,
  aggregationHref: "/settings/aggregation",
  sectionQuery: "section",
  manageCourses: "Manage courses",
  manageCoursesHref: "/education",
  editPublicProfile: "Edit public profile",
  editPublicProfileHref: SOCIAL_ROUTES.profileEdit,
  socialEmpty: "No Social preferences on this account.",
  educationEmpty: "No Education preferences on this account.",
  aggregationEmpty: "No Aggregation preferences on this account.",
  profile: USER_MENU.profile,
  profileHref: USER_MENU.profileHref,
  company: "Company",
  agreements: USER_MENU.agreements,
  agreementsHref: USER_MENU.agreementsHref,
  agreementsEmpty: "No agreements on this account.",
  refer: USER_MENU.refer,
  referHref: USER_MENU.referHref,
  dashboard: "Home",
  dashboardHref: "/",
} as const;

export const SETTINGS_ABSENT = [
  "User Profile",
  "Company Profile",
  "Phone",
  "Job",
  "Used to sign in.",
  "Name and email on this account.",
] as const;

export type SettingsHubSection = "you" | "social" | "education" | "aggregation";

/** @deprecated Use SettingsHubSection. Old rail kinds mapped onto You. */
export type SettingsSection = SettingsHubSection | "profile" | "agreements" | "refer";

export type SettingsRailKind = SettingsHubSection;

export const SETTINGS_HUB_ORDER = [
  "you",
  "social",
  "education",
  "aggregation",
] as const satisfies readonly SettingsHubSection[];

export const SETTINGS_HUB_HREFS = {
  you: SETTINGS.youHref,
  social: SETTINGS.socialHref,
  education: SETTINGS.educationHref,
  aggregation: SETTINGS.aggregationHref,
} as const;

export const SETTINGS_HUB_LABELS = {
  you: SETTINGS.you,
  social: SETTINGS.social,
  education: SETTINGS.education,
  aggregation: SETTINGS.aggregation,
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

export function settingsHubNav(
  lanes: readonly WorkspaceMode[] = ["aggregation", "social", "education"],
): readonly SettingsHubNavItem[] {
  const allowed = new Set(lanes);
  return SETTINGS_HUB_ALL.filter((item) => item.kind === "you" || allowed.has(item.kind));
}

/** Desktop rail + mobile list. You always. Workspace sections follow lane access. */
export const SETTINGS_HUB_NAV = settingsHubNav();

/** @deprecated Hub rail is SETTINGS_HUB_NAV. Kept for You-door tests. */
export const SETTINGS_LOCAL_NAV = SETTINGS_HUB_NAV;

// Rail chrome — 220 slot, pad 16, 8 between rows. Do not put Titles,
// Appearance, Workspace, Account, Users, API, or Manage courses here.
export const SETTINGS_RAIL_PAD_CLASS = "p-[var(--space-4)]";
export const SETTINGS_RAIL_NAV_CLASS = "flex flex-col gap-[var(--space-2)]";
export const SETTINGS_RAIL_ITEM_CLASS =
  "flex items-center rounded-full px-[var(--space-2)] py-[var(--space-2)] t-body leading-5";
export const SETTINGS_RAIL_DASHBOARD_CLASS = "gap-[var(--space-2)]";
export const SETTINGS_RAIL_ACTIVE_CLASS = "bg-surface-muted text-ink";
export const SETTINGS_RAIL_IDLE_CLASS =
  "text-ink-2 hover:bg-surface-muted hover:text-ink";
export const SETTINGS_RAIL_CHEVRON_CLASS = "size-4 shrink-0";
export const SETTINGS_RAIL_TITLE_CLASS = "t-section text-ink";

export const SETTINGS_PANE_CLASS = "flex flex-col gap-[var(--space-12)]";
export const SETTINGS_SECTION_CLASS = "flex flex-col gap-[var(--space-6)]";
export const SETTINGS_QUIET_ROW_CLASS =
  "flex items-center justify-between t-body leading-5 text-ink";

// 623:785 — phone header left slot. Hub list back is Home. Pushed
// section back is Settings (list). Hidden at md, where the rail stays.
export const SETTINGS_HEADER_PAD_CLASS = MOBILE_CHROME_LEAD_PAD_CLASS;
export const SETTINGS_HEADER_BACK_CLASS =
  "flex items-center gap-[var(--space-2)] t-body md:hidden";

export const SETTINGS_RAIL_ABSENT = [
  "Titles",
  "Deliveries",
  "Attention",
  ASK_ASSISTANT,
  "Queue",
  "Avails",
  "Vendors",
  "Finance",
  "Clients",
  "Account",
  "Users",
  "API",
  "Appearance",
  "Workspace",
  "Company",
  SETTINGS.manageCourses,
  "Home",
] as const;

export function isSettingsPath(pathname: string): boolean {
  return pathname === SETTINGS.href || pathname.startsWith(`${SETTINGS.href}/`);
}

export function parseSettingsSectionQuery(
  value: string | null | undefined,
): SettingsHubSection | null {
  if (value === "you" || value === "social" || value === "education" || value === "aggregation") {
    return value;
  }
  return null;
}

export function settingsSectionHref(section: SettingsHubSection): string {
  return SETTINGS_HUB_HREFS[section];
}

export function settingsPathFromQuery(value: string | null | undefined): string | null {
  const section = parseSettingsSectionQuery(value);
  return section ? settingsSectionHref(section) : null;
}

function isEducationAdminPath(pathname: string): boolean {
  return pathname === "/education" || pathname.startsWith("/education/")
    || pathname === "/gc/education" || pathname.startsWith("/gc/education/");
}

/** Workspace destination only — not cookie, not a Settings path. */
export function settingsContextSection(pathname: string | null | undefined): SettingsHubSection {
  if (!pathname) return "you";
  if (isSettingsPath(pathname)) return settingsHubSection(pathname);
  if (isEducationPath(pathname) || isEducationAdminPath(pathname)) return "education";
  if (isSocialPath(pathname)) return "social";
  if (isAggregationPath(pathname)) return "aggregation";
  return "you";
}

/** Account-menu Settings door. Section switch does not write the workspace cookie. */
export function settingsLandHref(pathname: string | null | undefined): string {
  return settingsSectionHref(settingsContextSection(pathname));
}

export function settingsCanAccessSection(
  section: SettingsHubSection,
  lanes: readonly WorkspaceMode[],
): boolean {
  if (section === "you") return true;
  return lanes.includes(section);
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
  if (pathname === SETTINGS.socialHref || pathname.startsWith(`${SETTINGS.socialHref}/`)) {
    return "social";
  }
  if (pathname === SETTINGS.educationHref || pathname.startsWith(`${SETTINGS.educationHref}/`)) {
    return "education";
  }
  if (pathname === SETTINGS.aggregationHref || pathname.startsWith(`${SETTINGS.aggregationHref}/`)) {
    return "aggregation";
  }
  return "you";
}

/** Hub section from the path. You doors (profile / agreements / refer) wash You. */
export function settingsHubSection(pathname: string | null | undefined): SettingsHubSection {
  if (!pathname) return "you";
  return pathSection(pathname);
}

/** Path doors. Unknown /settings paths open You. */
export function settingsSection(pathname: string | null | undefined): SettingsHubSection {
  return settingsHubSection(pathname);
}

/** Active follows the hub section. */
export function settingsRailActive(kind: SettingsRailKind, section: SettingsHubSection): boolean {
  return kind === section;
}
