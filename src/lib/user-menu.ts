// Account-menu copy and lock. Lives in lib/, not JSX.
// Desktop panel: identity → Profile → Settings → Log out.
// Phone sheet (grammar A): identity → Profile → Settings →
// 24Frame AI → Appearance → Log out. Chrome may differ (sheet
// vs fuller panel). Labels may not fork on the shared rows.
// Workspace lives on the header switcher. Desktop theme stays
// the header sun/moon. Phone Appearance is the pre-#391
// same-sheet drill-in — not a page. One Settings hub. No
// forked Settings.
// Profile is /settings/profile (identity). Settings land href is
// settingsLandHref() — always /settings. Do not invent /account/*.
// Agreements / Refer stay /settings doors, not menu rows. Help
// stays /help. Company stays off this menu. Do not invent
// /account/workspace, /settings/workspace, /account/appearance,
// or /settings/appearance. Legal is parked. Do not invent
// Phone, Job, Notifications, Privacy, Manage account, or a name
// derived from the email local-part.

import { version as APP_VERSION } from "../../package.json";
import { ASSISTANT_NAME } from "@/lib/product";

export const USER_MENU = {
  workspace: "Workspace",
  profile: "Profile",
  profileHref: "/settings/profile",
  settings: "Settings",
  settingsHref: "/settings",
  agreements: "Agreements",
  agreementsHref: "/settings/agreements",
  appearance: "Appearance",
  askAssistant: ASSISTANT_NAME,
  askAssistantHref: "?ai=1",
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
    }
  | {
      kind: "askAssistant";
      label: typeof USER_MENU.askAssistant;
      href: typeof USER_MENU.askAssistantHref;
    };

export type UserMenuAction =
  | UserMenuLinkAction
  | { kind: "appearance"; label: typeof USER_MENU.appearance };

export const USER_MENU_ACTIONS: readonly UserMenuLinkAction[] = [
  { kind: "profile", label: USER_MENU.profile, href: USER_MENU.profileHref },
  { kind: "settings", label: USER_MENU.settings, href: USER_MENU.settingsHref },
];

export const USER_MENU_PHONE_ACTIONS: readonly UserMenuAction[] = [
  ...USER_MENU_ACTIONS,
  { kind: "askAssistant", label: USER_MENU.askAssistant, href: USER_MENU.askAssistantHref },
  { kind: "appearance", label: USER_MENU.appearance },
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
