import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ACTIVITY,
  ACTIVITY_BELL_ABSENT,
  ACTIVITY_BELL_DOT_CLASS,
  ACTIVITY_BELL_FOOTER_CLASS,
  ACTIVITY_BELL_HEAD_CLASS,
  ACTIVITY_BELL_MENU_CLASS,
  ACTIVITY_BELL_PLATE_CLASS,
  ACTIVITY_BELL_ROW_CLASS,
  ACTIVITY_HREF,
  type ActivityBellPreview,
} from "@/lib/activity";
import {
  HOUSE_HEADER_CHROME_ICON_CLASS,
  HOUSE_HEADER_CHROME_ICON_WEIGHT,
  HOUSE_HEADER_ICON_GHOST_CLASS,
} from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { ASK_ASSISTANT } from "@/lib/product";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/(app)/activity/actions", () => ({ markActivityDone: vi.fn() }));

import { ActivityBell } from "./activity-bell";
import { AskAssistantEntry } from "./ask-assistant-entry";

const PREVIEW: ActivityBellPreview = {
  openCount: 3,
  items: [
    {
      id: "n1",
      title: "North Wind is live",
      body: "Delivery advanced.",
      href: "/titles/aaaaaaaa-1111-4111-8111-111111111111",
      at: "2026-09-18T12:00:00.000Z",
      kind: "delivery_update",
      kindLabel: "Delivery update",
      open: true,
    },
  ],
};

const src = readFileSync(new URL("./activity-bell.tsx", import.meta.url), "utf8");

describe("ActivityBell", () => {
  it("renders the house header bell with View all → /activity", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityBell, { preview: PREVIEW, openCount: 3 }),
    );
    expect(html).toContain('data-activity-bell=""');
    expect(html).toContain(`aria-label="${ACTIVITY.bellLabel}"`);
    expect(html).toContain(HOUSE_HEADER_ICON_GHOST_CLASS);
    expect(src).toContain("data-activity-bell-badge");
    expect(src).toContain("ACTIVITY.viewAll");
    expect(src).toContain("ACTIVITY_HREF");
    expect(src).toContain("ACTIVITY.done");
    expect(src).toContain("ACTIVITY.view");
    expect(src).toContain("ACTIVITY.markAllDone");
    expect(src).toContain("data-activity-bell-view-all");
    expect(html).not.toContain("Messages");
    expect(ACTIVITY_HREF).toBe("/activity");
  });

  it("uses shared header primitives — ghost hover, MenuSurface, no lookalike fork", () => {
    expect(src).toContain("HOUSE_HEADER_ICON_GHOST_CLASS");
    expect(src).toContain("MenuSurfaceContent");
    expect(src).toContain('density="panel"');
    expect(src).toContain("TEXT_ACTION_CLASS");
    expect(src).toContain("HOUSE_HEADER_CHROME_ICON_WEIGHT");
    expect(src).toContain("HOUSE_HEADER_CHROME_ICON_CLASS");
    expect(src).not.toContain("strokeWidth");
    expect(src).not.toContain("stroke-width");
    expect(src).not.toContain('weight="fill"');
    expect(src).not.toContain('weight="duotone"');
    expect(src).not.toContain('weight="regular"');
    expect(HOUSE_HEADER_CHROME_ICON_WEIGHT).toBe(PHOSPHOR_CHROME_IDLE_WEIGHT);
    expect(HOUSE_HEADER_CHROME_ICON_CLASS).toBe(PHOSPHOR_CHROME_ICON_CLASS);
    expect(src).toContain("from \"@phosphor-icons/react\"");
    expect(src).toContain("<Bell");
    expect(src).toContain("<Checks");
    expect(src).toContain("ACTIVITY_BELL_PLATE_CLASS");
    expect(src).toContain("data-activity-bell-plate");
    expect(src).not.toContain("DropdownMenuContent");
    expect(src).not.toContain("gold");
    expect(src).not.toContain("amber");
    expect(src).not.toContain("royalogic");
    expect(src).not.toContain("placeholder");
    expect(HOUSE_HEADER_ICON_GHOST_CLASS).toContain("data-[state=open]:bg-surface-muted");
    expect(ACTIVITY_BELL_PLATE_CLASS).toContain("size-8");
    expect(ACTIVITY_BELL_PLATE_CLASS).toContain("rounded-full");
    expect(ACTIVITY_BELL_PLATE_CLASS).toContain("bg-surface-muted");
    expect(ACTIVITY_BELL_MENU_CLASS).toContain("min-w-[20rem]");
    expect(ACTIVITY_BELL_HEAD_CLASS).toContain("justify-between");
    expect(ACTIVITY_BELL_ROW_CLASS).toContain("items-start");
    expect(ACTIVITY_BELL_DOT_CLASS).toBe("size-2 shrink-0 rounded-full bg-accent");
    expect(ACTIVITY_BELL_FOOTER_CLASS).toContain("px-[var(--space-3)]");
    expect(TEXT_ACTION_CLASS).toContain("text-accent");
  });

  it("locks popover IA: Activity title, open rows, View + Done, footer, no filter tabs", () => {
    expect(src).toContain("ACTIVITY.title");
    expect(src).toContain("data-activity-bell-head");
    expect(src).toContain("data-activity-bell-row");
    expect(src).toContain("data-activity-bell-kind");
    expect(src).toContain("data-activity-bell-time");
    expect(src).toContain("data-activity-bell-dot");
    expect(src).toContain("data-activity-bell-view");
    expect(src).toContain("data-activity-bell-mark-done");
    expect(src).toContain("data-activity-bell-mark-all-done");
    expect(src).toContain("activityKindGlyph");
    expect(src).toContain("formatActivityRelativeTime");
    expect(src).toContain("FilmSlate");
    expect(src).toContain("PaperPlaneTilt");
    expect(ACTIVITY.title).toBe("Activity");
    expect(ACTIVITY.view).toBe("View");
    expect(ACTIVITY.done).toBe("Done");
    expect(ACTIVITY.viewAll).toBe("View all activity →");
    expect(ACTIVITY.markAllDone).toBe("Mark all done");
    for (const absent of ACTIVITY_BELL_ABSENT) {
      expect(src).not.toContain(absent);
    }
    expect(src).not.toContain("All/Unread");
    expect(src).not.toContain("Resolved");
  });
});

describe("AskAssistantEntry", () => {
  it("wires Ask 24Frame AI to /messages from shared header chrome", () => {
    const html = renderToStaticMarkup(createElement(AskAssistantEntry));
    expect(html).toContain('data-ask-assistant-entry=""');
    expect(html).toContain(`aria-label="${ASK_ASSISTANT}"`);
    expect(html).toContain('href="/messages"');
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("stroke-width");
    expect(html).toContain(HOUSE_HEADER_CHROME_ICON_CLASS);
    expect(ASK_ASSISTANT).toBe("Ask 24Frame AI");
    const entrySrc = readFileSync(new URL("./ask-assistant-entry.tsx", import.meta.url), "utf8");
    expect(entrySrc).toContain("HOUSE_HEADER_CHROME_ICON_WEIGHT");
    expect(entrySrc).not.toContain("strokeWidth");
  });
});
