import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityBell } from "./activity-bell";
import {
  ACTIVITY_BELL_OPEN_CAP,
  ACTIVITY_BELL_OPEN_DOT_CLASS,
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
  activityRelativeTime,
} from "@/lib/activity";

const NOW = Date.parse("2026-09-18T12:00:00.000Z");

const OPEN_ITEMS = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  title: `Open ${i}`,
  body: "Fix this.",
  kind: (i % 2 === 0 ? "title_rejected" : "delivery_update") as
    | "title_rejected"
    | "delivery_update",
  created_at: "2026-09-18T11:00:00.000Z",
  unread: true,
}));

describe("ActivityBell", () => {
  it("shows the open count and a circular ghost wash on the trigger", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityBell, {
        unread: 3,
        items: OPEN_ITEMS.slice(0, 3),
      }),
    );
    expect(html).toContain("data-activity-bell");
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.bellLabel}"`);
    expect(html).toContain("data-activity-bell-badge");
    expect(html).toContain("3");
    expect(html).toContain(ACTIVITY_BELL_TRIGGER_CLASS);
    expect(html).not.toContain("data-activity-bell-open");
    expect(html).not.toContain("data-activity-status-chip");
    expect(html).not.toContain("Unread");
    expect(html).not.toContain("Resolved");
  });

  it("caps the popover at five open items with Activity title, type, detail, time, View, Done, and View all activity", () => {
    expect(ACTIVITY_BELL_OPEN_CAP).toBe(5);
    const html = renderToStaticMarkup(
      createElement(ActivityBell, {
        unread: 5,
        items: OPEN_ITEMS,
        defaultOpen: true,
        now: NOW,
      }),
    );
    expect(html).toContain("data-activity-bell-popover");
    expect(html).toContain("data-activity-bell-title");
    expect(html).toContain(`>${ACTIVITY_PAGE.title}<`);
    expect(html).toContain("data-activity-bell-mark-all");
    expect(html).toContain(ACTIVITY_PAGE.markAllDone);
    expect(html).toContain("data-activity-bell-open");
    expect(html).toContain(ACTIVITY_BELL_TRIGGER_OPEN_CLASS);
    expect(html).toContain(ACTIVITY_BELL_OPEN_DOT_CLASS);
    for (const item of OPEN_ITEMS) {
      expect(html).toContain(`data-activity-bell-item="${item.id}"`);
      expect(html).toContain(item.title);
    }
    expect(html).toContain('data-activity-bell-kind="film-slate"');
    expect(html).toContain('data-activity-bell-kind="paper-plane-tilt"');
    expect(html).toContain("data-activity-bell-type-icon");
    expect(html).toContain("data-activity-bell-detail");
    expect(html).toContain("Fix this.");
    expect(html).toContain("data-activity-bell-time");
    expect(html).toContain(activityRelativeTime("2026-09-18T11:00:00.000Z", NOW));
    expect(html).toContain("data-activity-bell-open-dot");
    expect(html).toContain("data-activity-bell-view");
    expect(html).toContain(ACTIVITY_PAGE.view);
    expect(html).toContain("data-activity-bell-done");
    expect(html).toContain(ACTIVITY_PAGE.done);
    expect(html).toContain(`href="${ACTIVITY_HREF}"`);
    expect(html).toContain("data-activity-bell-view-all");
    expect(html).toContain(ACTIVITY_PAGE.viewAll);
    expect(html.match(/data-activity-bell-item=/g)?.length).toBe(5);
    expect(html).not.toContain("data-activity-status-chip");
    expect(html).not.toContain("data-activity-period-chip");
    expect(html).not.toContain("Unread");
    expect(html).not.toContain("Resolved");
  });
});
