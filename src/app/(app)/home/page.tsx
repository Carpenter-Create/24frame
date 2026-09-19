import { redirect } from "next/navigation";

import { OverviewHome } from "@/components/overview/overview-home";
import { loadDiscoverableCourses } from "@/lib/courses";
import {
  buildDashboardRevenueHero,
  parseDashboardPeriod,
  revenuePointsFromLabels,
} from "@/lib/dashboard-admin";
import { buildAttentionGlance } from "@/lib/dashboard-attention";
import {
  clientHomeSnapshot,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import { canViewClientEarn } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import { loadHomeNews } from "@/lib/news-load";
import {
  OVERVIEW_SOCIAL_DM_CAP,
  overviewAiNextMoves,
  overviewEducationCourses,
  overviewInWeek,
  overviewSocialChats,
  overviewSocialUnreadTotal,
  overviewWeekPulse,
  overviewWeekSince,
} from "@/lib/overview";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { loadProfilesByIds } from "@/lib/social-feed";
import { socialHomeChats } from "@/lib/social-home-chats";
import { inboxPeerIds } from "@/lib/social";
import { loadDmInbox } from "@/lib/social-dms";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

type TitleRow = ClientHomeTitle & {
  created_by?: string | null;
  catalog_id?: string | null;
};

export default async function HomePage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const org = ctx.activeOrg;
  const now = new Date();
  const since = overviewWeekSince(now.getTime());
  const sp = await searchParams;
  const period = parseDashboardPeriod(sp.period, now);

  const titlesPromise = org
    ? supabase
        .from("titles")
        .select("id, title, status, created_at, created_by, catalog_id")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .range(...rangeFor(UNPAGINATED_MAX))
    : Promise.resolve({ data: [] as TitleRow[] });

  const [titleResult, findings, deliveries, coursesLoaded, profile, news] = await Promise.all([
    titlesPromise,
    org ? loadMyFindings(supabase, { orgId: org.id }) : Promise.resolve({ rows: [], truncated: false }),
    org ? loadMyDeliveries(supabase) : Promise.resolve({ rows: [], truncated: false }),
    loadDiscoverableCourses(supabase),
    ensureOwnSocialProfile(supabase, ctx.user),
    loadHomeNews(now),
  ]);

  const titles = (titleResult.data ?? []) as TitleRow[];
  const snapshot = clientHomeSnapshot({
    titles,
    findings: findings.rows,
    orgId: org?.id ?? "",
    now,
    bound: UNPAGINATED_MAX,
    findingsIsPartial: findings.truncated,
  });
  const attention = buildAttentionGlance({ findings: findings.rows, titles });
  const weekPulse = overviewWeekPulse({
    titlesAdded: titles.filter((title) => overviewInWeek(title.created_at, since)).length,
    deliveriesUpdated: deliveries.rows.filter((row) => overviewInWeek(row.updated_at, since)).length,
    findingsOpened: findings.rows.filter((row) => overviewInWeek(row.created_at ?? null, since)).length,
  });

  let revenueCents: number | null = null;
  if (org && canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole })) {
    const moneyLoaded = await loadRecipientDashboard(org.id);
    if (moneyLoaded) {
      const money = buildClientFinanceDashboard({
        orgId: org.id,
        clientRateBp: moneyLoaded.clientRateBp,
        periods: moneyLoaded.periods,
        ledger: moneyLoaded.ledger,
        latestStatement: moneyLoaded.latestStatement,
      });
      const hero = buildDashboardRevenueHero({
        period,
        points: revenuePointsFromLabels(money.chart ?? []),
        userId: null,
      });
      revenueCents = hero.totalCents;
    }
  }

  const inbox = profile
    ? await loadDmInbox(supabase, { limit: OVERVIEW_SOCIAL_DM_CAP })
    : { rows: [], truncated: false };
  const peopleIds = [...new Set(inbox.rows.flatMap((row) => inboxPeerIds(row)))];
  const [authors, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);
  const namedChats = overviewSocialChats(
    socialHomeChats(
      inbox.rows,
      new Map([...authors.entries()].map(([id, author]) => [id, author.display_name])),
    ),
  );

  const courses = overviewEducationCourses(coursesLoaded.failed ? [] : coursesLoaded.courses);
  const courseCovers = coursesLoaded.failed
    ? new Map<string, string>()
    : await signedEducationCoverUrls(courses);

  return (
    <OverviewHome
      displayName={ctx.user.name}
      revenueCents={revenueCents}
      period={period}
      socialUnread={overviewSocialUnreadTotal(inbox.rows)}
      socialChats={namedChats}
      socialFaces={faces}
      courses={courses}
      courseCovers={courseCovers}
      needsYou={attention.rows.map((row) => ({ id: row.id, what: row.what, href: row.href }))}
      weekPulse={weekPulse}
      aiNext={overviewAiNextMoves(snapshot.doNext)}
      news={news}
      now={now}
    />
  );
}
