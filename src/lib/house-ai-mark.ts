// Adam sparkle cluster — one SoT for 24Frame AI / Ask AI chrome.
// Traced from the founder-provided mark: one large 4-point sparkle
// + two smaller. Public SVG is the house asset; HouseAiMark inlines
// the same paths with currentColor.

export const HOUSE_AI_MARK_SRC = "/brand/24frame-ai-mark.svg";
export const HOUSE_AI_MARK_VIEWBOX = "62 42 146 146";
export const HOUSE_AI_MARK_VIEWBOX_SIZE = 146;

/** Phone-header Regular-optical stroke width for the Adam sparkles.
 *  Phosphor Regular is 16 on a 256 viewBox (fill-based, whole-shape mass).
 *  Our mark strokes a diamond outline with `strokeLinejoin="round"` and
 *  the sparkle arms meet at a ~59° tip, so the outer arc softens the
 *  geometric point and a pure 16-optical stroke reads visibly thinner
 *  than a Phosphor Regular filled outline at the same pixel box.
 *  Bump to 20 on 256 (25% over Regular, still nowhere near Bold at 24)
 *  so the stroked sparkles land at Regular-optical parity with the
 *  Phosphor Regular bell sitting next to them — never Bold, never fill.
 *  The ratio is size-independent, so the same 20/256 constant carries
 *  Adam's target-size shifts: #447 rendered at the Mercury 24px box,
 *  #449 dropped the phone header to the 16px desktop-chrome optical
 *  and the bump still holds because it compensates for the geometric
 *  tip softening rather than a specific pixel width. */
export const HOUSE_AI_MARK_REGULAR_STROKE_WIDTH = (20 * HOUSE_AI_MARK_VIEWBOX_SIZE) / 256;

export type HouseAiMarkRegister = "fill" | "stroke";

export const HOUSE_AI_MARK_PATHS = [
  "M113 76L126.44 102.56L150 116L126.44 129.44L113 156L99.56 129.44L76 116L99.56 102.56Z",
  "M171 47L179.49 64.51L194 73L179.49 81.49L171 99L162.51 81.49L148 73L162.51 64.51Z",
  "M166 135L174.13 150.37L188 158.5L174.13 166.63L166 182L157.87 166.63L144 158.5L157.87 150.37Z",
] as const;
