// Period presets: desktop house SegmentedTrack SoT + phone
// HousePageSelect (Dashboard All time SoT). Selected ink is the
// track visual index — same SoT as workspace and Activity chips.
// Phone is one trigger — Month must not sit alone on a second line.
// Home Revenue consumes this. Do not fork a Home-only chip row.

import { houseExactHref, houseHomePeriodHop } from "@/lib/house-client-shell";

export type HousePeriodPresetItem = {
  key: string;
  label: string;
  href: string;
};

/**
 * Owned Home `?period=` wins over the RSC seed so the chip flips in
 * the click. The document hop listener stops the track click, so
 * persist-on-click is not the selection. Before the shell owns the
 * address, keep the seed.
 */
export function resolveHousePeriodPresetKey(input: {
  seed: string;
  owned: boolean;
  currentHref: string;
  nextHref: string;
  items: readonly Pick<HousePeriodPresetItem, "key" | "href">[];
}): string {
  if (!input.owned) return input.seed;
  if (!houseHomePeriodHop(input.nextHref, input.currentHref)) return input.seed;
  const match = input.items.find(
    (item) => houseExactHref(item.href) === houseExactHref(input.currentHref),
  );
  return match?.key ?? input.seed;
}

/** Phone-only HousePageSelect host. Hidden from md up. */
export const HOUSE_PERIOD_PRESETS_PHONE_CLASS = "md:hidden";

export const HOUSE_PERIOD_PRESETS_HOST_CLASS = "min-w-0";
