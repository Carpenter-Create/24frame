import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ASK_GLOBEE_CLOCK_BUTTON_CLASS,
  MOBILE_CHROME_CLOCK_DOCK_CLASS,
  MOBILE_CHROME_HAMBURGER_BUTTON_CLASS,
  MOBILE_CHROME_ICON_BUTTON_CLASS,
  MOBILE_CHROME_ICON_CLASS,
  MOBILE_CHROME_ICON_GLYPH_PX,
  MOBILE_CHROME_ICON_HIT_PX,
  MOBILE_CHROME_ICON_STROKE,
  MOBILE_CHROME_LEAD_PAD_CLASS,
  MOBILE_CHROME_LEAD_PAD_PX,
  MOBILE_CHROME_MESSAGES_FRAME_PAD_PX,
  mobileChromeClockDockOffsetPx,
  mobileChromeGlyphCenterPx,
} from "./mobile-chrome";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(here, "../app/tokens.css"), "utf8");
const shellSrc = readFileSync(join(here, "../components/chrome/app-shell.tsx"), "utf8");
const leadLibSrc = readFileSync(join(here, "house-lead-chrome.ts"), "utf8");
const destsSrc = readFileSync(join(here, "../components/chrome/house-phone-dest-chips.tsx"), "utf8");
const landingSrc = readFileSync(join(here, "../components/messages/ask-globee-landing.tsx"), "utf8");
const threadSrc = readFileSync(join(here, "../components/messages/ask-globee-thread.tsx"), "utf8");

describe("mobile chrome clock lock", () => {
  it("shares lead inset, 44 hit, and 16 glyph for the Ask Globee clock", () => {
    expect(tokens).toMatch(/--space-6:\s*1\.5rem/);
    expect(tokens).toMatch(/--content-inset:\s*48px;/);
    expect(MOBILE_CHROME_LEAD_PAD_PX).toBe(24);
    expect(MOBILE_CHROME_MESSAGES_FRAME_PAD_PX).toBe(48);
    expect(MOBILE_CHROME_ICON_HIT_PX).toBe(44);
    expect(MOBILE_CHROME_ICON_GLYPH_PX).toBe(16);
    expect(MOBILE_CHROME_ICON_STROKE).toBe(1.33);

    expect(MOBILE_CHROME_LEAD_PAD_CLASS).toBe("px-[var(--space-6)]");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("size-[44px]");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("min-h-[44px]");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("min-w-[44px]");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("overflow-visible");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("text-ink-3");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).toContain("rounded-full");
    expect(MOBILE_CHROME_ICON_BUTTON_CLASS).not.toContain("bg-surface-muted");
    expect(MOBILE_CHROME_ICON_CLASS).toBe("size-4 overflow-visible");

    expect(MOBILE_CHROME_HAMBURGER_BUTTON_CLASS).toContain(MOBILE_CHROME_ICON_BUTTON_CLASS);
    expect(MOBILE_CHROME_HAMBURGER_BUTTON_CLASS).toContain("md:hidden");
    expect(ASK_GLOBEE_CLOCK_BUTTON_CLASS).toContain(MOBILE_CHROME_ICON_BUTTON_CLASS);
    expect(ASK_GLOBEE_CLOCK_BUTTON_CLASS).toContain("md:size-4");
    expect(ASK_GLOBEE_CLOCK_BUTTON_CLASS).toContain("md:min-h-4");
    expect(ASK_GLOBEE_CLOCK_BUTTON_CLASS).toContain("md:min-w-4");

    expect(mobileChromeClockDockOffsetPx()).toBe(-24);
    expect(MOBILE_CHROME_CLOCK_DOCK_CLASS).toContain(
      "max-md:left-[calc(var(--space-6)-var(--content-inset))]",
    );

    const hamburgerCenter = mobileChromeGlyphCenterPx(MOBILE_CHROME_LEAD_PAD_PX);
    const clockCenter = mobileChromeGlyphCenterPx(
      MOBILE_CHROME_MESSAGES_FRAME_PAD_PX + mobileChromeClockDockOffsetPx(),
    );
    expect(hamburgerCenter).toBe(46);
    expect(clockCenter).toBe(hamburgerCenter);
  });

  it("is consumed by the Ask Globee clock, not dest chips or the thread", () => {
    expect(leadLibSrc).toContain("HOUSE_LEAD_PHONE_PAD_CLASS");
    expect(leadLibSrc).toContain("HOUSE_PHONE_TRAILING_GUTTER_CLASS");
    expect(leadLibSrc).toContain("HOUSE_CHROME_GUTTER_X_CLASS");
    expect(shellSrc).toContain('data-app-messages-frame=""');
    expect(shellSrc).toContain("p-[var(--content-inset)]");

    expect(destsSrc).not.toContain("MOBILE_CHROME_HAMBURGER_BUTTON_CLASS");
    expect(destsSrc).not.toContain("data-mobile-nav-trigger");
    expect(destsSrc).toContain("data-house-phone-dest-chips");

    expect(landingSrc).toContain("ASK_GLOBEE_CLOCK_BUTTON_CLASS");
    expect(landingSrc).toContain("MOBILE_CHROME_CLOCK_DOCK_CLASS");
    expect(landingSrc).toContain("MOBILE_CHROME_ICON_CLASS");
    expect(landingSrc).toContain("MOBILE_CHROME_ICON_STROKE");
    expect(landingSrc).toContain("data-ask-globee-clock");
    expect(landingSrc).not.toContain("absolute left-0 top-0");
    expect(landingSrc).not.toContain('className="flex size-4 items-center justify-center text-ink-3"');

    expect(threadSrc).not.toContain("data-ask-globee-clock");
    expect(threadSrc).not.toContain("MOBILE_CHROME_CLOCK_DOCK_CLASS");
  });
});
