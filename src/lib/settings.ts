// Settings hub. Copy and path contract live here, not in JSX.
//
// Universal Account/Settings hub — not owned by Aggregation / Social /
// Education. Title Settings. One door from every workspace.
// CMS is not inside Settings. Staff Manage courses lives on the
// Education workspace (/education/manage), not Preferences.
// Not a GC Staff admin surface.
//
// Hub sections:
//   Profile · Organization · Preferences
// Same URLs regardless of active workspace. Do not keep You / Social /
// Education / Aggregation as the IA spine.
// Profile is account identity only (name / photo / sign-in email +
// Save). Public / Social profile is Social-owned — edit it from
// Social, not from a Settings door.
// Organization holds the company profile and Team invite (same
// account, existing org_role). House grant/comp is staff-only on
// /gc/clients — never a customer Settings directory.
// Preferences holds Appearance (same gc-theme SoT as the header
// sun/moon), the speech-learning opt-out, and the notification
// matrix. Mobile Preferences is a
// Coinbase drill-in: Theme and Notifications are rows; edit panes
// live at /theme and /notifications. Desktop keeps the on-page
// card and matrix inside SETTINGS_CONTENT_MEASURE_CLASS — a
// constrained measure, not full-bleed rows across the rail-to-edge
// span. Leftover workspace prefs may appear as optional
// subsections only — never as a You / Social / Education /
// Aggregation spine.
//
// Canonical paths only (hard-cut — no users yet, no redirects):
//   /settings → hub (mobile list) / Profile pane (desktop)
//   /settings/profile
//   /settings/profile/name
//   /settings/organization
//   /settings/organization/company
//   /settings/organization/entities/new
//   /settings/organization/entities/[id]
//   /settings/preferences
//   /settings/preferences/theme
//   /settings/preferences/notifications
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
// share it. Get Help / Give feedback stay on /help — never Settings
// hub chrome.
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
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import { USER_MENU } from "@/lib/user-menu";

export const SETTINGS = {
  title: "Settings",
  href: "/settings",
  profile: USER_MENU.profile,
  profileHref: USER_MENU.profileHref,
  organization: "Rights Holder",
  organizationHref: "/settings/organization",
  preferences: "Preferences",
  preferencesHref: "/settings/preferences",
  theme: "Theme",
  themeHref: "/settings/preferences/theme",
  themeHelper: "Choose Light, Dark, or System default.",
  notificationsHref: "/settings/preferences/notifications",
  profileNameHref: "/settings/profile/name",
  organizationEmpty: "No rights holder on this account.",
  company: "Company",
  team: "Team",
  agreements: USER_MENU.agreements,
  agreementsHref: USER_MENU.agreementsHref,
  agreementsEmpty: "No agreements on this account.",
  refer: USER_MENU.refer,
  referHref: USER_MENU.referHref,
  back: "Back",
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
  "Home",
  "Get Help",
  "Give feedback",
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
// Item / active / idle / title tokens come from HOUSE_RAIL_* in house-shell.ts.
// Settings is not a workspace but its rail shares the house rail SoT —
// do not fork accent, pill, or title tokens here.
export const SETTINGS_RAIL_PAD_CLASS = "p-[var(--space-4)]";
export const SETTINGS_RAIL_NAV_CLASS = "flex flex-col gap-[var(--space-2)]";
export const SETTINGS_RAIL_DASHBOARD_CLASS = "gap-[var(--space-2)]";
export const SETTINGS_RAIL_CHEVRON_CLASS = "size-4 shrink-0";
/** Body page title. Hub section only. */
export const SETTINGS_PANE_TITLE_CLASS = "t-section text-ink";

export const SETTINGS_PANE_CLASS = "flex flex-col gap-[var(--space-6)]";
export const SETTINGS_SECTION_CLASS = "flex flex-col gap-[var(--space-6)]";
/** Quiet section label under a page title — not a second h1. */
export const SETTINGS_SECTION_LABEL_CLASS = "t-label text-ink-3";

// Coinbase / Apple Settings grammar — one SoT. Shared SoT for
// Settings index, Profile, Preferences, Rights Holder / Legal Entities,
// and Get Help. Do not fork a lookalike row.
// Row: label · muted secondary · chevron. Whole row tappable.
// Read-only rows drop the chevron. Inset group: quiet label above,
// rows on one muted house surface. Add / Invite are trailing rows
// inside the group — never header pills. Light 24Frame register.
export const SETTINGS_DRILL_LIST_CLASS = "flex flex-col";
export const SETTINGS_DRILL_ROW_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-4)] py-[var(--space-3)] text-left t-body leading-5 text-ink";
export const SETTINGS_DRILL_COPY_CLASS = "flex min-w-0 flex-col gap-[var(--space-1)]";
// Person rows: avatar stays leading. Identity + trailing stack on
// phone so the row never truncates. Desktop keeps identity · action.
export const SETTINGS_DRILL_LEADING_BODY_CLASS =
  "flex min-w-0 flex-1 flex-col items-start gap-[var(--space-2)] md:flex-row md:items-center md:justify-between md:gap-[var(--space-4)]";
export const SETTINGS_DRILL_VALUE_CLASS = "t-body-sm text-ink-3";
export const SETTINGS_DRILL_ACCENT_CLASS = "text-accent";
export const SETTINGS_DRILL_CHEVRON_CLASS = `${SETTINGS_RAIL_CHEVRON_CLASS} text-ink-3`;

// House equivalent of an inset grouped list. Quiet label sits above;
// rows live in one muted rounded surface. Not card-surface, not a
// titled Card with a header pill.
export const SETTINGS_GROUP_STACK_CLASS = "flex flex-col gap-[var(--space-2)]";
/** Same quiet label as SETTINGS_SECTION_LABEL_CLASS — no twin. */
export const SETTINGS_GROUP_LABEL_CLASS = SETTINGS_SECTION_LABEL_CLASS;
export const SETTINGS_GROUP_CLASS =
  `${HOUSE_MODULE_CLASS} overflow-hidden px-[var(--space-4)]`;
export const SETTINGS_GROUP_LIST_CLASS =
  "flex list-none flex-col divide-y divide-hairline";

// RH index cards stay on desktop. Phone drops the frame so the
// grouped list is the surface — not a website card stack.
export const SETTINGS_INDEX_CARD_CLASS =
  "max-md:!border-0 max-md:!bg-transparent max-md:!rounded-none";
export const SETTINGS_INDEX_CARD_BODY_CLASS = "max-md:!p-0";

// Compact Dialog form density — labeled fields + DialogFooter.
// Mutate surfaces on Settings use this, not a stacked page form.
// Field labels match Coinbase drill-in / Preferences: small muted
// sentence case. Not t-label ALL-CAPS. Errors are quiet type, not
// a muted dump box. Grouped fields sit on the house muted module.
export const SETTINGS_DIALOG_FORM_CLASS = "flex flex-col gap-[var(--space-3)]";
export const SETTINGS_DIALOG_FIELD_CLASS = "flex flex-col gap-[var(--space-2)]";
export const SETTINGS_DIALOG_LABEL_CLASS = "t-body-sm normal-case tracking-normal text-ink-3";
export const SETTINGS_DIALOG_ERROR_CLASS = "t-body-sm text-ink-2";
export const SETTINGS_DIALOG_GROUP_CLASS =
  `${HOUSE_MODULE_CLASS} ${HOUSE_CARD_PAD} flex flex-col gap-[var(--space-4)]`;
export const SETTINGS_DIALOG_FOOTER_CLASS =
  "max-md:flex-col-reverse max-md:items-stretch";
export const SETTINGS_DIALOG_HELP_CLASS = "t-body-sm text-ink-3";
export const SETTINGS_EDIT_HELPER_CLASS = SETTINGS_DIALOG_HELP_CLASS;

// Preferences Appearance — house muted module + pad 16. Same surface
// as dashboard / directory modules. Not card-surface (Profile /
// Organization form frame). Notification groups are not this card.
// Desktop: readable settings column (~48rem). Phone stays full
// content width — do not constrain the Coinbase drill-in stack.
export const SETTINGS_CONTENT_MEASURE_CLASS = "w-full md:max-w-[48rem]";
export const SETTINGS_PREF_BLOCK_CLASS =
  `${HOUSE_MODULE_CLASS} ${HOUSE_CARD_PAD} ${SETTINGS_CONTENT_MEASURE_CLASS} flex flex-col gap-[var(--space-3)]`;
export const SETTINGS_PREF_TITLE_CLASS = "t-heading text-ink";

// Mobile Settings page-lead back = News PageHeader ArrowLeft SoT.
// settingsHeaderBack() is the routing SoT: hub → Back (client history
// when there is an in-app referrer; dashboard land only as fallback),
// hub section → Settings, drill-in pane → parent section. Hidden at
// md, where the Settings rail stays. Do not hard-label the hub "Home"
// — Settings is account chrome from any surface, not a Home-owned
// workspace. News stays "Home". Do not put a caret in HouseLeadChrome.
// Do not fork a third back glyph.
export const SETTINGS_HEADER_PAD_CLASS = MOBILE_CHROME_LEAD_PAD_CLASS;
export const SETTINGS_PAGE_LEAD_BACK_CLASS = "md:hidden";

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
  "Manage courses",
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

/** Parent label for a Settings drill-in (`/settings/{section}/{field}`). */
export function settingsDrillParentLabel(parentHref: string): string {
  if (parentHref === SETTINGS.profileHref) return SETTINGS.profile;
  if (parentHref === SETTINGS.organizationHref) return SETTINGS.organization;
  if (parentHref === SETTINGS.preferencesHref) return SETTINGS.preferences;
  if (parentHref === SETTINGS.agreementsHref) return SETTINGS.agreements;
  if (parentHref === SETTINGS.referHref) return SETTINGS.refer;
  return SETTINGS.title;
}

export function settingsHeaderBack(pathname: string | null | undefined): {
  href: string;
  label: string;
} {
  if (!pathname || pathname === SETTINGS.href) {
    return { href: SETTINGS.dashboardHref, label: SETTINGS.back };
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "settings" && parts.length >= 3) {
    const parent = `/${parts[0]}/${parts[1]}`;
    return { href: parent, label: settingsDrillParentLabel(parent) };
  }
  return { href: SETTINGS.href, label: SETTINGS.title };
}

/** Same-origin document.referrer = usable in-app history for hub Back. */
export function settingsHubHasInAppReferrer(
  referrer: string | null | undefined,
  origin: string,
): boolean {
  if (!referrer || !origin) return false;
  try {
    return new URL(referrer).origin === origin;
  } catch {
    return false;
  }
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
