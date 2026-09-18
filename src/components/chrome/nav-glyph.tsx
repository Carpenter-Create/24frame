import type { NavItem } from "@/lib/nav";
import { PhosphorChromeIcon } from "@/lib/phosphor-icon";
import { HouseAiMark } from "./house-ai-mark";

// Aggregation: Phosphor Bold idle / Fill active. Ask 24Frame AI uses
// the house sparkle cluster. SOCIAL_NAV family stays Lucide fallback;
// Social chrome rematch is SocialIcon.
export function NavGlyph({ item, active }: { item: NavItem; active: boolean }) {
  if (item.family === "lucide") {
    const Icon = item.icon;
    return <Icon className="size-4 shrink-0" strokeWidth={1.33} />;
  }
  if (item.family === "house-ai") {
    return <HouseAiMark />;
  }
  return <PhosphorChromeIcon icon={item.icon} active={active} />;
}
