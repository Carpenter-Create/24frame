import type { Icon, IconWeight } from "@phosphor-icons/react";

// Shared Phosphor primitive. Measured Aggregation + shared shell chrome:
// 75:5 rail, 75:132 settings caret-left, 84:46 account sheet, 84:176
// collapsed rail, 84:240 mobile menu. Social interiors stay on their own
// PR. Same SSOT (`_Icons / Phosphor Bold`, 61:2): Bold idle, Fill active.
// 16px house glyph.

export type PhosphorIcon = Icon;

export const PHOSPHOR_CHROME_IDLE_WEIGHT = "bold" satisfies IconWeight;
export const PHOSPHOR_CHROME_ACTIVE_WEIGHT = "fill" satisfies IconWeight;
export const PHOSPHOR_CHROME_ICON_CLASS = "size-4 shrink-0";

export function phosphorChromeWeight(active: boolean): "bold" | "fill" {
  return active ? PHOSPHOR_CHROME_ACTIVE_WEIGHT : PHOSPHOR_CHROME_IDLE_WEIGHT;
}

export function PhosphorChromeIcon({
  icon: Glyph,
  active = false,
  className = PHOSPHOR_CHROME_ICON_CLASS,
}: {
  icon: PhosphorIcon;
  active?: boolean;
  className?: string;
}) {
  return <Glyph className={className} weight={phosphorChromeWeight(active)} />;
}
