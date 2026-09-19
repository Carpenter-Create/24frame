import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityBell, ActivityBellSheet } from "./activity-bell";
import {
  ACCOUNT_SHEET_HEAD_CLASS,
  ACCOUNT_SHEET_HOST_CLASS,
  ACCOUNT_SHEET_SCROLL_CLASS,
  ACCOUNT_SHEET_STAGE_CLASS,
  ACCOUNT_SHEET_SURFACE_CLASS,
} from "@/lib/account-sheet";
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
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
} from "@/lib/house-phone-shell";
import {
  APP_SHEET_RISE_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SCRIM_FADE_CLASS,
  CLOSE_44_CLASS,
} from "@/lib/house-sheet";
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

function attrClass(html: string, attr: string): string {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const classThenAttr = html.match(new RegExp(`class="([^"]*)"[^>]*${escaped}`));
  const attrThenClass = html.match(new RegExp(`${escaped}[^>]*class="([^"]*)"`));
  return classThenAttr?.[1] ?? attrThenClass?.[1] ?? "";
}

function feedAssertions(html: string, itemCount: number) {
  expect(html).toContain("data-activity-bell-title");
  expect(html).toContain(`>${ACTIVITY_PAGE.title}<`);
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
  expect(html.match(/data-activity-bell-item=/g)?.length).toBe(itemCount);
  expect(html.match(/data-activity-bell-dismiss=/g)?.length).toBe(itemCount);
  expect(html).not.toContain("data-activity-bell-view\"");
  expect(html).not.toContain("data-activity-bell-done");
  expect(html).not.toContain("data-activity-bell-mark-all");
  expect(html).not.toContain(">View<");
  expect(html).not.toContain("Mark all done");
  expect(html).not.toContain("data-activity-status-chip");
  expect(html).not.toContain("data-activity-period-chip");
  expect(html).not.toContain("Unread");
  expect(html).not.toContain("Resolved");
}

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
    expect(html).toContain("data-activity-bell-phone");
    expect(html).toContain("data-activity-bell-desktop");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).not.toContain("data-activity-bell-open");
    expect(html).not.toContain("data-activity-bell-sheet");
    expect(html).not.toContain("data-activity-bell-popover");
    expect(html).not.toContain("data-activity-status-chip");
    expect(html).not.toContain("Unread");
    expect(html).not.toContain("Resolved");
  });

  it("caps the desktop popover at five open items with Activity title, linked rows, X dismiss, and View all activity", () => {
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
    expect(html).toContain("data-activity-bell-open");
    expect(html).toContain(ACTIVITY_BELL_TRIGGER_OPEN_CLASS);
    expect(attrClass(html, "data-activity-bell-popover")).toContain("rounded-[12px]");
    expect(attrClass(html, "data-activity-bell-popover")).toContain("border-hairline");
    expect(attrClass(html, "data-activity-bell-popover")).toContain("min-w-[20rem]");
    expect(attrClass(html, "data-activity-bell-popover")).not.toContain(ACCOUNT_SHEET_HOST_CLASS);
    expect(attrClass(html, "data-activity-bell-popover")).not.toContain("rounded-t-[16px]");
    expect(attrClass(html, "data-activity-bell-desktop")).toContain("hidden md:block");
    feedAssertions(html, 10);
  });

  it("opens a house bottom sheet on phone — same tokens as AccountSheet", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityBellSheet, {
        items: OPEN_ITEMS,
        now: NOW,
        onClose: () => undefined,
      }),
    );
    const hostClass = attrClass(html, 'data-activity-bell-sheet=""');
    const scrimClass = attrClass(html, "data-activity-bell-sheet-scrim");
    const surfaceClass = attrClass(html, "data-activity-bell-sheet-surface");
    const headClass = attrClass(html, "data-activity-bell-sheet-head");
    const stageClass = attrClass(html, "data-activity-bell-sheet-stage");
    const scrollClass = attrClass(html, "data-activity-bell-sheet-scroll");
    const closeClass = attrClass(html, "data-activity-bell-sheet-close");
    const accent = attrClass(html, "data-menu-surface-accent");

    expect(html).toContain("data-activity-bell-sheet");
    expect(html).toContain("data-activity-bell-sheet-scrim");
    expect(html).toContain("data-activity-bell-sheet-surface");
    expect(html).toContain("data-activity-bell-sheet-close");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.bellLabel}"`);
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.close}"`);
    expect(hostClass).toBe(ACCOUNT_SHEET_HOST_CLASS);
    expect(hostClass).toContain("justify-end");
    expect(scrimClass).toBe(APP_SHEET_SCRIM_CLASS);
    expect(scrimClass).toContain(APP_SHEET_SCRIM_FADE_CLASS);
    expect(surfaceClass).toBe(ACCOUNT_SHEET_SURFACE_CLASS);
    expect(surfaceClass).toContain(APP_SHEET_RISE_CLASS);
    expect(surfaceClass).toContain("rounded-t-[16px]");
    expect(surfaceClass).toContain("account-sheet-surface");
    expect(headClass).toBe(ACCOUNT_SHEET_HEAD_CLASS);
    expect(stageClass).toBe(ACCOUNT_SHEET_STAGE_CLASS);
    expect(scrollClass).toBe(ACCOUNT_SHEET_SCROLL_CLASS);
    expect(CLOSE_44_CLASS.split(" ").every((token) => closeClass.includes(token))).toBe(true);
    expect(accent).toContain("top-0");
    expect(accent).toContain("h-[4px]");
    expect(accent).toContain("w-1/2");
    expect(accent).toContain("left-0");
    expect(accent).toContain("bg-accent");
    expect(html).not.toContain("data-activity-bell-popover");
    feedAssertions(html, 5);
    expect(bellSrc).toContain("createPortal");
    expect(bellSrc).toContain("document.body");
    expect(bellSrc).toContain("ACCOUNT_SHEET_HOST_CLASS");
    expect(bellSrc).toContain("ACCOUNT_SHEET_SURFACE_CLASS");
    expect(bellSrc).toContain("APP_SHEET_SCRIM_CLASS");
    expect(bellSrc).toContain("<Close44");
    expect(bellSrc).toContain("<MenuSurfaceAccent");
    expect(bellSrc).toContain("md:hidden");
    expect(bellSrc).toContain("hidden md:block");
    expect(bellSrc).toContain("REPORTS_USER_PANEL_CLASS");
    expect(bellSrc).toContain("event.key === \"Escape\"");
    expect(bellSrc).not.toContain("ACTIVITY_SHEET_HOST_CLASS");
    expect(bellSrc).not.toContain("rounded-t-[24px]");
    expect(bellSrc).not.toContain("backdrop-blur");
  });

  it("matches #391 chrome idle weight on theme and the desktop bell", () => {
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");
    // Phone header trailing sits on the shared 20px SoT (Adam #448
    // collapsed the short-lived split back onto one register — both
    // Mercury bar and header trailing render at size-5). Mutation of
    // the shared HOUSE_PHONE_CHROME_ICON_CLASS to size-6 fails here.
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toBe(
      "size-5 shrink-0 md:size-4 md:hidden text-ink-2",
    );
    // Phone bell rides bottom-bar idle ink; desktop bell stays on the
    // HOUSE_THEME_TOGGLE_CLASS text-ink-3 / hover:text-ink from #442.
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).toBe("size-4 shrink-0 hidden md:block");
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).not.toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(themeSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_DESKTOP_CLASS");
    expect(bellSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(themeSrc).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(themeSrc).toContain("weight={PHOSPHOR_CHROME_IDLE_WEIGHT}");
    expect(bellSrc).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(bellSrc).toContain("weight={PHOSPHOR_CHROME_IDLE_WEIGHT}");
    expect(bellSrc).toContain("HOUSE_PHONE_CHROME_ICON_WEIGHT");
    expect(bellSrc).toContain(
      "weight={phone ? HOUSE_PHONE_CHROME_ICON_WEIGHT : PHOSPHOR_CHROME_IDLE_WEIGHT}",
    );
    expect(bellSrc).toContain('register="phone"');
    expect(bellSrc).toContain('register="desktop"');
    expect(HOUSE_PHONE_CHROME_ICON_WEIGHT).toBe("regular");
    for (const src of [themeSrc, bellSrc]) {
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
    expect(askHeaderSrc).toContain('register="stroke"');
    expect(askHeaderSrc).toContain('register="fill"');
    expect(askHeaderSrc).not.toContain("Sparkle");
    expect(askHeaderSrc).not.toContain("Sparkles");
    expect(askHeaderSrc).not.toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(askHeaderSrc).not.toContain("@phosphor-icons/react");
    expect(houseAiMarkSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(houseAiMarkSrc).toContain("data-house-ai-mark");
    expect(houseAiMarkSrc).toContain('fill={stroke ? "none" : "currentColor"}');
    expect(houseAiMarkSrc).toContain("HOUSE_AI_MARK_REGULAR_STROKE_WIDTH");
    expect(houseAiMarkSrc).not.toContain("Sparkle");
    expect(houseAiMarkSrc).not.toContain("size-5");
    expect(houseAiMarkSrc).not.toContain("size-6");
  });
});
