import type { NavItem } from "@/lib/nav";
import { PhosphorChromeIcon } from "@/lib/phosphor-icon";

// Aggregation: Phosphor Bold idle / Fill active. Social: Lucide until V1.
export function NavGlyph({ item, active }: { item: NavItem; active: boolean }) {
  if (item.family === "lucide") {
    const Icon = item.icon;
    return <Icon className="size-4 shrink-0" strokeWidth={1.33} />;
  }
  return <PhosphorChromeIcon icon={item.icon} active={active} />;
}
