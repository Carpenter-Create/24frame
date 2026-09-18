// Account-menu copy and lock. Lives in lib/, not JSX.
// One list for both instances: desktop panel and mobile sheet.
// Chrome may differ (sheet vs fuller panel). Labels may not.
// Mercury order: identity → Profile → Settings → Log out.
// Workspace lives on the header switcher. Phone theme is the
// avatar Appearance drill-in — not a USER_MENU_ACTIONS row, not
// a page. md+ theme stays the header sun/moon. One Settings hub.
// No forked Settings.
// Profile is /settings/profile (You identity). Settings land href
// is settingsLandHref(pathname) — do not invent /account/*.
// Agreements / Refer stay /settings doors, not menu rows. Help
// stays /help. Company stays off this menu. Do not invent
// /account/workspace, /settings/workspace, /account/appearance,
// or /settings/appearance. Legal is parked. Do not invent
// Phone, Job, Notifications, Privacy, Manage account, or a name
// derived from the email local-part.

import { version as APP_VERSION } from "../../package.json";

export const USER_MENU = {
  workspace: "Workspace",
  profile: "Profile",
  profileHref: "/settings/profile",
  settings: "Settings",
  settingsHref: "/settings",
  agreements: "Agreements",
  agreementsHref: "/settings/agreements",
  appearance: "Appearance",
  help: "Help",
  helpHref: "/help",
  refer: "Refer a friend",
  referHref: "/settings/refer",
  logOut: "Log out",
  versionPrefix: "v",
} as const;

export const USER_MENU_ABSENT = [
  "Workspace",
  "Workspaces",
  "Manage account",
  "Notifications",
  "Privacy",
  "Sign out",
  "User Profile",
  "Company Profile",
  "Phone",
  "Job",
  "Legal",
] as const;

export type UserMenuLinkAction =
  | {
      kind: "profile";
      label: typeof USER_MENU.profile;
      href: typeof USER_MENU.profileHref;
    }
  | {
      kind: "settings";
      label: typeof USER_MENU.settings;
      href: typeof USER_MENU.settingsHref;
    };

export type UserMenuAction = UserMenuLinkAction;

export const USER_MENU_ACTIONS: readonly UserMenuAction[] = [
  { kind: "profile", label: USER_MENU.profile, href: USER_MENU.profileHref },
  { kind: "settings", label: USER_MENU.settings, href: USER_MENU.settingsHref },
];

export function userMenuVersion(): string {
  return `${USER_MENU.versionPrefix}${APP_VERSION}`;
}

/** Avatar letter from the email. Not a name. */
export function userMenuAvatarInitial(email: string): string {
  return (email.trim().charAt(0) || "?").toUpperCase();
}

/**
 * A real display name only. Empty or whitespace is absent.
 * Never derive a name from an email — callers must pass a name that
 * already exists, or omit it.
 */
export function userMenuName(name: string | null | undefined): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type UserMenuPanelModel = {
  avatarInitial: string;
  name: string | null;
  email: string;
  actions: readonly UserMenuAction[];
};

export function userMenuPanel(email: string, name?: string | null): UserMenuPanelModel {
  return {
    avatarInitial: userMenuAvatarInitial(email),
    name: userMenuName(name),
    email,
    actions: USER_MENU_ACTIONS,
  };
}
