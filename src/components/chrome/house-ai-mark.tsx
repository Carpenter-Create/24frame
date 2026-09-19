import {
  HOUSE_AI_MARK_PATHS,
  HOUSE_AI_MARK_REGULAR_STROKE_WIDTH,
  HOUSE_AI_MARK_VIEWBOX,
  type HouseAiMarkRegister,
} from "@/lib/house-ai-mark";
import { PHOSPHOR_CHROME_ICON_CLASS } from "@/lib/phosphor-icon";

// House 24Frame AI mark. Chrome idle size matches Phosphor 16px
// (PHOSPHOR_CHROME_ICON_CLASS). Fill is the desktop/rail register.
// Phone header trailing uses stroke — Regular optical, same paths.
// No Phosphor catalog glyph. No second AI glyph.

export function HouseAiMark({
  className = PHOSPHOR_CHROME_ICON_CLASS,
  register = "fill",
}: {
  className?: string;
  register?: HouseAiMarkRegister;
}) {
  const stroke = register === "stroke";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HOUSE_AI_MARK_VIEWBOX}
      className={className}
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : undefined}
      strokeWidth={stroke ? HOUSE_AI_MARK_REGULAR_STROKE_WIDTH : undefined}
      strokeLinecap={stroke ? "round" : undefined}
      strokeLinejoin={stroke ? "round" : undefined}
      aria-hidden="true"
      focusable="false"
      data-house-ai-mark=""
      data-house-ai-mark-register={register}
    >
      {HOUSE_AI_MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
