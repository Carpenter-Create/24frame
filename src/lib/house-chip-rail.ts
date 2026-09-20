// Chip rail. Default two rows; consumers may pass rows={1}.
// Display chips, not an exclusive choice menu.
// Host is HOUSE_SCROLL_ROW_CLASS. Chip height is HOUSE_SEGMENTED_ITEM_*
// (same item box as header workspace / dest / news pills). Muted fill
// is HOUSE_FILTER_OFF — not a shorter display chip. Lanes interleave
// so both rows fill before the shared scrollport clips the trailing
// chip. Do not wrap. Do not truncate labels.

import {
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_PILL_CLUSTER_CLASS,
  HOUSE_RELATED_GAP_CLASS,
  HOUSE_SCROLL_ROW_CLASS,
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
} from "@/lib/house-shell";

export const HOUSE_CHIP_RAIL_ROWS = 2;

export const HOUSE_CHIP_RAIL_CLASS = HOUSE_SCROLL_ROW_CLASS;

export const HOUSE_CHIP_RAIL_STACK_CLASS = `flex w-max flex-col ${HOUSE_RELATED_GAP_CLASS}`;

export const HOUSE_CHIP_RAIL_ROW_CLASS = HOUSE_FILTER_PILL_CLUSTER_CLASS;

export const HOUSE_CHIP_RAIL_CHIP_CLASS =
  `${HOUSE_SEGMENTED_ITEM_BASE_CLASS} ${HOUSE_FILTER_OFF_CLASS}`;

export function splitChipRailRows<T>(
  items: readonly T[],
  rows: number = HOUSE_CHIP_RAIL_ROWS,
): T[][] {
  if (items.length === 0) return [];
  const count = Math.max(1, Math.floor(rows));
  const lanes: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    lanes[index % count]?.push(item);
  });
  return lanes.filter((lane) => lane.length > 0);
}
