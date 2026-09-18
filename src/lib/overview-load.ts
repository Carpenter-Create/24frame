import { clientHomeSnapshot, topTitleActivity } from "@/lib/dashboard-home";
import {
  buildDashboardRevenueHero,
  parseDashboardPeriod,
  revenuePointsFromLabels,
} from "@/lib/dashboard-admin";
import { loadDiscoverableCourses } from "@/lib/courses";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import {
  OVERVIEW_EDUCATION_LIMIT,
  OVERVIEW_SOCIAL_AVATAR_LIMIT,
  isoInPastDays,
  overviewEducationItems,
  overviewNeedRowsFromDoNext,
  overviewSocialAvatars,
  overviewThisWeekLine,
  overviewTopTitleNames,
  type OverviewCourse,
  type OverviewPulseModel,
} from "@/lib/overview";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { inboxPeerIds, socialCourseHref } from "@/lib/social";
import { loadDmInbox } from "@/lib/social-dms";
import { loadProfilesByIds } from "@/lib/social-feed";
import type { createClient } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/supabase/context";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const EMPTY_PULSE: OverviewPulseModel = {
  revenueCents: null,
  topTitleNames: [],
  socialUnread: 0,
  socialEntered: false,
  socialAvatars: [],
  courses: [],
  needsYou: [],
  thisWeek: null,
};

export async function loadOverviewPulse(
  ctx: OrgContext,
  supabase: ServerClient,
  now = new Date(),
): Promise<OverviewPulseModel> {
  const org = ctx.activeOrg;
  if (!org) return EMPTY_PULSE;

  const [{ data: titleRows }, findings, deliveries, coursesLoaded, inbox] = await Promise.all([
    supabase
      .from("titles")
      .select("id, title, status, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .range(...rangeFor(UNPAGINATED_MAX)),
    loadMyFindings(supabase, { orgId: org.id }),
    loadMyDeliveries(supabase),
    loadDiscoverableCourses(supabase),
    loadDmInbox(supabase, { limit: OVERVIEW_SOCIAL_AVATAR_LIMIT }),
  ]);

  const titles = (titleRows ?? []) as {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
  const snapshot = clientHomeSnapshot({
    titles,
    findings: findings.rows,
    orgId: org.id,
    now,
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const topTitles = topTitleActivity(titles, deliveries.rows, now);
  const socialUnread = inbox.rows.reduce((sum, row) => sum + (row.unread_count ?? 0), 0);
  const peerIds = [...new Set(inbox.rows.flatMap((row) => inboxPeerIds(row)))];
  const profiles = await loadProfilesByIds(supabase, peerIds);
  const courses = overviewEducationItems(coursesLoaded.courses, OVERVIEW_EDUCATION_LIMIT);
  const covers = await signedEducationCoverUrls(courses);
  const courseItems: OverviewCourse[] = courses.map((course) => ({
    id: course.id,
    title: course.title,
    href: socialCourseHref(course.slug),
    coverUrl: covers.get(course.id) ?? null,
    percent: null,
  }));

  let revenueCents: number | null = null;
  if (canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole })) {
    const moneyLoaded = await loadRecipientDashboard(org.id);
    const money = buildClientFinanceDashboard({
      orgId: org.id,
      clientRateBp: moneyLoaded.clientRateBp,
      periods: moneyLoaded.periods,
      ledger: moneyLoaded.ledger,
      latestStatement: moneyLoaded.latestStatement,
    });
    const ytd = parseDashboardPeriod("ytd", now);
    const hero = buildDashboardRevenueHero({
      period: ytd,
      points: revenuePointsFromLabels(money.chart),
      userId: null,
    });
    revenueCents = hero.totalCents;
  }

  const deliveriesUpdated = deliveries.rows.filter((row) =>
    isoInPastDays(row.updated_at, 7, now),
  ).length;
  const attentionOpen = snapshot.needsAttention;

  return {
    revenueCents,
    topTitleNames: overviewTopTitleNames(topTitles),
    socialUnread,
    socialEntered: inbox.rows.length > 0,
    socialAvatars: overviewSocialAvatars(
      peerIds.map((id) => ({
        id,
        name: profiles.get(id)?.display_name ?? "",
      })),
    ),
    courses: courseItems,
    needsYou: overviewNeedRowsFromDoNext(snapshot.doNext, ctx.isGcStaff),
    thisWeek: overviewThisWeekLine({
      deliveriesUpdated,
      attentionOpen,
      socialUnread,
    }),
  };
}
