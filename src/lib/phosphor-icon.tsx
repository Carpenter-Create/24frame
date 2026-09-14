import type { Icon, IconWeight } from "@phosphor-icons/react";

// Shared Phosphor primitive — glyph-only. Live Mercury structure,
// spacing, IA, and chrome stay. Do not escalate past current premium.
// 75:5 rail, 75:132 settings caret-left (text-led), 84:46 account
// *icons* (not a sheet rewrite), 84:176 collapse icons, 84:240 mobile
// menu icons, shelf 82:5 / 82:9 / 82:13. Social interiors stay Lucide
// (Social V1). Same SSOT (`_Icons / Phosphor Bold`, 61:2): Bold idle,
// Fill active. 16px house glyph.

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
