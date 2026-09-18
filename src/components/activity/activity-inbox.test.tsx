import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ACTIVITY,
  activityHref,
  type ActivityItem,
} from "@/lib/activity";
import { parseReportsPeriod } from "@/lib/reports";
import { REPORTS_PERIOD_CLUSTER_CLASS } from "@/lib/reports-craft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/(app)/activity/actions", () => ({ markActivityDone: vi.fn() }));

import { ActivityInbox } from "./activity-inbox";

const src = readFileSync(new URL("./activity-inbox.tsx", import.meta.url), "utf8");
const periodSrc = readFileSync(new URL("./activity-period-select.tsx", import.meta.url), "utf8");

const NOW = new Date("2026-09-18T12:00:00.000Z");

const OPEN_ITEM: ActivityItem = {
  id: "n1",
  title: "North Wind is live",
  body: "Delivery advanced.",
  href: "/titles/aaaaaaaa-1111-4111-8111-111111111111",
  at: "2026-09-18T12:00:00.000Z",
  kind: "delivery_update",
  kindLabel: "Delivery update",
  open: true,
};

describe("ActivityInbox", () => {
  it("uses Open / Done / All chips and Reports period pills on History", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [OPEN_ITEM],
        state: "all",
        period: parseReportsPeriod("ytd", NOW),
        now: NOW,
      }),
    );
    expect(html).toContain('data-activity-state-chip="open"');
    expect(html).toContain('data-activity-state-chip="done"');
    expect(html).toContain('data-activity-state-chip="all"');
    expect(html).toContain(`href="${activityHref()}"`);
    expect(html).toContain('data-activity-period-chip="all"');
    expect(html).toContain('data-activity-period-chip="ytd"');
    expect(html).toContain('data-activity-period-select=""');
    expect(html).toContain('data-activity-period-trigger=""');
    expect(html).toContain(ACTIVITY.open);
    expect(html).toContain(ACTIVITY.done);
    expect(html).toContain(ACTIVITY.all);
    expect(html).not.toContain("Messages");
    expect(src).toContain("REPORTS_PERIOD_CLUSTER_CLASS");
    expect(src).toContain("ActivityPeriodSelect");
    expect(periodSrc).toContain("HousePageSelect");
    expect(periodSrc).toContain("md:hidden");
    expect(REPORTS_PERIOD_CLUSTER_CLASS).toContain("hidden");
    expect(REPORTS_PERIOD_CLUSTER_CLASS).toContain("md:flex");
  });

  it("keeps period pills off the Open inbox", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [],
        state: "open",
        period: parseReportsPeriod("all", NOW),
        now: NOW,
      }),
    );
    expect(html).toContain(ACTIVITY.emptyOpen);
    expect(html).not.toContain('data-activity-period=""');
    expect(html).not.toContain("data-activity-period-select");
    expect(html).not.toContain("Mark as read");
  });
});
