// Two-row chip rail. Display chips, not an exclusive choice menu.
// Host is HOUSE_SCROLL_ROW_CLASS; chips are HOUSE_FILTER_PILL_*.
// Lanes interleave so both rows fill before the shared scrollport
// clips the trailing chip. Do not wrap. Do not truncate labels.

import {
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_PILL_CLASS,
  HOUSE_FILTER_PILL_CLUSTER_CLASS,
  HOUSE_RELATED_GAP_CLASS,
  HOUSE_SCROLL_ROW_CLASS,
} from "@/lib/house-shell";

export const HOUSE_CHIP_RAIL_ROWS = 2;

export const HOUSE_CHIP_RAIL_CLASS = HOUSE_SCROLL_ROW_CLASS;

export const HOUSE_CHIP_RAIL_STACK_CLASS = `flex w-max flex-col ${HOUSE_RELATED_GAP_CLASS}`;

export const HOUSE_CHIP_RAIL_ROW_CLASS = HOUSE_FILTER_PILL_CLUSTER_CLASS;

export const HOUSE_CHIP_RAIL_CHIP_CLASS =
  `${HOUSE_FILTER_PILL_CLASS} ${HOUSE_FILTER_OFF_CLASS} inline-flex shrink-0 items-center whitespace-nowrap`;

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
