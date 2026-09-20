import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityInbox } from "./activity-inbox";
import {
  ACTIVITY_FAMILIES,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
  ACTIVITY_PREFS_HREF,
} from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { NOTIFICATION_PREFS } from "@/lib/notification-prefs";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { parseReportsPeriod } from "@/lib/reports";

const NOW = new Date("2026-09-18T12:00:00.000Z");
const OPEN = {
  id: "1",
  title: "North Wind was returned",
  body: "Chain of title is missing.",
  kind: "title_rejected" as const,
  created_at: "2026-09-12T12:00:00.000Z",
  unread: true,
};

describe("ActivityInbox", () => {
  it("renders Open | Done content pills, prefs family chips, and Reports period chips", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [OPEN],
        status: "open",
        period: parseReportsPeriod("all", NOW),
        family: "all",
        now: NOW,
      }),
    );
    expect(html).toContain("data-activity-inbox");
    expect(html).toContain('data-activity-status-chip="open"');
    expect(html).toContain('data-activity-status-chip="done"');
    expect(html).toContain(ACTIVITY_PAGE.open);
    expect(html).toContain(ACTIVITY_PAGE.done);
    expect(html).toContain('data-activity-family-chip="all"');
    expect(html).toContain('data-activity-family-chip="aggregation"');
    expect(html).toContain('data-activity-family-chip="reporting"');
    expect(html).toContain('data-activity-family-chip="social"');
    expect(html).toContain('data-activity-family-chip="education"');
    expect(html).toContain('data-activity-family-chip="account"');
    expect(html).toContain(ACTIVITY_PAGE.all);
    expect(html).toContain(NOTIFICATION_PREFS.groups.aggregation);
    expect(html).toContain(NOTIFICATION_PREFS.groups.reporting);
    expect(html).toContain(NOTIFICATION_PREFS.groups.social);
    expect(html).toContain(NOTIFICATION_PREFS.groups.education);
    expect(html).toContain(NOTIFICATION_PREFS.groups.account);
    expect(ACTIVITY_FAMILIES).toEqual([
      "all",
      "aggregation",
      "reporting",
      "social",
      "education",
      "account",
    ]);
    expect(html).toContain('data-activity-period-chip="all"');
    expect(html).toContain('data-activity-period-chip="ytd"');
    expect(html).toContain('data-activity-period-chip="year"');
    expect(html).toContain('data-activity-period-chip="quarter"');
    expect(html).toContain('data-activity-period-chip="month"');
    expect(html).toContain("North Wind was returned");
    expect(html).toContain("data-activity-done");
    expect(html).not.toContain("Messages");
    expect(html).not.toContain("Ask 24Frame AI");
    expect(html).not.toContain(">View<");
    expect(html).not.toContain("Mark all done");
  });

  it("puts a house gear on the header that opens Preferences Notifications", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [OPEN],
        status: "open",
        period: parseReportsPeriod("all", NOW),
        family: "social",
        now: NOW,
      }),
    );
    expect(html).toContain("data-activity-prefs");
    expect(html).toContain(`href="${ACTIVITY_PREFS_HREF}"`);
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.prefs}"`);
    expect(html).toContain(HOUSE_THEME_TOGGLE_CLASS);
    expect(html).toContain(`href="${ACTIVITY_HREF}?family=social"`);
    expect(html).toContain(`href="${ACTIVITY_HREF}?status=done&family=social"`);
    expect(ACTIVITY_PREFS_HREF).toBe("/settings/preferences/notifications");
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
  });

  it("uses the Done empty line when the history lens is empty", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [],
        status: "done",
        period: parseReportsPeriod("all", NOW),
        family: "all",
        now: NOW,
      }),
    );
    expect(html).toContain(ACTIVITY_PAGE.emptyDone);
    expect(html).not.toContain(ACTIVITY_PAGE.emptyOpen);
  });
});
