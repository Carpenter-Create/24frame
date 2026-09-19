import type { NavItem } from "@/lib/nav";
import { PhosphorChromeIcon } from "@/lib/phosphor-icon";
import { HouseAiMark } from "./house-ai-mark";

// One icon package. Aggregation + Social dests: Phosphor Bold idle /
// Fill active. House-ai family is overlay/header chrome, not a rail row.
// Social interiors stay SocialIcon (same Phosphor package, V1 sizes).
export function NavGlyph({ item, active }: { item: NavItem; active: boolean }) {
  if (item.family === "house-ai") {
    return <HouseAiMark />;
  }
  return <PhosphorChromeIcon icon={item.icon} active={active} />;
}
