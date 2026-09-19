// Shared mobile chrome for the Ask overlay history clock. One 44 hit,
// one 16 tertiary glyph. The dest hamburger is gone — destinations live
// on HousePhoneDestChips. The clock stays Lucide 1.33 until a measured
// rematch. MOBILE_CHROME_HAMBURGER_* tokens remain so the clock keeps
// the locked 44/16 hit. Not Close/44 — that object is a muted circle.
// Desktop clock stays size-4 at left-0. Phone dock is overlay SoT
// (sheet pad, not the retired /messages -24px content-inset pull).

import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";

export const MOBILE_CHROME_LEAD_PAD_PX = 24;
export const MOBILE_CHROME_SHEET_PAD_PX = 16;
export const MOBILE_CHROME_MESSAGES_FRAME_PAD_PX = 48;
export const MOBILE_CHROME_ICON_HIT_PX = 44;
export const MOBILE_CHROME_ICON_GLYPH_PX = 16;
export const MOBILE_CHROME_ICON_STROKE = 1.33;

export const MOBILE_CHROME_LEAD_PAD_CLASS = "px-[var(--space-6)]";

export const MOBILE_CHROME_ICON_BUTTON_CLASS =
  `flex size-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-visible ${HOUSE_ICON_BUTTON_CLASS} text-ink-3`;

export const MOBILE_CHROME_ICON_CLASS = "size-4 overflow-visible";

export const MOBILE_CHROME_HAMBURGER_BUTTON_CLASS = `${MOBILE_CHROME_ICON_BUTTON_CLASS} md:hidden`;

/** Desktop keeps the locked size-4 clock. Mobile uses the shared 44 hit. */
export const ASK_GLOBEE_CLOCK_BUTTON_CLASS = `${MOBILE_CHROME_ICON_BUTTON_CLASS} md:size-4 md:min-h-4 md:min-w-4`;

/** Desktop left-0. Phone: sheet pad — not content-inset −24px (clips off-screen). */
export const MOBILE_CHROME_CLOCK_DOCK_CLASS =
  "absolute top-0 left-0 max-md:left-[var(--space-4)]";

export function mobileChromeClockDockOffsetPx(
  sheetPadPx = MOBILE_CHROME_SHEET_PAD_PX,
): number {
  return sheetPadPx;
}

export function mobileChromeGlyphCenterPx(
  leadPx: number,
  hitPx = MOBILE_CHROME_ICON_HIT_PX,
): number {
  return leadPx + hitPx / 2;
}
