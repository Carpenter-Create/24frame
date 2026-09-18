import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityBell } from "./activity-bell";
import { ACTIVITY_BELL_OPEN_CAP, ACTIVITY_HREF, ACTIVITY_PAGE } from "@/lib/activity";

const OPEN_ITEMS = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  title: `Open ${i}`,
  body: "Fix this.",
  kind: "title_rejected" as const,
  created_at: "2026-09-12T12:00:00.000Z",
  unread: true,
}));

describe("ActivityBell", () => {
  it("shows the open count and View all to /activity", () => {
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
  });

  it("caps the popover at five open items, marks Done in-popover, and View all goes to /activity", () => {
    expect(ACTIVITY_BELL_OPEN_CAP).toBe(5);
    const html = renderToStaticMarkup(
      createElement(ActivityBell, {
        unread: 5,
        items: OPEN_ITEMS,
        defaultOpen: true,
      }),
    );
    expect(html).toContain("data-activity-bell-popover");
    for (const item of OPEN_ITEMS) {
      expect(html).toContain(`data-activity-bell-item="${item.id}"`);
      expect(html).toContain(item.title);
    }
    expect(html).toContain("data-activity-bell-done");
    expect(html).toContain(ACTIVITY_PAGE.done);
    expect(html).toContain(`href="${ACTIVITY_HREF}"`);
    expect(html).toContain("data-activity-bell-view-all");
    expect(html).toContain(ACTIVITY_PAGE.viewAll);
    expect(html.match(/data-activity-bell-item=/g)?.length).toBe(5);
  });
});
