import type { Icon, IconWeight } from "@phosphor-icons/react";

// Shared Phosphor primitive. Measured Aggregation chrome is the first
// consumer (75:5 rail, 75:132 settings caret-left). Social interiors stay
// on their own PR. Same SSOT (`_Icons / Phosphor Bold`, 61:2): Bold idle,
// Fill active. 16px house glyph.
// Design miss list — do not rematch until frames land: rail collapse
// caret-double, account-sheet carets + sign-out, Close/44 X, mobile List.

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
