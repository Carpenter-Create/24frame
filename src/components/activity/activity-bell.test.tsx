import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
}));

import { ActivityBell } from "./activity-bell";
import {
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
} from "@/lib/activity";
import {
  HOUSE_HEADER_TRAILING_HIT_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS,
} from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

const bellSrc = readFileSync("src/components/activity/activity-bell.tsx", "utf8");
const themeSrc = readFileSync("src/components/theme-toggle.tsx", "utf8");
const askHeaderSrc = readFileSync("src/components/chrome/ask-assistant-header.tsx", "utf8");
const houseAiMarkSrc = readFileSync("src/components/chrome/house-ai-mark.tsx", "utf8");

describe("ActivityBell", () => {
  it("navigates to Activity with the unread badge and no peek surface", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityBell, {
        unread: 3,
      }),
    );
    expect(html).toContain("data-activity-bell");
    expect(html).toContain(`aria-label="${ACTIVITY_PAGE.bellLabel}"`);
    expect(html).toContain(`href="${ACTIVITY_HREF}"`);
    expect(html).toContain("data-activity-bell-badge");
    expect(html).toContain("3");
    expect(html).toContain(ACTIVITY_BELL_TRIGGER_CLASS);
    expect(html).toContain(HOUSE_HEADER_TRAILING_HIT_CLASS);
    expect(html).toContain("data-activity-bell-phone");
    expect(html).toContain("data-activity-bell-desktop");
    expect(html).toContain(HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS);
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).not.toContain("data-activity-bell-open");
    expect(html).not.toContain("data-activity-bell-sheet");
    expect(html).not.toContain("data-activity-bell-popover");
    expect(html).not.toContain("data-activity-bell-view-all");
    expect(html).not.toContain("data-activity-status-chip");
    expect(html).not.toContain("Unread");
    expect(html).not.toContain("Resolved");
    expect(bellSrc).toContain("<Link");
    expect(bellSrc).toContain("ACTIVITY_HREF");
    expect(bellSrc).not.toContain("createPortal");
    expect(bellSrc).not.toContain("ActivityBellSheet");
    expect(bellSrc).not.toContain("data-activity-bell-popover");
    expect(bellSrc).not.toContain("data-activity-bell-sheet");
    expect(bellSrc).not.toContain("ACCOUNT_SHEET_HOST_CLASS");
    expect(bellSrc).not.toContain("REPORTS_USER_PANEL_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS");
    expect(bellSrc).toContain("hidden md:block");
  });

  it("matches #391 chrome idle weight on theme and the desktop bell", () => {
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");
    // Phone header trailing sits on its own 16px SoT (Adam #451
    // authoritative — two literals, no alias). #447 shipped size-6,
    // #448 collapsed to size-5, #449 split header down to size-4,
    // #450 briefly re-collapsed to size-5, #451 restores the split
    // with the phone header back at the 16px desktop-chrome optical.
    // Mercury bar stays on size-6 via HOUSE_PHONE_CHROME_ICON_CLASS.
    // Mutation of HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS to size-6
    // or size-5 fails here.
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toBe(
      "size-4 shrink-0 md:size-4 md:hidden text-ink-2",
    );
    // Phone bell rides bottom-bar idle ink; desktop bell stays on the
    // HOUSE_THEME_TOGGLE_CLASS text-ink-3 / hover:text-ink from #442.
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).toBe("size-4 shrink-0 hidden md:block");
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).not.toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(themeSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_DESKTOP_CLASS");
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
