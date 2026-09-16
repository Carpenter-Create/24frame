// Header workspace control. Lives in lib/, not JSX.
// Left of the avatar. Shows the current workspace word.
// Popover lists only accessible lanes. Two clicks to switch.
// No chevron when only one lane is reachable. Not a page.
// Education land stays Route A /social/courses.
// Persist with persistWorkspaceCookie — do not invent a
// second cookie. Do not invent /education, /account/workspace,
// or /settings/workspace.

import { USER_MENU } from "@/lib/user-menu";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
} from "@/lib/workspace-menu";

export const WORKSPACE_SWITCHER = {
  label: USER_MENU.workspace,
} as const;

export const WORKSPACE_SWITCHER_TRIGGER_CLASS =
  "flex items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] px-2 py-1 t-body-sm font-medium text-ink transition-colors hover:bg-surface-muted";

export const WORKSPACE_SWITCHER_STATIC_CLASS =
  "px-2 py-1 t-body-sm font-medium text-ink";

export const WORKSPACE_SWITCHER_CHEVRON_CLASS = "size-4 shrink-0 text-ink-3";

export const WORKSPACE_SWITCHER_PANEL_CLASS =
  "absolute right-0 top-full z-50 mt-[var(--space-2)] flex min-w-[10rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

// Trailing Sporty Blue check. Labels stay flush-left on one shared
// pad. The mark is a reserved right slot — not a left gutter, not in
// the label column. Same rows on mobile and desktop.
export const WORKSPACE_SWITCHER_OPTION_CLASS =
  "flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm font-normal text-ink";

export const WORKSPACE_SWITCHER_OPTION_SELECTED_CLASS = "bg-surface-muted";

export const WORKSPACE_SWITCHER_OPTION_LABEL_CLASS = "min-w-0 flex-1 text-left";

export const WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS = "size-4 shrink-0";

export const WORKSPACE_SWITCHER_OPTION_CHECK_CLASS = "text-accent";

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
