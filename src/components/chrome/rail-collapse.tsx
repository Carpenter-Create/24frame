"use client";

import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";

import {
  RAIL_COLLAPSE_CHEVRON,
  RAIL_COLLAPSE_CHEVRON_CLASS,
  RAIL_COLLAPSE_EXPAND_ROW_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT,
} from "@/lib/rail-collapse";

// One house collapse control. Aggregation · Education · Social all mount
// this — do not invent a Social-only sticker chevron.
export function RailCollapse({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (!collapsed) {
    return (
      <div className="flex justify-end px-2 pt-1">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          aria-pressed={false}
          data-rail-collapse={RAIL_COLLAPSE_CHEVRON}
          className={RAIL_COLLAPSE_CHEVRON_CLASS}
        >
          <CaretDoubleLeft
            className={RAIL_COLLAPSE_CHEVRON_ICON_CLASS}
            weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={RAIL_COLLAPSE_EXPAND_ROW_CLASS}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Expand sidebar"
        title="Expand sidebar"
        aria-pressed={true}
        data-rail-collapse={RAIL_COLLAPSE_CHEVRON}
        className={RAIL_COLLAPSE_CHEVRON_CLASS}
      >
        <CaretDoubleRight
          className={RAIL_COLLAPSE_CHEVRON_ICON_CLASS}
          weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}
        />
      </button>
    </div>
  );
}
