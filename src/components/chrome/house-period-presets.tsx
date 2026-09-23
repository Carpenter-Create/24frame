"use client";

// Shared period-preset chrome. Desktop: house SegmentedTrack SoT.
// Selected ink follows track visualIndex (persists across Home
// `?period=` Suspense remounts). Phone: HousePageSelect (Dashboard
// All time SoT). Never a wrapping chip row. Home Revenue uses
// this. Do not invent a second grammar or a local pending fork.

import { HouseLink } from "./house-link";
import { useHouseClient } from "./house-client-shell";
import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";
import { houseExactHref } from "@/lib/house-client-shell";
import {
  HOUSE_PERIOD_PRESETS_HOST_CLASS,
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
  resolveHousePeriodPresetKey,
  type HousePeriodPresetItem,
} from "@/lib/house-period-presets";
import { SEGMENTED_TRACK_PERSIST, segmentedItemOn } from "@/lib/segmented-track";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";

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
  const house = useHouseClient();
  const owned = house
    ? houseExactHref(house.href) !== houseExactHref(`${house.nextPathname}${house.nextSearch}`)
    : false;
  const selected = resolveHousePeriodPresetKey({
    seed: value,
    owned,
    currentHref: house?.href ?? "",
    nextHref: house ? `${house.nextPathname}${house.nextSearch}` : "",
    items,
  });
  const current = items.find((item) => item.key === selected);

  function go(key: string) {
    const item = items.find((row) => row.key === key);
    if (!item) return;
    if (house?.navigateOwned(item.href)) return;
    router.push(item.href, { scroll: false });
  }

  return (
    <div data-house-period-presets="" className={HOUSE_PERIOD_PRESETS_HOST_CLASS}>
      <SegmentedTrack
        activeIndex={items.findIndex((item) => item.key === selected)}
        persistKey={SEGMENTED_TRACK_PERSIST.period}
        trackClass={cn(HOUSE_SEGMENTED_TRACK_CLASS, "hidden md:flex")}
        thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}
        data-house-period-presets-chips=""
      >
        {({ selectedIndex }) =>
          items.map((item, index) => {
            const on = segmentedItemOn(index, selectedIndex);
            return (
              <HouseLink
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
              </HouseLink>
            );
          })
        }
      </SegmentedTrack>
      <div
        data-house-period-presets-phone=""
        className={HOUSE_PERIOD_PRESETS_PHONE_CLASS}
      >
        <HousePageSelect
          value={selected}
          label={current?.label ?? selected}
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
