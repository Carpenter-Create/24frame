import { ASK_ASSISTANT, ASSISTANT_NAME } from "@/lib/product";
import { DASHBOARD_ADMIN } from "@/lib/dashboard-admin";
import { DASHBOARD_ATTENTION } from "@/lib/dashboard-attention";
import {
  DASHBOARD_HOME,
  dashboardWhatChanged,
  type ClientHomeDoNextItem,
  type DashboardChangeRow,
} from "@/lib/dashboard-home";
import { REPORTS_HREF } from "@/lib/reports";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { availableWorkspaceOptions, type WorkspaceMenuOption } from "@/lib/workspace-menu";
import type { WorkspaceMode } from "@/lib/workspace";

// Account Home is the leftmost unify-lead pill. Not a fourth product.
// Not Social Home (`/social` feed). Aggregation · Social · Education
// stay the three workspace destinations. /overview redirects to /home.
// Home IA v2 (Adam 2026-09-18): no dest rail on /home — unify-lead
// chrome + five modules only. Rails return in Aggregation · Social ·
// Education. Copy lives here, not JSX.

export const OVERVIEW_HREF = "/home";
export const OVERVIEW_LEGACY_HREF = "/overview";

export const OVERVIEW_SOCIAL_DM_CAP = 5;
export const OVERVIEW_EDUCATION_CAP = 5;
export const OVERVIEW_AI_NEXT_CAP = 3;
export const OVERVIEW_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Positive-first Home modules. This-week pulse folds into Aggregation. */
export const OVERVIEW_MODULE_ORDER = [
  "social",
  "education",
  "aggregation",
  "needs-you",
  "ai-next",
] as const;

/** Phone-chrome width: dest rail is gone, header + main go full-canvas. */
export const OVERVIEW_RAIL_OFF_WIDTH = "0px";

export const OVERVIEW_PAGE = {
  title: "Home",
  needsYou: "Needs you",
  thisWeek: "This week",
  aggregation: "Aggregation",
  social: "Social",
  education: "Education",
  revenue: DASHBOARD_ADMIN.revenue,
  revenueEmpty: DASHBOARD_ADMIN.revenueEmpty,
  revenueHref: REPORTS_HREF,
  topPerforming: DASHBOARD_HOME.topPerforming,
  topPerformingEmpty: DASHBOARD_HOME.topTitlesEmpty,
  socialUnread: "Unread",
  socialEmpty: SOCIAL.home.chatsEmpty,
  socialHref: SOCIAL_ROUTES.dms,
  educationEmpty: SOCIAL.courses.empty,
  educationHref: SOCIAL_ROUTES.courses,
  needsYouEmpty: DASHBOARD_ATTENTION.empty,
  needsYouHref: DASHBOARD_ATTENTION.viewAllHref,
  weekEmpty: DASHBOARD_HOME.whatChangedEmpty,
  aiNext: ASSISTANT_NAME,
  aiNextEmpty: "Nothing is ready to submit next.",
  aiNextHref: "/messages",
  aiAsk: ASK_ASSISTANT,
} as const;

// Figma Home Education module label — 13 / ink-2, not a heading and
// not a Sporty Blue echo. Other Home modules stay section-title ink.
export const OVERVIEW_EDUCATION_LABEL_CLASS = "t-body-sm text-ink-2";

/** Header TextAction only when the label is distinct from the module title. */
export function overviewModuleHeaderAction(
  title: string,
  href?: string,
  cta?: string,
): { href: string; label: string } | null {
  if (!href) return null;
  const label = (cta ?? title).trim();
  if (label.toLowerCase() === title.trim().toLowerCase()) return null;
  return { href, label };
}

export type OverviewLeadPillId = "home" | WorkspaceMode;

export type OverviewLeadPill = {
  id: OverviewLeadPillId;
  label: string;
  href: string;
};

function isPrefixed(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isOverviewPath(pathname: string): boolean {
  return isPrefixed(pathname, OVERVIEW_HREF) || isPrefixed(pathname, OVERVIEW_LEGACY_HREF);
}

/** Dest rails stay off Home. Aggregation · Social · Education keep today's rail. */
export function overviewHidesRail(pathname: string): boolean {
  return isOverviewPath(pathname);
}

export function overviewLeadPills(
  workspaces: readonly WorkspaceMenuOption[] = availableWorkspaceOptions(),
): OverviewLeadPill[] {
  return [
    { id: "home", label: OVERVIEW_PAGE.title, href: OVERVIEW_HREF },
    ...workspaces.map((option) => ({
      id: option.mode,
      label: option.label,
      href: option.href,
    })),
  ];
}

export function overviewLeadSelected(
  pillId: OverviewLeadPillId,
  pathname: string,
  workspace: WorkspaceMode,
): boolean {
  const onHome = isOverviewPath(pathname);
  if (pillId === "home") return onHome;
  return !onHome && workspace === pillId;
}

export function overviewTriggerLabel(
  pathname: string,
  workspaceLabel: string,
): string {
  return isOverviewPath(pathname) ? OVERVIEW_PAGE.title : workspaceLabel;
}

/** Idle pills always navigate — Home is not Aggregation home. */
export function overviewLeadShouldNavigate(
  pathname: string,
  workspace: WorkspaceMode,
  pill: Pick<OverviewLeadPill, "id">,
): boolean {
  return !overviewLeadSelected(pill.id, pathname, workspace);
}

export function overviewSocialUnreadTotal(
  rows: readonly { unread_count: number }[],
): number {
  return rows.reduce((sum, row) => sum + Math.max(0, row.unread_count), 0);
}

export function overviewSocialChats<T>(
  rows: readonly T[],
  cap = OVERVIEW_SOCIAL_DM_CAP,
): T[] {
  return rows.slice(0, cap);
}

export function overviewEducationCourses<T>(
  rows: readonly T[],
  cap = OVERVIEW_EDUCATION_CAP,
): T[] {
  return rows.slice(0, cap);
}

export function overviewAiNextMoves<T extends ClientHomeDoNextItem>(
  rows: readonly T[],
  cap = OVERVIEW_AI_NEXT_CAP,
): T[] {
  return rows.slice(0, cap);
}

export function overviewWeekSince(now: number): number {
  return now - OVERVIEW_WEEK_MS;
}

export function overviewInWeek(iso: string | null | undefined, sinceMs: number): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at >= sinceMs;
}

export function overviewWeekPulse(input: {
  titlesAdded: number;
  deliveriesUpdated: number;
  findingsOpened: number;
}): DashboardChangeRow[] {
  return dashboardWhatChanged(input);
}
