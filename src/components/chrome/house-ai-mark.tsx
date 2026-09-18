import {
  HOUSE_AI_MARK_PATHS,
  HOUSE_AI_MARK_VIEWBOX,
} from "@/lib/house-ai-mark";
import { PHOSPHOR_CHROME_ICON_CLASS } from "@/lib/phosphor-icon";

// House 24Frame AI mark. Chrome idle size matches Phosphor 16px
// (PHOSPHOR_CHROME_ICON_CLASS). Filled silhouette; currentColor so
// rail active ink (Sporty Blue) inherits. No Phosphor catalog glyph.
// No second AI glyph.

export function HouseAiMark({
  className = PHOSPHOR_CHROME_ICON_CLASS,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HOUSE_AI_MARK_VIEWBOX}
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-house-ai-mark=""
    >
      {HOUSE_AI_MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
