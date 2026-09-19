// Mercury workspace switcher. Lives in lib/, not JSX.
// Phone Option 2 dest-chip amend (Adam 2026-09-18): workspace
// switching lives on HousePhoneBottomNav. Phone top has no
// workspace pill. Emblem owns the left alone — no hamburger,
// leading or trailing. Destinations live on HousePhoneDestChips
// under the top. Leading air (settings back ↔ emblem) is --space-3
// (12). Not --space-1. Do not put overflow-hidden on the leading
// row (#412).
// Phone trailing: [search if needed] [24Frame AI] [bell] [avatar],
// with --chrome-gutter so the avatar is not flush. Cluster gap is
// --space-2 on every breakpoint; phone AI/bell/search hug the 16px
// glyph so that gap is optical, not 16-in-32 vs a 32 disk. Sun/moon
// stays desktop-only. Ask 24Frame AI is shared immediately left of
// the bell and opens the Mercury overlay. Avatar-sheet AI may stay
// as a secondary door. Do not reintroduce a dest hamburger.
// Desktop md+ replaces the single-name+chevron trigger with a
// sliding-pill cluster of available workspace names (Adam lock
// 2026-09-17 “Try it”). Same house grammar as Top Performing:
// active ink fill, idle muted grey. Desktop trailing: pills, then
// sun/moon, then Ask, then bell, then avatar. Social uses the same
// split. Phone keeps the compact name+menu — do not force three
// labels.
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
// Education quiet search stays Education-only: phone in a
// full-width row under HouseLeadChrome, desktop in the shared
// mid-lead slot (same Facebook-compact geometry as Social).
// Persist with
// persistWorkspaceCookie — do not invent
// a second cookie. Do not invent /education, /account/workspace,
// or /settings/workspace.

import {
  HOUSE_LEAD_SEARCH_DESKTOP_CLASS,
  HOUSE_LEAD_UNDER_NAV_CLASS,
} from "@/lib/house-lead-chrome";
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
  "News",
  "Industry news",
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

// Portaled above dest chips + Education under-nav search. Header
// backdrop-blur traps in-flow z-50 under those rows — do not keep
// the menu `absolute` inside the lead stack. Gap is --space-2.
export const WORKSPACE_SWITCHER_MENU_GAP_PX = 8;

export const WORKSPACE_SWITCHER_CHROME_CLEARANCE_SELECTOR =
  "[data-house-phone-dest-chips-host], [data-house-under-nav]";

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

// One gap token on every breakpoint. Phone optical evenness comes
// from HOUSE_HEADER_TRAILING_HIT_CLASS hugging the 16px glyphs —
// do not fork a tighter phone gap to "fix" AI↔bell. Desktop md+
// stays --space-2 as before.
export const APP_HEADER_TRAILING_CLUSTER_CLASS =
  "flex min-w-0 items-center gap-[var(--space-2)] max-md:shrink-0";

// Theme stays in the desktop trailing cluster. Phone hides this
// wrap (`hidden`) so md+ `contents` keeps theme as a flex sibling
// of Ask · bell · avatar. Ask sits outside this wrap, immediately
// left of the bell on every breakpoint.
export const APP_HEADER_DESKTOP_TRAILING_CLASS = "hidden md:contents";

export const APP_HEADER_EDUCATION_SEARCH_PHONE_CLASS = HOUSE_LEAD_UNDER_NAV_CLASS;

export const APP_HEADER_EDUCATION_SEARCH_DESKTOP_CLASS = HOUSE_LEAD_SEARCH_DESKTOP_CLASS;

export const APP_HEADER_LEADING_CLASS =
  "mr-auto flex min-w-0 flex-1 items-center gap-[var(--space-3)] md:gap-[var(--space-2)] overflow-visible";

// Phone pill yields (min-w-0 + truncate on the name) so it cannot
// overlap the brand mark. Not shrink-0 — that was the crush.
// overflow-visible: the open menu must not live under a clip.
export const APP_HEADER_WORKSPACE_PILL_HOST_CLASS = "min-w-0 overflow-visible md:hidden";

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
