import { describe, expect, it } from "vitest";

import { formatUsdCents } from "./finance";
import { TITLE_STATUS_LABELS } from "./titles";
import {
  DASHBOARD_ADMIN,
  DASHBOARD_HREF,
  buildDashboardRevenueHero,
  closedRevenuePoints,
  activityDeliveryId,
  applyActivityAudit,
  dashboardActivityInitial,
  dashboardAsOfLine,
  dashboardChartGeometry,
  dashboardHref,
  dashboardPeriodOptions,
  dashboardPeriodOptionsFor,
  dashboardUserTitleIds,
  filterDashboardDeliveries,
  filterDashboardTitles,
  filterDashboardUsers,
  formatUsdCompact,
  isoInDashboardPeriod,
  isCompanyAdminRole,
  nearestChartPoint,
  parseDashboardPeriod,
  parseDashboardUserId,
  pointDelta,
  recentAccountActivity,
  dashboardTitleStatusUpdatedDetail,
  revenueCompare,
  revenuePlayheadKey,
  dashboardDeltaLine,
  dashboardPeriodMenuGroups,
  dashboardPeriodOption,
  dashboardHeroMoney,
  DASHBOARD_PERIOD_MENU_GROUPS,
  revenuePointsFromLabels,
} from "./dashboard-admin";
import { dashboardJustInTime } from "./dashboard-home";

const now = new Date("2026-09-16T12:00:00.000Z");

describe("company admin period and scope", () => {
  it("defaults to All time and parses Year / Quarter / Month / YTD like RL ?period=", () => {
    expect(parseDashboardPeriod(undefined, now)).toEqual({
      kind: "all",
      key: "all",
      label: DASHBOARD_ADMIN.allTime,
    });
    expect(parseDashboardPeriod("all", now).key).toBe("all");
    expect(parseDashboardPeriod("ytd", now)).toMatchObject({
      kind: "ytd",
      key: "ytd",
      year: 2026,
      label: "YTD 2026",
    });
    expect(parseDashboardPeriod("year", now)).toMatchObject({ kind: "year", key: "2026", year: 2026 });
    expect(parseDashboardPeriod("2025", now)).toMatchObject({ kind: "year", key: "2025", year: 2025 });
    expect(parseDashboardPeriod("quarter", now)).toMatchObject({
      kind: "quarter",
      key: "Q32026",
      year: 2026,
      quarter: 3,
      label: "Q3 2026",
    });
    expect(parseDashboardPeriod("Q42025", now)).toMatchObject({
      kind: "quarter",
      key: "Q42025",
      quarter: 4,
      year: 2025,
      label: "Q4 2025",
    });
    expect(parseDashboardPeriod("month", now)).toMatchObject({
      kind: "month",
      key: "2026-09",
      year: 2026,
      month: 9,
    });
    expect(parseDashboardPeriod("this-month", now).key).toBe("2026-09");
    expect(parseDashboardPeriod("2026-08", now).key).toBe("2026-08");
    expect(parseDashboardPeriod("nope", now).kind).toBe("all");
    expect(dashboardHref({ period: "all" })).toBe(DASHBOARD_HREF);
    expect(dashboardHref({ period: "Q42025", user: "maya" })).toBe(
      `${DASHBOARD_HREF}?period=Q42025&user=maya`,
    );
    expect(DASHBOARD_PERIOD_MENU_GROUPS.map((section) => section.group)).toEqual([
      "all",
      "ytd",
      "year",
      "quarter",
      "month",
    ]);
    const options = dashboardPeriodOptions(now, []);
    expect(dashboardPeriodOption(options, "2026")?.group).toBe("year");
    expect(dashboardPeriodOption(options, "all")?.label).toBe(DASHBOARD_ADMIN.allTime);
    const menu = dashboardPeriodMenuGroups(options);
    expect(menu.map((section) => section.group)).toEqual(["all", "ytd", "year", "quarter", "month"]);
    expect(menu[0]?.options.map((row) => row.key)).toEqual(["all"]);
    expect(menu[1]?.options.map((row) => row.key)).toEqual(["ytd"]);
  });

  it("filters ISO timestamps in UTC and lists current standards before historical pickers", () => {
    const august = parseDashboardPeriod("2026-08", now);
    expect(isoInDashboardPeriod("2026-08-02T00:00:00.000Z", august)).toBe(true);
    expect(isoInDashboardPeriod("2026-09-01T00:00:00.000Z", august)).toBe(false);
    expect(isoInDashboardPeriod("2026-08-02T00:00:00.000Z", parseDashboardPeriod("Q32026", now))).toBe(
      true,
    );
    expect(isoInDashboardPeriod("2025-12-01T00:00:00.000Z", parseDashboardPeriod("ytd", now))).toBe(
      false,
    );
    expect(isoInDashboardPeriod("2026-01-01T00:00:00.000Z", parseDashboardPeriod("ytd", now))).toBe(
      true,
    );
    const options = dashboardPeriodOptions(now, [
      { year: 2025, month: 12 },
      { year: 2026, month: 8 },
    ]);
    expect(options.slice(0, 5).map((row) => row.key)).toEqual([
      "all",
      "ytd",
      "2026",
      "Q32026",
      "2026-09",
    ]);
    expect(options.some((row) => row.key === "2025")).toBe(true);
    expect(options.some((row) => row.key === "Q42025")).toBe(true);
    expect(options.some((row) => row.key === "2025-12")).toBe(true);
    const menu = dashboardPeriodMenuGroups(options);
    expect(menu.map((section) => section.group)).toEqual(["all", "ytd", "year", "quarter", "month"]);
    expect(menu.find((section) => section.group === "year")?.options.map((row) => row.key)).toEqual([
      "2026",
      "2025",
    ]);
    expect(menu.find((section) => section.group === "quarter")?.options[0]?.key).toBe("Q32026");
    expect(menu.find((section) => section.group === "month")?.options[0]?.key).toBe("2026-09");
    const selected = parseDashboardPeriod("Q12020", now);
    expect(dashboardPeriodOptionsFor(selected, now, []).some((row) => row.key === "Q12020")).toBe(
      true,
    );
  });

  it("scopes titles and deliveries without inventing a roster or per-user money", () => {
    const titles = [
      { id: "a", title: "A", status: "live", created_at: "2026-08-02T00:00:00.000Z", created_by: "maya" },
      { id: "b", title: "B", status: "draft", created_at: "2026-09-02T00:00:00.000Z", created_by: "other" },
    ];
    const deliveries = [
      { delivery_id: "d1", title_id: "a", title: "A", updated_at: "2026-09-10T00:00:00.000Z" },
      { delivery_id: "d2", title_id: "b", title: "B", updated_at: "2026-09-02T00:00:00.000Z" },
    ];
    const thisMonth = parseDashboardPeriod("month", now);
    expect(filterDashboardTitles(titles, thisMonth, null).map((row) => row.id)).toEqual(["b"]);
    expect(filterDashboardTitles(titles, parseDashboardPeriod("all", now), "maya").map((row) => row.id)).toEqual([
      "a",
    ]);
    expect([...dashboardUserTitleIds(titles, "maya") ?? []]).toEqual(["a"]);
    expect(
      filterDashboardDeliveries(deliveries, thisMonth, dashboardUserTitleIds(titles, "maya")).map(
        (row) => row.delivery_id,
      ),
    ).toEqual(["d1"]);
    expect(parseDashboardUserId(undefined)).toBeNull();
    expect(parseDashboardUserId("all")).toBeNull();
    expect(filterDashboardUsers([{ id: "1", label: "Maya Chen" }], "")).toEqual([]);
    expect(filterDashboardUsers([{ id: "1", label: "Maya Chen" }, { id: "2", label: "Other" }], "may")).toEqual([
      { id: "1", label: "Maya Chen" },
    ]);
    expect(isCompanyAdminRole("account_owner")).toBe(true);
    expect(isCompanyAdminRole("viewer")).toBe(false);
    expect(isCompanyAdminRole("delivery_ops")).toBe(false);
  });
});

describe("company admin revenue series", () => {
  const points = closedRevenuePoints([
    { year: 2026, month: 7, netCents: 100_00 },
    { year: 2026, month: 8, netCents: 132_10 },
    { year: 2026, month: 9, netCents: null },
  ]);

  it("plots only closed nets and leaves user scope empty", () => {
    expect(revenuePointsFromLabels([{ label: "2026-08", netCents: 50_00 }, { label: "skip", netCents: 1 }])).toEqual([
      { key: "2026-08", label: "2026-08", year: 2026, month: 8, netCents: 50_00 },
    ]);
    expect(points.map((row) => row.key)).toEqual(["2026-07", "2026-08"]);
    const all = buildDashboardRevenueHero({
      period: parseDashboardPeriod("all", now),
      points,
      userId: null,
    });
    expect(all.totalCents).toBe(232_10);
    expect(all.updated).toBe("2026-08");
    expect(all.compare).toBeNull();
    expect(dashboardAsOfLine(all)).toBe("As of All time · Updated 2026-08");
    expect(formatUsdCents(all.totalCents ?? 0)).toBe("$232.10");
    expect(formatUsdCompact(1_414_499_00)).toBe("$1.4M");

    const month = buildDashboardRevenueHero({
      period: parseDashboardPeriod("2026-08", now),
      points,
      userId: null,
    });
    expect(month.totalCents).toBe(132_10);
    expect(month.compare).toEqual({ text: "+32.1%", priorLabel: "2026-07" });

    const empty = buildDashboardRevenueHero({
      period: parseDashboardPeriod("2025", now),
      points,
      userId: null,
    });
    expect(empty.totalCents).toBeNull();
    expect(empty.compare).toBeNull();
    expect(dashboardHeroMoney(empty.totalCents)).toBe("$0.00");
    expect(dashboardHeroMoney(null)).toBe("$0.00");
    expect(dashboardAsOfLine(empty)).toBe(`As of 2025 · ${DASHBOARD_ADMIN.updatedNone}`);

    const scoped = buildDashboardRevenueHero({
      period: parseDashboardPeriod("all", now),
      points,
      userId: "maya",
    });
    expect(scoped.points).toEqual([]);
    expect(scoped.totalCents).toBeNull();
  });

  it("scrubs to the nearest point and names the vs-prior delta", () => {
    const geom = dashboardChartGeometry(points, 400, 200, {
      top: 16,
      right: 16,
      bottom: 24,
      left: 16,
    });
    expect(geom?.xy).toHaveLength(2);
    expect(geom?.line.startsWith("M")).toBe(true);
    const hover = nearestChartPoint(geom?.xy ?? [], 20);
    expect(hover?.key).toBe("2026-07");
    expect(pointDelta(points, 1)).toEqual({ text: "+32.1%", priorLabel: "2026-07" });
    expect(dashboardDeltaLine({ text: "+32.1%", priorLabel: "2026-07" })).toBe(
      "↑ +32.1% vs 2026-07",
    );
    expect(dashboardDeltaLine({ text: "−4.0%", priorLabel: "2026-06" })).toBe("↓ −4.0% vs 2026-06");
    expect(pointDelta(points, 0)).toBeNull();
    expect(revenueCompare(100, 0, "prior")).toBeNull();
    expect(revenuePlayheadKey(parseDashboardPeriod("2026-08", now), points)).toBe("2026-08");
  });
});

describe("recent account activity", () => {
  it("locks the dashboard feed title as Recent activity", () => {
    expect(DASHBOARD_ADMIN.activity).toBe("Recent activity");
    expect(DASHBOARD_ADMIN.activity).not.toBe("Recent account activity");
    expect(DASHBOARD_ADMIN.activity).not.toBe("Attention");
    expect(DASHBOARD_ADMIN.performanceReportAvailable).toBe("New performance report available");
    expect(DASHBOARD_ADMIN.titleStatusUpdated).toBe("status updated to");
  });

  it("lists real title and delivery events newest first — never findings", () => {
    const rows = recentAccountActivity({
      titles: [
        { id: "a", title: "Winter Light", status: "live", created_at: "2026-09-02T00:00:00.000Z", created_by: "maya" },
        { id: "b", title: "Older", status: "draft", created_at: "2026-07-02T00:00:00.000Z", created_by: "other" },
      ],
      deliveries: [
        { delivery_id: "d1", title_id: "a", title: "Winter Light", updated_at: "2026-09-10T00:00:00.000Z" },
      ],
      period: parseDashboardPeriod("all", now),
      userId: null,
    });
    expect(rows.map((row) => row.detail)).toEqual([
      DASHBOARD_ADMIN.deliveryUpdated,
      DASHBOARD_ADMIN.titleAdded,
      DASHBOARD_ADMIN.titleAdded,
    ]);
    expect(rows.map((row) => row.title)).toEqual([
      "Winter Light",
      "Winter Light",
      "Older",
    ]);
    expect(rows.some((row) => row.id.startsWith("finding:"))).toBe(false);
    expect(rows.some((row) => row.detail === DASHBOARD_ADMIN.findingOpened)).toBe(false);
    expect(rows.some((row) => row.detail === "Synopsis is required.")).toBe(false);
    expect(rows[1]?.count).toBe(1);
    expect(rows.map((row) => row.actorId)).toEqual([null, null, null]);
    expect(rows.every((row) => row.actor.initial === "?")).toBe(true);
    expect(rows[1]?.href).toBe("/titles");
    expect(
      recentAccountActivity({
        titles: [
          { id: "a", title: "Winter Light", status: "live", created_at: "2026-09-02T00:00:00.000Z", created_by: "maya" },
        ],
        deliveries: [],
        period: parseDashboardPeriod("all", now),
        userId: "other",
      }),
    ).toEqual([]);
  });

  it("stamps actor + exact time from audit_log and never invents a person", () => {
    const rows = recentAccountActivity({
      titles: [
        {
          id: "a",
          title: "Winter Light",
          status: "live",
          created_at: "2026-09-02T00:00:00.000Z",
          created_by: "maya",
          catalog_id: "GC-0001234",
        },
      ],
      deliveries: [
        {
          delivery_id: "d1",
          title_id: "a",
          title: "Winter Light",
          updated_at: "2026-09-10T00:00:00.000Z",
        },
      ],
      period: parseDashboardPeriod("all", now),
      userId: null,
    });
    expect(activityDeliveryId(rows[0]?.id ?? "")).toBe("d1");
    expect(dashboardActivityInitial("Maya Chen")).toBe("M");
    expect(dashboardActivityInitial(null)).toBe("?");
    const hydrated = applyActivityAudit(rows, {
      events: [
        {
          entity: "deliveries",
          entity_id: "d1",
          action: "update",
          actor: "sam",
          at: "2026-09-10T18:22:00.000Z",
        },
        {
          entity: "titles",
          entity_id: "a",
          action: "insert",
          actor: "maya",
          at: "2026-09-02T15:04:00.000Z",
        },
      ],
      profileNames: new Map([
        ["maya", "Maya Chen"],
        ["sam", "Sam Rivera"],
      ]),
    });
    expect(hydrated.map((row) => row.actor)).toEqual([
      { id: "sam", initial: "S" },
      { id: "maya", initial: "M" },
    ]);
    expect(hydrated.map((row) => row.at)).toEqual([
      "2026-09-10T18:22:00.000Z",
      "2026-09-02T15:04:00.000Z",
    ]);
    expect(hydrated[1]?.href).toBe("/titles/24F-0001234");
    expect(applyActivityAudit(rows, { events: [] }).every((row) => row.actor.initial === "?")).toBe(
      true,
    );
    expect(
      applyActivityAudit(rows, {
        events: [
          {
            entity: "titles",
            entity_id: "a",
            action: "insert",
            actor: "unknown",
            at: "2026-09-02T15:04:00.000Z",
          },
          {
            entity: "deliveries",
            entity_id: "d1",
            action: "insert",
            actor: "sam",
            at: "2026-09-10T18:22:00.000Z",
          },
        ],
        profileNames: new Map([["sam", "Sam Rivera"]]),
      }).map((row) => row.actor),
    ).toEqual([
      { id: "sam", initial: "S" },
      { id: "unknown", initial: "?" },
    ]);
    expect(dashboardJustInTime("2026-09-02T15:04:00.000Z")).toMatch(/\d{1,2}:\d{2}/);
  });

  it("emits title status updates and performance reports from real account events", () => {
    const rows = recentAccountActivity({
      titles: [
        {
          id: "a",
          title: "Winter Light",
          status: "live",
          created_at: "2026-07-02T00:00:00.000Z",
          catalog_id: "GC-0001234",
        },
      ],
      deliveries: [],
      period: parseDashboardPeriod("all", now),
      userId: null,
      events: [
        {
          entity: "titles",
          entity_id: "a",
          action: "update",
          actor: "sam",
          at: "2026-09-08T16:00:00.000Z",
          before: { status: "in_review" },
          after: { status: "live" },
        },
        {
          entity: "titles",
          entity_id: "a",
          action: "update",
          actor: "sam",
          at: "2026-09-07T16:00:00.000Z",
          before: { status: "live" },
          after: { status: "live" },
        },
        {
          entity: "findings",
          entity_id: "f1",
          action: "insert",
          actor: "maya",
          at: "2026-09-09T16:00:00.000Z",
          after: { message: "Synopsis is required." },
        },
      ],
      report: {
        id: "period-1",
        at: "2026-09-01T12:00:00.000Z",
        href: "/reports/period-1",
      },
    });
    expect(rows.map((row) => row.kind)).toEqual([
      "title_status",
      "performance_report",
      "title_added",
    ]);
    expect(rows[0]?.title).toBe("Winter Light");
    expect(rows[0]?.detail).toBe(dashboardTitleStatusUpdatedDetail(TITLE_STATUS_LABELS.live));
    expect(rows[0]?.detail).toBe("status updated to Approved");
    expect(rows[1]?.detail).toBe(DASHBOARD_ADMIN.performanceReportAvailable);
    expect(rows[1]?.href).toBe("/reports/period-1");
    expect(rows.some((row) => row.kind === "title_status" && row.detail.includes("live"))).toBe(
      false,
    );
    expect(rows.some((row) => row.id.startsWith("finding:"))).toBe(false);
    expect(rows.some((row) => row.detail === "Synopsis is required.")).toBe(false);
    expect(
      recentAccountActivity({
        titles: [
          {
            id: "a",
            title: "Winter Light",
            status: "live",
            created_at: "2026-07-02T00:00:00.000Z",
          },
        ],
        deliveries: [],
        period: parseDashboardPeriod("all", now),
        userId: "other",
        events: [
          {
            entity: "titles",
            entity_id: "a",
            action: "update",
            actor: "sam",
            at: "2026-09-08T16:00:00.000Z",
            before: { status: "in_review" },
            after: { status: "live" },
          },
        ],
        report: {
          id: "period-1",
          at: "2026-09-01T12:00:00.000Z",
          href: "/reports/period-1",
        },
      }),
    ).toEqual([]);
  });

  it("reads title status announcements from audit after when the title is not loaded", () => {
    const rows = recentAccountActivity({
      titles: [
        {
          id: "newer",
          title: "Unused Draft",
          status: "draft",
          created_at: "2026-09-10T00:00:00.000Z",
        },
      ],
      deliveries: [],
      period: parseDashboardPeriod("all", now),
      userId: null,
      events: [
        {
          entity: "titles",
          entity_id: "old",
          action: "update",
          actor: "sam",
          at: "2026-09-08T16:00:00.000Z",
          before: { status: "in_review" },
          after: { status: "live", title: "Harbor Cut", catalog_id: "GC-0009999" },
        },
      ],
    });
    expect(rows.find((row) => row.kind === "title_status")).toMatchObject({
      title: "Harbor Cut",
      href: "/titles/24F-0009999",
      detail: "status updated to Approved",
      actorId: "sam",
    });
    expect(rows.some((row) => row.title === "Unused Draft")).toBe(true);
  });
});
