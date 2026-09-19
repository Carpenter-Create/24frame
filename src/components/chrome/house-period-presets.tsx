"use client";

// Shared period-preset chrome. Desktop: segmented track.
// Phone: HousePageSelect (Dashboard All time SoT). Never a wrapping
// chip row. Home Net revenue uses this — do not invent a second grammar.

import Link from "next/link";
import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import {
  HOUSE_PERIOD_PRESETS_HOST_CLASS,
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
  type HousePeriodPresetItem,
} from "@/lib/house-period-presets";

export type { HousePeriodPresetItem };

export function HousePeriodPresets({
  value,
  items,
  ariaLabel,
  sheetTitle,
  closeLabel = "Close",
  defaultOpen = false,
  menuAlign = "start",
  chipDataAttr,
}: {
  value: string;
  items: readonly HousePeriodPresetItem[];
  ariaLabel: string;
  sheetTitle?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  menuAlign?: "start" | "end";
  /** Serializable chip data-* name. Never a function — RSC cannot pass one here. */
  chipDataAttr?: string;
}) {
  const router = useRouter();
  const current = items.find((item) => item.key === value);

  function go(key: string) {
    const item = items.find((row) => row.key === key);
    if (!item) return;
    router.push(item.href);
  }

  return (
    <div data-house-period-presets="" className={HOUSE_PERIOD_PRESETS_HOST_CLASS}>
      <SegmentedTrack
        activeIndex={items.findIndex((item) => item.key === value)}
        trackClass={cn(HOUSE_SEGMENTED_TRACK_CLASS, "hidden md:flex")}
        thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}
        data-house-period-presets-chips=""
      >
        {items.map((item) => {
          const on = item.key === value;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-pressed={on}
              data-segmented-item=""
              data-house-period-presets-chip={item.key}
              className={cn(
                HOUSE_SEGMENTED_ITEM_BASE_CLASS,
                on ? HOUSE_SEGMENTED_ITEM_ON_CLASS : HOUSE_SEGMENTED_ITEM_OFF_CLASS,
              )}
              {...(chipDataAttr ? { [chipDataAttr]: item.key } : {})}
            >
              {item.label}
            </Link>
          );
        })}
      </SegmentedTrack>
      <div
        data-house-period-presets-phone=""
        className={HOUSE_PERIOD_PRESETS_PHONE_CLASS}
      >
        <HousePageSelect
          value={value}
          label={current?.label ?? value}
          options={items.map((item) => ({ key: item.key, label: item.label }))}
          ariaLabel={ariaLabel}
          sheetTitle={sheetTitle ?? ariaLabel}
          closeLabel={closeLabel}
          defaultOpen={defaultOpen}
          onPick={go}
          menuAlign={menuAlign}
        />
      </div>
    </div>
  );
}
