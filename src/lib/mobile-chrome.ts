// Shared mobile chrome for the header hamburger and the Ask Globee
// history clock. One lead pad, one 44 hit, one 16 tertiary glyph.
// Hamburger (84:240 / 82:13) is Phosphor List Bold. The Ask Globee
// clock stays Lucide 1.33 until a measured rematch.
// Measured 2026-09-10 from app-shell / mobile-nav / ask-globee-landing:
//
//   Header pad (max-md)     --space-6          24px
//   Hamburger (was)         size-4 + Menu 16   hit 16 · glyph center 32
//   Messages frame          --content-inset    48px
//   Landing clock dock      absolute left-0    ignores landing px
//   Clock (was)             size-4 + Clock 16  hit 16 · glyph center 56
//   Delta                   24px (clock right of hamburger)
//   Clip                    16 glyph in 16 hit shears the lucide stroke
//
// Fix: expand BOTH hits to 44 (RL #344 lesson) and pull the clock dock
// to the header lead so the 16 glyphs share one column. Not Close/44 —
// that object is a muted circle. Desktop clock stays size-4 at left-0.

export const MOBILE_CHROME_LEAD_PAD_PX = 24;
export const MOBILE_CHROME_MESSAGES_FRAME_PAD_PX = 48;
export const MOBILE_CHROME_ICON_HIT_PX = 44;
export const MOBILE_CHROME_ICON_GLYPH_PX = 16;
export const MOBILE_CHROME_ICON_STROKE = 1.33;

export const MOBILE_CHROME_LEAD_PAD_CLASS = "px-[var(--space-6)]";

export const MOBILE_CHROME_ICON_BUTTON_CLASS =
  "flex size-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-visible text-ink-3";

export const MOBILE_CHROME_ICON_CLASS = "size-4 overflow-visible";

export const MOBILE_CHROME_HAMBURGER_BUTTON_CLASS = `${MOBILE_CHROME_ICON_BUTTON_CLASS} md:hidden`;

/** Desktop keeps the locked size-4 clock. Mobile uses the shared 44 hit. */
export const ASK_GLOBEE_CLOCK_BUTTON_CLASS = `${MOBILE_CHROME_ICON_BUTTON_CLASS} md:size-4 md:min-h-4 md:min-w-4`;

/** Desktop left-0. Mobile: header lead minus messages-frame inset. */
export const MOBILE_CHROME_CLOCK_DOCK_CLASS =
  "absolute top-0 left-0 max-md:left-[calc(var(--space-6)-var(--content-inset))]";

export function mobileChromeClockDockOffsetPx(
  leadPadPx = MOBILE_CHROME_LEAD_PAD_PX,
  framePadPx = MOBILE_CHROME_MESSAGES_FRAME_PAD_PX,
): number {
  return leadPadPx - framePadPx;
}

export function mobileChromeGlyphCenterPx(
  leadPx: number,
  hitPx = MOBILE_CHROME_ICON_HIT_PX,
): number {
  return leadPx + hitPx / 2;
}
