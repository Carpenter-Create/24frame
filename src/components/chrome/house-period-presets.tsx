"use client";

// Shared period-preset chrome. Desktop: Reports chip cluster.
// Phone: HousePageSelect (Dashboard All time SoT). Never a wrapping
// chip row. Home Net revenue uses this — do not invent a second grammar.

import Link from "next/link";
import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { cn } from "@/lib/cn";
import {
  HOUSE_PERIOD_PRESETS_CHIPS_CLASS,
  HOUSE_PERIOD_PRESETS_HOST_CLASS,
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
  type HousePeriodPresetItem,
} from "@/lib/house-period-presets";
import {
  REPORTS_PERIOD_CHIP_CLASS,
  REPORTS_PERIOD_CHIP_OFF_CLASS,
  REPORTS_PERIOD_CHIP_ON_CLASS,
} from "@/lib/reports-craft";

export type { HousePeriodPresetItem };

export function HousePeriodPresets({
  value,
  items,
  ariaLabel,
  sheetTitle,
  closeLabel = "Close",
  defaultOpen = false,
  menuAlign = "start",
  chipAttrs,
}: {
  value: string;
  items: readonly HousePeriodPresetItem[];
  ariaLabel: string;
  sheetTitle?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  menuAlign?: "start" | "end";
  chipAttrs?: (key: string) => Record<string, string | undefined>;
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
      <div
        data-house-period-presets-chips=""
        className={HOUSE_PERIOD_PRESETS_CHIPS_CLASS}
      >
        {items.map((item) => {
          const on = item.key === value;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-pressed={on}
              data-house-period-presets-chip={item.key}
              className={cn(
                REPORTS_PERIOD_CHIP_CLASS,
                on ? REPORTS_PERIOD_CHIP_ON_CLASS : REPORTS_PERIOD_CHIP_OFF_CLASS,
              )}
              {...chipAttrs?.(item.key)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
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
