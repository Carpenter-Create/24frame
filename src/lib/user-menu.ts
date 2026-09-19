// Account-menu copy and lock. Lives in lib/, not JSX.
// Apple door — phone sheet and desktop 264 share one stack:
// identity → Settings → Get Help → Log out. Chrome may differ
// (full-bleed sheet vs dropdown). Labels may not fork.
// 24Frame AI is the header sparkle only — not a menu row.
// Workspace lives on the header switcher. Theme SoT is Settings
// Preferences (and the desktop header sun/moon). Do not put a
// second Appearance row on this menu. One Settings hub. No
// forked Settings.
// Profile is a Settings hub pane (/settings/profile), not a
// second avatar-menu door. Settings land href is
// settingsLandHref() — always /settings. Do not invent /account/*.
// Agreements / Refer stay /settings doors, not menu rows. Get Help
// is the avatar-menu footer door — /help. Give feedback lives on
// /help/feedback, not Settings. Company stays off this menu. Do
// not invent /account/workspace, /settings/workspace,
// /account/appearance, /settings/appearance, or /account/feedback.
// Legal is parked. Do not invent Phone, Job, Notifications,
// Privacy, Manage account, or a name derived from the email
// local-part.

import { version as APP_VERSION } from "../../package.json";
import { ASK_ASSISTANT, ASSISTANT_NAME } from "@/lib/product";

export const USER_MENU = {
  workspace: "Workspace",
  profile: "Profile",
  profileHref: "/settings/profile",
  settings: "Settings",
  settingsHref: "/settings",
  agreements: "Agreements",
  agreementsHref: "/settings/agreements",
  appearance: "Appearance",
  help: "Get Help",
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
  ASSISTANT_NAME,
  ASK_ASSISTANT,
] as const;

export type UserMenuSettingsAction = {
  kind: "settings";
  label: typeof USER_MENU.settings;
  href: typeof USER_MENU.settingsHref;
};

export type UserMenuHelpAction = {
  kind: "help";
  label: typeof USER_MENU.help;
  href: typeof USER_MENU.helpHref;
};

export type UserMenuLinkAction = UserMenuSettingsAction | UserMenuHelpAction;

export type UserMenuAction = UserMenuLinkAction;

export const USER_MENU_PRIMARY_ACTIONS: readonly UserMenuSettingsAction[] = [
  { kind: "settings", label: USER_MENU.settings, href: USER_MENU.settingsHref },
];

export const USER_MENU_HELP_ACTIONS: readonly UserMenuHelpAction[] = [
  { kind: "help", label: USER_MENU.help, href: USER_MENU.helpHref },
];

export const USER_MENU_ACTIONS: readonly UserMenuLinkAction[] = [
  ...USER_MENU_PRIMARY_ACTIONS,
  ...USER_MENU_HELP_ACTIONS,
];

// Same IA on phone and desktop. Theme lives in Settings Preferences.
export const USER_MENU_PHONE_ACTIONS: readonly UserMenuAction[] = USER_MENU_ACTIONS;

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
