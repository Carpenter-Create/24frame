// Mercury workspace switcher. Lives in lib/, not JSX.
// Placement is pre-#321: header right cluster, left of the avatar.
// One switcher — no rail / header-lead duplicate. Rail top-left
// stays the static 24 brand. Social / Education share that same
// trailing cluster. Social-only icons sit left of the slot so the
// avatar x does not shift.
//
// Trigger: truncated current workspace name only. No leading mark
// or circle — the avatar already provides that. Chevron is hidden
// at rest; it appears on hover / focus and while the menu is open
// (touch: press/open). Menu order: current-workspace header →
// Settings (the existing /settings door only) → list with leading
// marks, flush-left names, trailing Sporty Blue check (#320).
//
// Three workspaces only. No All Accounts clone. No Referrals /
// billing. Staff Manage courses stays a Settings door — not a fourth
// lane. Education land stays Route A /social/courses.
// Persist with persistWorkspaceCookie — do not invent a second
// cookie. Do not invent /education, /account/workspace, or
// /settings/workspace.

import { SOCIAL_WORKSPACE } from "@/lib/product";
import { settingsLandHref } from "@/lib/settings";
import { USER_MENU } from "@/lib/user-menu";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
} from "@/lib/workspace-menu";
import type { WorkspaceMode } from "@/lib/workspace";

export const WORKSPACE_SWITCHER = {
  label: USER_MENU.workspace,
  settings: USER_MENU.settings,
} as const;

export const WORKSPACE_SWITCHER_ABSENT = [
  "All Accounts",
  "Referrals",
  "Refer a friend",
  "billing",
  "Manage courses",
] as const;

export const WORKSPACE_SWITCHER_ROLE = {
  aggregation: "Catalog",
  social: SOCIAL_WORKSPACE,
  education: "Courses",
} as const satisfies Record<WorkspaceMode, string>;

export const WORKSPACE_SWITCHER_MARK = {
  aggregation: "A",
  social: "S",
  education: "E",
} as const satisfies Record<WorkspaceMode, string>;

export const WORKSPACE_SWITCHER_TRIGGER_CLASS =
  "group flex min-w-0 items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-2 py-1 t-body-sm font-medium text-ink transition-colors hover:bg-surface-muted";

export const WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS = "min-w-0 truncate";

export const WORKSPACE_SWITCHER_STATIC_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] px-2 py-1 t-body-sm font-medium text-ink";

// Hidden at rest. Desktop hover / keyboard focus reveals it. Open
// state adds opacity-100 so touch press/open is enough — no permanent
// arrow on a quiet Mercury trigger.
export const WORKSPACE_SWITCHER_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export const WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS = "opacity-100";

export const WORKSPACE_SWITCHER_PANEL_CLASS =
  "absolute right-0 top-full z-50 mt-[var(--space-2)] flex min-w-[16rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

export const WORKSPACE_SWITCHER_HEADER_CLASS =
  "flex items-center gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)]";

export const WORKSPACE_SWITCHER_HEADER_COPY_CLASS = "min-w-0 flex-1";

export const WORKSPACE_SWITCHER_HEADER_NAME_CLASS = "truncate t-body font-medium text-ink";

export const WORKSPACE_SWITCHER_HEADER_ROLE_CLASS = "truncate t-body-sm text-ink-3";

export const WORKSPACE_SWITCHER_HEADER_MARK_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted t-label font-medium text-ink-2";

export const WORKSPACE_SWITCHER_MARK_CLASS =
  "flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted t-label font-medium text-ink-2";

export const WORKSPACE_SWITCHER_SETTINGS_CLASS =
  "flex w-full items-center px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm font-normal text-ink hover:bg-surface-muted";

export const WORKSPACE_SWITCHER_RULE_CLASS = "border-t border-hairline";

// Trailing Sporty Blue check. Labels stay flush-left on one shared
// pad after the leading mark gutter. The check is a reserved right
// slot — not a left gutter, not in the label column. Same rows on
// mobile and desktop. Keep #320.
export const WORKSPACE_SWITCHER_OPTION_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm font-normal text-ink";

export const WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS = "bg-surface-muted";

export const WORKSPACE_SWITCHER_OPTION_LABEL_CLASS = "min-w-0 flex-1 text-left";

export const WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS = "size-4 shrink-0";

export const WORKSPACE_SWITCHER_OPTION_CHECK_CLASS = "text-accent";

export const APP_HEADER_TRAILING_CLUSTER_CLASS =
  "flex shrink-0 items-center gap-[var(--space-3)]";

export function workspaceSwitcherMarkLetter(mode: WorkspaceMode): string {
  return WORKSPACE_SWITCHER_MARK[mode];
}

export function workspaceSwitcherRole(mode: WorkspaceMode): string {
  return WORKSPACE_SWITCHER_ROLE[mode];
}

export function workspaceSwitcherShowsSettings(): boolean {
  return WORKSPACE_SWITCHER.settings === USER_MENU.settings && USER_MENU.settingsHref === "/settings";
}

export function workspaceSwitcherSettingsHref(
  pathname: string | null | undefined,
): string {
  return settingsLandHref(pathname);
}

export function workspaceSwitcherChevronClass(open: boolean): string {
  return open
    ? `${WORKSPACE_SWITCHER_CHEVRON_CLASS} ${WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS}`
    : WORKSPACE_SWITCHER_CHEVRON_CLASS;
}

export function workspaceSwitcherOptionClass(selected: boolean): string {
  return selected
    ? `${WORKSPACE_SWITCHER_OPTION_CLASS} ${WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS}`
    : WORKSPACE_SWITCHER_OPTION_CLASS;
}

export function workspaceSwitcherOptions(
  options: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): readonly WorkspaceMenuOption[] {
  return options;
}

export function workspaceSwitcherShowsChevron(
  options: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): boolean {
  return workspaceSwitcherOptions(options).length > 1;
}
