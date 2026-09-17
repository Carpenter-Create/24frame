// Mercury workspace switcher. Lives in lib/, not JSX.
// Phone Access / Aggregation: compact leading name+menu after the
// hamburger (gap 8). Trailing avatar alone on phone — do not
// cluster the compact pill with the avatar, do not center it.
// Desktop md+ replaces the single-name+chevron trigger with a
// sliding-pill cluster of available workspace names (Adam lock
// 2026-09-17 “Try it”). Same house grammar as Top Performing:
// active ink fill, idle muted grey. Trailing header cluster,
// left of the avatar. Social uses the same split. Phone keeps
// the compact name+menu — do not force three labels.
// No rail / header-lead #321 duplicate. Rail top-left stays the
// static 24 brand. Social-only icons sit left of the Social slot
// so the avatar x does not shift. Do not invent Move / search.
// Do not return the Social Messages icon to the top bar.
//
// Phone trigger: truncated current workspace name only. No
// leading mark or circle. Quiet always-on chevron. Menu: quiet
// Workspaces heading, then accessible rows with leading marks,
// flush-left names, trailing Sporty Blue check on the current
// lane (#320). No current-workspace identity header. No
// Settings section — Settings stays on the avatar menu.
//
// Three workspaces only. Hide lanes the user/org lacks — no
// dead / grey-lie pills. Single option → static label. Labels
// stay Aggregation · Social · Education at every breakpoint —
// no Agg, Edu, or ellipsis-as-design. Tight width flexes the
// trailing cluster (search yields); pills stay full words and
// shrink-0. No All Accounts clone. No Referrals / billing.
// Staff Manage courses stays a Settings door — not a fourth
// lane. Education land stays Route A /social/courses.
// Education quiet top-bar search stays Education-only: phone
// in the leading cluster, desktop right of pills / left of
// avatar. Persist with persistWorkspaceCookie — do not invent
// a second cookie. Do not invent /education, /account/workspace,
// or /settings/workspace.

import {
  HOUSE_CONTROL_PILL_CLASS,
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
} from "@/lib/house-shell";
import { USER_MENU } from "@/lib/user-menu";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
  workspaceModeLabel,
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

export const WORKSPACE_SWITCHER_SHORT_LABELS = ["Agg", "Edu"] as const;

export const WORKSPACE_SWITCHER_MARK = {
  aggregation: "A",
  social: "S",
  education: "E",
} as const satisfies Record<WorkspaceMode, string>;

export type WorkspaceSwitcherTone = "plain" | "pill";

export type WorkspaceSwitcherPresentation = "menu" | "pills";

export const WORKSPACE_SWITCHER_TRIGGER_CLASS =
  `group flex min-w-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} px-2 py-1 t-body-sm font-medium text-ink transition-colors hover:bg-surface-muted`;

// Phone leading pill — house tokens. Hairline + muted fill. Compact pad.
export const WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS =
  `group flex min-w-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink`;

export const WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS = "min-w-0 truncate";

export const WORKSPACE_SWITCHER_STATIC_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] px-2 py-1 t-body-sm font-medium text-ink";

export const WORKSPACE_SWITCHER_PILL_STATIC_CLASS =
  `flex min-w-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink`;

// Desktop md+ sliding pills — Top Performing house grammar, not a
// Sporty Blue strip. Full words only — shrink-0, no truncate.
// Hide unavailable lanes in the caller options.
export const WORKSPACE_SWITCHER_SEGMENTS_CLASS =
  "flex shrink-0 items-center gap-[var(--space-2)]";

export const WORKSPACE_SWITCHER_SEGMENT_CLASS =
  "shrink-0 whitespace-nowrap rounded-full px-[var(--space-4)] py-[var(--space-2)] t-body-sm";

export const WORKSPACE_SWITCHER_SEGMENT_LABEL_CLASS = "whitespace-nowrap";

export const WORKSPACE_SWITCHER_SEGMENT_ON_CLASS = HOUSE_FILTER_ON_CLASS;

export const WORKSPACE_SWITCHER_SEGMENT_OFF_CLASS = HOUSE_FILTER_OFF_CLASS;

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
  "flex min-w-0 items-center gap-[var(--space-2)] max-md:shrink-0";

export const APP_HEADER_EDUCATION_SEARCH_PHONE_CLASS = "min-w-0 flex-1 md:hidden";

export const APP_HEADER_EDUCATION_SEARCH_DESKTOP_CLASS =
  "hidden min-w-0 flex-1 md:flex md:max-w-[420px]";

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

export function workspaceSwitcherShowsSegments(
  options: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): boolean {
  return workspaceSwitcherShowsChevron(options);
}

export function workspaceSwitcherSegmentClass(selected: boolean): string {
  return selected
    ? `${WORKSPACE_SWITCHER_SEGMENT_CLASS} ${WORKSPACE_SWITCHER_SEGMENT_ON_CLASS}`
    : `${WORKSPACE_SWITCHER_SEGMENT_CLASS} ${WORKSPACE_SWITCHER_SEGMENT_OFF_CLASS}`;
}

export function workspaceSwitcherSegmentLabel(mode: WorkspaceMode): string {
  return workspaceModeLabel(mode);
}

export function workspaceSwitcherSegmentTabIndex(selected: boolean): number {
  return selected ? 0 : -1;
}

export function workspaceSwitcherNextSegmentIndex(
  index: number,
  count: number,
  direction: 1 | -1,
): number {
  if (count <= 0) return 0;
  return (index + direction + count) % count;
}
