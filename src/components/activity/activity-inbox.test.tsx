import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityInbox } from "./activity-inbox";
import { ACTIVITY_PAGE } from "@/lib/activity";
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
  it("renders Open | Done content pills and Reports period chips", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [OPEN],
        status: "open",
        period: parseReportsPeriod("all", NOW),
        now: NOW,
      }),
    );
    expect(html).toContain("data-activity-inbox");
    expect(html).toContain('data-activity-status-chip="open"');
    expect(html).toContain('data-activity-status-chip="done"');
    expect(html).toContain(ACTIVITY_PAGE.open);
    expect(html).toContain(ACTIVITY_PAGE.done);
    expect(html).toContain('data-activity-period-chip="all"');
    expect(html).toContain('data-activity-period-chip="ytd"');
    expect(html).toContain('data-activity-period-chip="year"');
    expect(html).toContain('data-activity-period-chip="quarter"');
    expect(html).toContain('data-activity-period-chip="month"');
    expect(html).toContain("North Wind was returned");
    expect(html).toContain("data-activity-done");
    expect(html).not.toContain("Messages");
    expect(html).not.toContain("Ask 24Frame AI");
  });

  it("uses the Done empty line when the history lens is empty", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityInbox, {
        items: [],
        status: "done",
        period: parseReportsPeriod("all", NOW),
        now: NOW,
      }),
    );
    expect(html).toContain(ACTIVITY_PAGE.emptyDone);
    expect(html).not.toContain(ACTIVITY_PAGE.emptyOpen);
  });
});
