import { createElement } from "react";
import { readFileSync } from "node:fs";
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
  activityItemHref,
  activityRelativeTime,
} from "@/lib/activity";
import { HOUSE_HEADER_TRAILING_ICON_CLASS } from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

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
  source_refs: { title_id: `00000000-0000-4000-8000-00000000000${i}` },
}));

const bellSrc = readFileSync("src/components/activity/activity-bell.tsx", "utf8");
const themeSrc = readFileSync("src/components/theme-toggle.tsx", "utf8");
const askHeaderSrc = readFileSync("src/components/chrome/ask-assistant-header.tsx", "utf8");
const houseAiMarkSrc = readFileSync("src/components/chrome/house-ai-mark.tsx", "utf8");

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

  it("caps the popover at five open items with Activity title, linked rows, X dismiss, and View all activity", () => {
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
    expect(html).toContain("data-activity-bell-open");
    expect(html).toContain(ACTIVITY_BELL_TRIGGER_OPEN_CLASS);
    expect(html).toContain(ACTIVITY_BELL_OPEN_DOT_CLASS);
    for (const item of OPEN_ITEMS) {
      expect(html).toContain(`data-activity-bell-item="${item.id}"`);
      expect(html).toContain(item.title);
      expect(html).toContain(`href="${activityItemHref(item)}"`);
    }
    expect(html).toContain("data-activity-bell-item-link");
    expect(html).toContain('data-activity-bell-kind="film-slate"');
    expect(html).toContain('data-activity-bell-kind="paper-plane-tilt"');
    expect(html).toContain("data-activity-bell-type-icon");
    expect(html).toContain("data-activity-bell-detail");
    expect(html).toContain("Fix this.");
    expect(html).toContain("data-activity-bell-time");
    expect(html).toContain(activityRelativeTime("2026-09-18T11:00:00.000Z", NOW));
    expect(html).toContain("data-activity-bell-open-dot");
    expect(html).toContain("data-activity-bell-dismiss");
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.dismiss}"`);
    expect(html).toContain(`href="${ACTIVITY_HREF}"`);
    expect(html).toContain("data-activity-bell-view-all");
    expect(html).toContain(ACTIVITY_PAGE.viewAll);
    expect(html.match(/data-activity-bell-item=/g)?.length).toBe(5);
    expect(html.match(/data-activity-bell-dismiss=/g)?.length).toBe(5);
    expect(html).not.toContain("data-activity-bell-view\"");
    expect(html).not.toContain("data-activity-bell-done");
    expect(html).not.toContain("data-activity-bell-mark-all");
    expect(html).not.toContain(">View<");
    expect(html).not.toContain("Mark all done");
    expect(html).not.toContain("data-activity-status-chip");
    expect(html).not.toContain("data-activity-period-chip");
    expect(html).not.toContain("Unread");
    expect(html).not.toContain("Resolved");
  });

  it("matches #391 chrome idle weight on theme and bell", () => {
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");
    expect(HOUSE_HEADER_TRAILING_ICON_CLASS).toBe("size-6 shrink-0 md:size-4");
    expect(themeSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_ICON_CLASS");
    expect(bellSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    for (const src of [themeSrc, bellSrc]) {
      expect(src).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
      expect(src).toContain("weight={PHOSPHOR_CHROME_IDLE_WEIGHT}");
      expect(src).not.toContain('weight="fill"');
      expect(src).not.toContain('weight="duotone"');
      expect(src).not.toContain("size-5");
      expect(src).not.toContain("strokeWidth");
    }
    expect(themeSrc).not.toContain("size-6");
    expect(bellSrc).not.toContain('"size-6');
  });

  it("uses the house AI mark on the 24Frame AI header slot — not Phosphor Sparkle", () => {
    expect(askHeaderSrc).toContain("<HouseAiMark");
    expect(askHeaderSrc).not.toContain("Sparkle");
    expect(askHeaderSrc).not.toContain("Sparkles");
    expect(askHeaderSrc).not.toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(askHeaderSrc).not.toContain("@phosphor-icons/react");
    expect(houseAiMarkSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(houseAiMarkSrc).toContain("data-house-ai-mark");
    expect(houseAiMarkSrc).toContain('fill="currentColor"');
    expect(houseAiMarkSrc).not.toContain("Sparkle");
    expect(houseAiMarkSrc).not.toContain("size-5");
    expect(houseAiMarkSrc).not.toContain("size-6");
    expect(houseAiMarkSrc).not.toContain("strokeWidth");
  });
});
