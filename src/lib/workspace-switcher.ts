// Mercury workspace switcher. Lives in lib/, not JSX.
// Phone Access / Aggregation: compact leading pill after the
// hamburger (gap 8). Trailing avatar alone — do not cluster the
// pill with the avatar, do not center it. Desktop Access keeps
// the header-right cluster, left of the avatar (#322 / #335
// desktop keep). Social still uses that trailing cluster.
// No rail / header-lead #321 duplicate. Rail top-left stays the
// static 24 brand. Social-only icons sit left of the Social slot
// so the avatar x does not shift. Do not invent Move / search.
//
// Trigger: truncated current workspace name only. No leading mark
// or circle. Desktop chevron is hidden at rest; it appears on
// hover / focus and while the menu is open. Phone pill keeps a
// quiet always-on chevron. Menu: quiet Workspaces heading, then
// three rows with leading marks, flush-left names, trailing
// Sporty Blue check on the current lane (#320). No current-
// workspace identity header. No Settings section — Settings
// stays on the avatar menu.
//
// Three workspaces only. No All Accounts clone. No Referrals /
// billing. Staff Manage courses stays a Settings door — not a fourth
// lane. Education land stays Route A /social/courses.
// Persist with persistWorkspaceCookie — do not invent a second
// cookie. Do not invent /education, /account/workspace, or
// /settings/workspace.

import { USER_MENU } from "@/lib/user-menu";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
} from "@/lib/workspace-menu";
import type { WorkspaceMode } from "@/lib/workspace";

export const WORKSPACE_SWITCHER = {
  label: USER_MENU.workspace,
  heading: "Workspaces",
} as const;

export const WORKSPACE_SWITCHER_ABSENT = [
  "All Accounts",
  "Referrals",
  "Refer a friend",
  "billing",
  "Manage courses",
  "Settings",
  "Catalog",
  "Courses",
  "Social workspace",
] as const;

export const WORKSPACE_SWITCHER_MARK = {
  aggregation: "A",
  social: "S",
  education: "E",
} as const satisfies Record<WorkspaceMode, string>;

export type WorkspaceSwitcherTone = "plain" | "pill";

export const WORKSPACE_SWITCHER_TRIGGER_CLASS =
  "group flex min-w-0 items-center gap-[var(--space-2)] rounded-full px-2 py-1 t-body-sm font-medium text-ink transition-colors hover:bg-surface-muted";

// Phone leading pill — house tokens. Hairline + muted fill. Compact pad.
export const WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS =
  "group flex min-w-0 items-center gap-[var(--space-2)] rounded-full border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink";

export const WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS = "min-w-0 truncate";

export const WORKSPACE_SWITCHER_STATIC_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] px-2 py-1 t-body-sm font-medium text-ink";

export const WORKSPACE_SWITCHER_PILL_STATIC_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] rounded-full border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink";

// Hidden at rest on md+. Desktop hover / keyboard focus reveals it.
// Open state adds opacity-100. Phone pill chevron stays visible so
// Aggregation affordance is not hover-only.
export const WORKSPACE_SWITCHER_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 opacity-0 max-md:opacity-100 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export const WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS = "opacity-100";

export const WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 opacity-100";

export const WORKSPACE_SWITCHER_PANEL_CLASS =
  "absolute right-0 top-full z-50 mt-[var(--space-2)] flex min-w-[16rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

// Leading pill opens down-and-right so the menu does not clip the
// left edge. Desktop trailing panel stays right-0.
export const WORKSPACE_SWITCHER_PILL_PANEL_CLASS =
  "absolute left-0 top-full z-50 mt-[var(--space-2)] flex min-w-[16rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

export const WORKSPACE_SWITCHER_HEADER_CLASS =
  "px-[var(--space-4)] pb-[var(--space-1)] pt-[var(--space-2)] t-label text-ink-3";

export const WORKSPACE_SWITCHER_MARK_CLASS =
  "flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted t-label font-medium text-ink-2";

// Trailing Sporty Blue check. Labels stay flush-left on one shared
// pad after the leading mark gutter. The check is a reserved right
// slot — not a left gutter, not in the label column. Same rows on
// mobile and desktop. Keep #320.
export const WORKSPACE_SWITCHER_OPTION_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink";

export const WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS = "bg-surface-muted";

export const WORKSPACE_SWITCHER_OPTION_LABEL_CLASS = "min-w-0 flex-1 text-left";

export const WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS = "size-4 shrink-0";

export const WORKSPACE_SWITCHER_OPTION_CHECK_CLASS = "text-accent";

export const APP_HEADER_TRAILING_CLUSTER_CLASS =
  "flex shrink-0 items-center gap-[var(--space-2)]";

export const APP_HEADER_LEADING_CLASS =
  "mr-auto flex min-w-0 flex-1 items-center gap-[var(--space-2)]";

export const APP_HEADER_WORKSPACE_PILL_HOST_CLASS = "shrink-0 md:hidden";

export const APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS = "hidden md:contents";

export function workspaceSwitcherMarkLetter(mode: WorkspaceMode): string {
  return WORKSPACE_SWITCHER_MARK[mode];
}

export function workspaceSwitcherTriggerClass(
  tone: WorkspaceSwitcherTone = "plain",
): string {
  return tone === "pill"
    ? WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS
    : WORKSPACE_SWITCHER_TRIGGER_CLASS;
}

export function workspaceSwitcherStaticClass(
  tone: WorkspaceSwitcherTone = "plain",
): string {
  return tone === "pill"
    ? WORKSPACE_SWITCHER_PILL_STATIC_CLASS
    : WORKSPACE_SWITCHER_STATIC_CLASS;
}

export function workspaceSwitcherPanelClass(
  tone: WorkspaceSwitcherTone = "plain",
): string {
  return tone === "pill"
    ? WORKSPACE_SWITCHER_PILL_PANEL_CLASS
    : WORKSPACE_SWITCHER_PANEL_CLASS;
}

export function workspaceSwitcherChevronClass(
  open: boolean,
  tone: WorkspaceSwitcherTone = "plain",
): string {
  if (tone === "pill") return WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS;
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
