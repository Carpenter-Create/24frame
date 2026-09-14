import {
  BRAND_EMBLEM_CORNER_BR_POINTS,
  BRAND_EMBLEM_CORNER_TL_POINTS,
  BRAND_EMBLEM_FOUR_DOT_PATH,
  BRAND_EMBLEM_FOUR_POINTS,
  BRAND_EMBLEM_HEIGHT_PX,
  BRAND_EMBLEM_TWO_PATH,
  BRAND_EMBLEM_VIEWBOX,
  BRAND_MARK_FILL,
} from "@/lib/brand";

// Asset 8 inline so light chrome can remap corner fills via currentColor.
// No baked rounded square. Blue on the 24 mark stays #1769FF.

export function BrandEmblem() {
  return (
    <svg
      data-brand-emblem-mark=""
      viewBox={BRAND_EMBLEM_VIEWBOX}
      height={BRAND_EMBLEM_HEIGHT_PX}
      className="w-auto shrink-0 text-ink dark:text-accent-contrast"
      aria-hidden
    >
      <path fill={BRAND_MARK_FILL} d={BRAND_EMBLEM_TWO_PATH} />
      <polygon fill={BRAND_MARK_FILL} points={BRAND_EMBLEM_FOUR_POINTS} />
      <path fill={BRAND_MARK_FILL} d={BRAND_EMBLEM_FOUR_DOT_PATH} />
      <polygon fill="currentColor" points={BRAND_EMBLEM_CORNER_BR_POINTS} />
      <polygon fill="currentColor" points={BRAND_EMBLEM_CORNER_TL_POINTS} />
    </svg>
  );
}
