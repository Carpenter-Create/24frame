import { ASK_GLOBEE_TRY_PROMPTS, askGlobeeLandingHref } from "@/lib/ask-globee";
import { catalogHealthTitleHref } from "@/lib/findings";
import { formatUsdCents } from "@/lib/finance";
import {
  DASHBOARD_HOME,
  type ClientHomeDoNextItem,
  type DashboardRankedTitle,
} from "@/lib/dashboard-home";
import {
  WORKSPACE_AGGREGATION_LABEL,
  WORKSPACE_SOCIAL_LABEL,
} from "@/lib/product";
import { WORKSPACE_EDUCATION_LABEL } from "@/lib/workspace-menu";

// Overview workspace pulse. Deep links only — no invented money,
// unread, or course percent. Education % renders only when a real
// progress value is supplied; there is no lesson_progress SoT.
//
// Social strip is a Figma glance: identity faces + unread signal +
// one CTA into Social. Not a mini-inbox — no per-DM rows, last-message
// snippets, or thread hrefs. Names stay off unless a register-true
// mock already shows them; 1:4 / 1:120 do not. Pills stay in the
// live unify-lead trailing cluster — never a content-row fork.

export const OVERVIEW_HREF = "/overview";
export const OVERVIEW_EDUCATION_LIMIT = 5;
export const OVERVIEW_SOCIAL_AVATAR_LIMIT = 5;
export const OVERVIEW_NEED_LIMIT = 5;

export const OVERVIEW_SOCIAL_ABSENT = [
  "last message",
  "snippet",
  "preview",
  "mini-inbox",
  "Mark as read",
] as const;

export const OVERVIEW = {
  nav: "Overview",
  title: "Overview",
  subtitle: "Cross-workspace pulse · deep links only",
  aggregation: WORKSPACE_AGGREGATION_LABEL,
  social: WORKSPACE_SOCIAL_LABEL,
  education: WORKSPACE_EDUCATION_LABEL,
  needsYou: "Needs you",
  thisWeek: "This week",
  aiNext: "AI next-moves · 24Frame AI",
  revenue: "Revenue",
  topPerformers: "Top performers",
  ytdReports: "YTD · Reports",
  openDashboard: "Open Dashboard →",
  viewTitles: "View Titles →",
  openSocial: "Open Social →",
  openEducation: "Open Education →",
  unread: "Unread",
  socialEmptyTitle: "Social not entered yet",
  socialEmptyBody: "Enter Social to connect DMs and groups.",
  enterSocial: "Enter Social",
  educationEmpty: "No courses in the catalog yet.",
  educationEmptyTitle: "Education not entered yet",
  educationEmptyBody: "Enter Education to continue courses.",
  enterEducation: "Enter Education",
  needsYouEmpty: "Nothing needs you right now.",
  thisWeekEmpty: "No pulse for this week yet.",
  noOrg: "Choose an organization to read Overview.",
} as const;

export const OVERVIEW_AI_CHIPS = ASK_GLOBEE_TRY_PROMPTS.map((label) => ({
  label,
  href: askGlobeeLandingHref(),
}));

export type OverviewCourse = {
  id: string;
  title: string;
  href: string;
  coverUrl: string | null;
  percent: number | null;
};

export type OverviewNeedRow = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type OverviewSocialAvatar = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export type OverviewPulseModel = {
  revenueCents: number | null;
  topTitleNames: string[];
  socialUnread: number;
  socialEntered: boolean;
  socialAvatars: OverviewSocialAvatar[];
  courses: OverviewCourse[];
  needsYou: OverviewNeedRow[];
  thisWeek: string | null;
};

export function overviewRevenueLabel(cents: number | null): string | null {
  if (cents == null) return null;
  return formatUsdCents(cents);
}

export function overviewTopPerformersLine(names: readonly string[]): string | null {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  return clean.join(" · ");
}

export function overviewSocialUnreadLabel(count: number): string {
  return count === 1 ? "1 message" : `${count} messages`;
}

export function overviewCoursePercentLabel(percent: number | null): string | null {
  if (percent == null || !Number.isFinite(percent)) return null;
  const rounded = Math.round(percent);
  if (rounded < 0 || rounded > 100) return null;
  return `${rounded}% complete`;
}

export function overviewEducationItems<T>(
  courses: readonly T[],
  limit = OVERVIEW_EDUCATION_LIMIT,
): T[] {
  return [...courses].slice(0, limit);
}

export function overviewInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function overviewNeedRowsFromDoNext(
  items: readonly ClientHomeDoNextItem[],
  gcWide = false,
  limit = OVERVIEW_NEED_LIMIT,
): OverviewNeedRow[] {
  return items.slice(0, limit).map((item) => ({
    id: item.id,
    title: item.reason?.trim() || item.title,
    detail: `${DASHBOARD_HOME.pillTitles} · ${WORKSPACE_AGGREGATION_LABEL}`,
    href: catalogHealthTitleHref(item.id, gcWide),
  }));
}

export function overviewTopTitleNames(
  titles: readonly DashboardRankedTitle[],
  limit = 3,
): string[] {
  return titles
    .map((title) => title.title.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function isoInPastDays(
  iso: string | null | undefined,
  days: number,
  now: Date,
): boolean {
  if (!iso) return false;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return false;
  const delta = now.getTime() - then;
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
}

export function overviewThisWeekLine(input: {
  deliveriesUpdated: number;
  attentionOpen: number;
  socialUnread: number;
}): string | null {
  const parts: string[] = [];
  if (input.deliveriesUpdated > 0) {
    parts.push(
      input.deliveriesUpdated === 1
        ? "1 delivery updated"
        : `${input.deliveriesUpdated} deliveries updated`,
    );
  }
  if (input.attentionOpen > 0) {
    parts.push(
      input.attentionOpen === 1
        ? "1 attention item open"
        : `${input.attentionOpen} attention items open`,
    );
  }
  if (input.socialUnread > 0) {
    parts.push(
      input.socialUnread === 1 ? "1 Social unread" : `${input.socialUnread} Social unread`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function overviewSocialAvatars(
  faces: readonly { id: string; name: string; photoUrl?: string | null }[],
  limit = OVERVIEW_SOCIAL_AVATAR_LIMIT,
): OverviewSocialAvatar[] {
  const seen = new Set<string>();
  const avatars: OverviewSocialAvatar[] = [];
  for (const row of faces) {
    if (seen.has(row.id)) continue;
    const name = row.name.trim();
    if (!name) continue;
    seen.add(row.id);
    avatars.push({ id: row.id, name, photoUrl: row.photoUrl ?? null });
    if (avatars.length >= limit) break;
  }
  return avatars;
}
