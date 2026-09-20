import type { HTMLAttributes, ReactNode } from "react";

import {
  HOUSE_CHIP_RAIL_CLASS,
  HOUSE_CHIP_RAIL_ROW_CLASS,
  HOUSE_CHIP_RAIL_ROWS,
  HOUSE_CHIP_RAIL_STACK_CLASS,
  splitChipRailRows,
} from "@/lib/house-chip-rail";
import { cn } from "@/lib/cn";

export function HouseChipRail<T>({
  items,
  renderItem,
  rows = HOUSE_CHIP_RAIL_ROWS,
  className,
  ...hostProps
}: {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  rows?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  const lanes = splitChipRailRows(items, rows);
  if (lanes.length === 0) return null;

  return (
    <div
      {...hostProps}
      data-house-chip-rail=""
      className={cn(HOUSE_CHIP_RAIL_CLASS, className)}
    >
      <div data-house-chip-rail-stack="" className={HOUSE_CHIP_RAIL_STACK_CLASS}>
        {lanes.map((lane, row) => (
          <div
            key={row}
            data-house-chip-rail-row={row}
            className={HOUSE_CHIP_RAIL_ROW_CLASS}
          >
            {lane.map((item) => renderItem(item))}
          </div>
        ))}
      </div>
    </div>
  );
}
