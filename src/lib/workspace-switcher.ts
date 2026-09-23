// Mercury workspace switcher. Lives in lib/, not JSX.
// IA A (Adam): phone header shows the current workspace word +
// chevron only — no letter mark / circular emblem in the pill
// (2026-09-20 glance). Tap opens a calm house sheet — Home ·
// Aggregation · Social · Education. One tap open, one tap switch.
// Dock dests stay in-workspace only. Avatar stays Settings /
// account. Desktop md+ keeps the sliding-pill cluster. Do not
// redesign desktop in this slice.
// Leading air (settings back ↔ emblem) is --space-3 (12). Not
// --space-1. Do not put overflow-hidden on the leading row (#412).
// Phone trailing: [search if needed] [24Frame AI] [bell]
// [avatar]. No header sun/moon. --chrome-gutter so the avatar is not flush.
// Cluster gap is --space-2 on every breakpoint; phone
// AI/bell/search hug the 16px glyph so that gap is optical,
// not 16-in-32 vs a 32 disk. Do not cancel that hug with -mx.
// #452 stacked AI on the bell. Theme is the avatar drill to
// /settings/preferences/theme. No header glyph writes gc-theme.
// Ask 24Frame AI sits immediately left of the
// bell and opens the Mercury overlay. Ask AI is header + Home
// module only (#465). Do not reintroduce a dest hamburger.
// Desktop md+ replaces the single-name+chevron trigger with a
// sliding-pill cluster of available workspace names (Adam lock
// 2026-09-17 “Try it”). Same house grammar as Top Performing:
// active ink fill, idle muted grey. Desktop trailing: pills, then
// Ask, then bell, then avatar. Social uses the same
// split. Phone uses word+chevron + sheet. Do not force three
// labels.
// No rail / header-lead #321 duplicate. Rail top-left stays the
// static 24 brand. Social-only icons sit left of the Social slot
// so the avatar x does not shift. Do not invent Move / search.
// Do not return the Social Messages icon to the top bar.
//
// Phone trigger: current workspace name + quiet always-on chevron,
// inline with brand and trailing utilities. No letter avatar.
// Never truncate the word; never wrap the pill. Shorten chrome
// (drop the mark) before stacking the header. Menu: quiet
// Workspaces heading, then accessible rows with leading marks,
// flush-left names, trailing Sporty Blue check on the current
// lane (#320). No current-workspace identity header. No
// Settings section — Settings stays on the avatar menu.
//
// Member lanes are Aggregation · Social · Education. Staff is a
// fourth lane, visible only when isGcStaff — hide lanes the
// user/org lacks; no dead / grey-lie pills. Single option →
// static label. Labels stay full words at every breakpoint —
// no Agg, Edu, or ellipsis-as-design. Tight width flexes the
// trailing cluster (search yields); pills stay full words and
// shrink-0. No All Accounts clone. No Referrals / billing.
// Staff Manage courses lives on the Education workspace
// (/education/manage), not Settings Preferences and not this
// Staff lane. Education land is /education. Staff land is
// /staff/queue.
// Education quiet search stays Education-only: phone in a
// full-width row under HouseLeadChrome, desktop in the shared
// mid-lead slot (same Facebook-compact geometry as Social).
// Persist with workspaceSwitcherPersistLane → persistWorkspaceCookie.
// Do not invent a second cookie. Phone sheet unselected rows are
// Link + prefetch; prefetchHrefList warms the four homes on mount.
// Do not invent /education, /account/workspace, or /settings/workspace.

import {
  HOUSE_LEAD_SEARCH_DESKTOP_CLASS,
  HOUSE_LEAD_UNDER_NAV_CLASS,
} from "@/lib/house-lead-chrome";
import {
  APP_SHEET_HOST_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import {
  HOUSE_CONTROL_PILL_CLASS,
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import { USER_MENU } from "@/lib/user-menu";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
  workspaceModeLabel,
} from "@/lib/workspace-menu";
import { overviewLeadShouldNavigate, type OverviewLeadPillId } from "@/lib/overview";
import {
  persistWorkspaceCookie,
  resolveWorkspaceMode,
  workspaceHome,
  type WorkspaceMode,
} from "@/lib/workspace";

export const WORKSPACE_SWITCHER = {
  label: USER_MENU.workspace,
  heading: "Workspaces",
  close: "Close workspaces",
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
  "News",
  "Industry news",
] as const;

export const WORKSPACE_SWITCHER_SHORT_LABELS = ["Agg", "Edu"] as const;

export const WORKSPACE_SWITCHER_MARK = {
  aggregation: "A",
  social: "S",
  education: "E",
  // T — distinct from Social S. Switcher label is Staff, not Team.
  staff: "T",
} as const satisfies Record<WorkspaceMode, string>;

export type WorkspaceSwitcherTone = "plain" | "pill";

export type WorkspaceSwitcherPresentation = "menu" | "pills" | "sheet";

export const WORKSPACE_SWITCHER_TRIGGER_CLASS =
  `group flex min-w-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} px-2 py-1 t-body-sm font-medium text-ink transition-colors hover:bg-surface-muted`;

// Phone leading pill — house tokens. Hairline + muted fill. Compact pad.
// shrink-0: the word + chevron keep their natural width. Do not
// min-w-0 the trigger — that was the squeeze next to utilities.
export const WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS =
  `group flex shrink-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink`;

export const WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS = "whitespace-nowrap";

export const WORKSPACE_SWITCHER_STATIC_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] px-2 py-1 t-body-sm font-medium text-ink";

export const WORKSPACE_SWITCHER_PILL_STATIC_CLASS =
  `flex shrink-0 items-center gap-[var(--space-2)] ${HOUSE_CONTROL_PILL_CLASS} border border-hairline bg-surface-muted px-[var(--space-2)] py-[var(--space-1)] t-body-sm font-medium text-ink`;

// Desktop md+ segmented track — one continuous muted bar with a
// sliding dark thumb. Same grammar as Top Performing pills.
// Persist key keeps that thumb alive across workspace route remounts.
// Full words only — shrink-0, no truncate.
// Hide unavailable lanes in the caller options.
export const WORKSPACE_SWITCHER_SEGMENTS_CLASS = HOUSE_SEGMENTED_TRACK_CLASS;

export const WORKSPACE_SWITCHER_SEGMENTS_THUMB_CLASS = HOUSE_SEGMENTED_THUMB_CLASS;

export const WORKSPACE_SWITCHER_SEGMENT_CLASS = HOUSE_SEGMENTED_ITEM_BASE_CLASS;

export const WORKSPACE_SWITCHER_SEGMENT_LABEL_CLASS = "whitespace-nowrap";

export const WORKSPACE_SWITCHER_SEGMENT_ON_CLASS = HOUSE_SEGMENTED_ITEM_ON_CLASS;

export const WORKSPACE_SWITCHER_SEGMENT_OFF_CLASS = HOUSE_SEGMENTED_ITEM_OFF_CLASS;

// Hidden at rest on md+. Desktop hover / keyboard focus reveals it.
// Open state adds opacity-100. Phone pill chevron stays visible so
// Aggregation affordance is not hover-only.
export const WORKSPACE_SWITCHER_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 opacity-0 max-md:opacity-100 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export const WORKSPACE_SWITCHER_CHEVRON_OPEN_CLASS = "opacity-100";

export const WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS =
  "size-4 shrink-0 text-ink-3 opacity-100";

// Portaled above dest chips + Education under-nav search. Header
// backdrop-blur traps in-flow z-50 under those rows — do not keep
// the menu `absolute` inside the lead stack. Gap is --space-2.
export const WORKSPACE_SWITCHER_MENU_GAP_PX = 8;

export const WORKSPACE_SWITCHER_CHROME_CLEARANCE_SELECTOR =
  "[data-house-under-nav]";

export const WORKSPACE_SWITCHER_SHEET_HOST_CLASS = APP_SHEET_HOST_CLASS;

export const WORKSPACE_SWITCHER_SHEET_SURFACE_CLASS = APP_SHEET_SURFACE_CLASS;

export const WORKSPACE_SWITCHER_SHEET_SCRIM_CLASS = APP_SHEET_SCRIM_CLASS;

export const WORKSPACE_SWITCHER_PANEL_SURFACE_CLASS =
  "flex min-w-[16rem] flex-col overflow-hidden rounded-[12px] border border-hairline bg-surface py-[var(--space-2)] shadow-none";

export const WORKSPACE_SWITCHER_PANEL_CLASS =
  `fixed z-50 ${WORKSPACE_SWITCHER_PANEL_SURFACE_CLASS}`;

export const WORKSPACE_SWITCHER_PILL_PANEL_CLASS = WORKSPACE_SWITCHER_PANEL_CLASS;

export function workspaceSwitcherMenuTopPx(
  triggerBottom: number,
  chromeBottoms: readonly number[] = [],
  gapPx: number = WORKSPACE_SWITCHER_MENU_GAP_PX,
): number {
  return Math.max(triggerBottom, ...chromeBottoms, 0) + gapPx;
}

export function workspaceSwitcherMenuStyle({
  tone,
  trigger,
  chromeBottoms = [],
  viewportWidth,
}: {
  tone: WorkspaceSwitcherTone;
  trigger: { bottom: number; left: number; right: number };
  chromeBottoms?: readonly number[];
  viewportWidth: number;
}): { top: number; left?: number; right?: number } {
  const top = workspaceSwitcherMenuTopPx(trigger.bottom, chromeBottoms);
  if (tone === "pill") return { top, left: trigger.left };
  return { top, right: Math.max(0, viewportWidth - trigger.right) };
}

export function workspaceSwitcherChromeClearanceBottoms(
  root: ParentNode | null | undefined = typeof document === "undefined" ? null : document,
): number[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll(WORKSPACE_SWITCHER_CHROME_CLEARANCE_SELECTOR)).map(
    (node) => node.getBoundingClientRect().bottom,
  );
}

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

// Adam 2026-09-19 phone glance: space-2 still optically tight AI↔bell;
// phone space-3 / desktop space-2. Still no negative margins; still no
// glyph resize.
export const APP_HEADER_TRAILING_CLUSTER_CLASS =
  "flex min-w-0 items-center gap-[var(--space-3)] md:gap-[var(--space-2)] max-md:shrink-0";

export const APP_HEADER_EDUCATION_SEARCH_PHONE_CLASS = HOUSE_LEAD_UNDER_NAV_CLASS;

export const APP_HEADER_EDUCATION_SEARCH_DESKTOP_CLASS = HOUSE_LEAD_SEARCH_DESKTOP_CLASS;

export const APP_HEADER_LEADING_CLASS =
  "mr-auto flex min-w-0 flex-1 items-center gap-[var(--space-3)] md:gap-[var(--space-2)] overflow-visible";

// Phone pill sits inline with the 24 emblem and trailing utilities.
// shrink-0 keeps the word; do not w-full / wrap the name. overflow-
// visible: the open sheet must not live under a clip.
export const APP_HEADER_WORKSPACE_PILL_HOST_CLASS =
  "shrink-0 overflow-visible md:hidden";

export const WORKSPACE_SWITCHER_HOST_CLASS = "relative min-w-0 overflow-visible";

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

export type PhoneWorkspaceSwitcherId = "home" | WorkspaceMode;

export type PhoneWorkspaceSwitcherPill = {
  id: PhoneWorkspaceSwitcherId;
  label: string;
  href: string;
};

export function phoneWorkspaceSwitcherPills(
  options: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): PhoneWorkspaceSwitcherPill[] {
  return [
    { id: "home", label: "Home", href: "/home" },
    ...options.map((option) => ({
      id: option.mode,
      label: option.label,
      href: option.href,
    })),
  ];
}

export function workspaceSwitcherTriggerMarkId(
  pathname: string,
  current: WorkspaceMode,
): PhoneWorkspaceSwitcherId {
  if (pathname === "/home" || pathname.startsWith("/home/")) return "home";
  return current;
}

export function workspaceSwitcherLeadMarkLetter(id: PhoneWorkspaceSwitcherId): string {
  if (id === "home") return "H";
  return WORKSPACE_SWITCHER_MARK[id];
}

/**
 * Dest for a workspace-pill click, or null when the shell is already there.
 * Pending chrome is not arrival — a dropped push must stay clickable.
 * `workspace` is the cookie/clamped lane, not the optimistic active path.
 */
export function workspacePillClickDest(input: {
  shellPath: string;
  workspace: WorkspaceMode;
  pill: { id: OverviewLeadPillId; href: string };
  options: readonly { mode: WorkspaceMode }[];
}): string | null {
  const mode = resolveWorkspaceMode(input.shellPath, input.workspace);
  if (!overviewLeadShouldNavigate(input.shellPath, mode, input.pill)) return null;
  if (input.pill.id === "home" || input.pill.id === "co-productions") return input.pill.href;
  const option = input.options.find((row) => row.mode === input.pill.id);
  if (!option) return null;
  return workspaceHome(option.mode);
}

/** Persist the workspace cookie for a lane hop. Home and Co-Productions do not write.
 *  Phone sheet Links call this on tap; desktop pills keep selectLeadPill. */
export function workspaceSwitcherPersistLane(
  id: OverviewLeadPillId | PhoneWorkspaceSwitcherId,
  isGcStaff?: boolean,
): void {
  if (id === "home" || id === "co-productions") return;
  persistWorkspaceCookie(id, isGcStaff);
}

export function phoneWorkspaceSwitcherPrefetchHrefs(
  options: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): string[] {
  return phoneWorkspaceSwitcherPills(options).map((pill) => pill.href);
}
