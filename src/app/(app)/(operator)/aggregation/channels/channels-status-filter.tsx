"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { CHANNELS_HREF } from "@/lib/channel-card";
import { filterHref } from "@/lib/staff-directory";
import {
  CHANNELS_PAGE,
  VENDOR_DIRECTORY_FILTERS,
  parseVendorDirectoryFilter,
  vendorDirectoryFilterLabel,
  type VendorDirectoryFilter,
} from "@/lib/vendors-directory";

// Channels status lens — house-page-select consumer (Dashboard All time SoT).
// Trailing on PageHeader like Titles status / Dashboard period.
// Visible at every breakpoint. No chip-strip filter on this page.

export function ChannelsStatusFilter({
  status,
  defaultOpen = false,
}: {
  status: VendorDirectoryFilter;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const currentLabel = vendorDirectoryFilterLabel(status);

  return (
    <div data-channels-status-compact="" className="w-auto shrink-0">
      <HousePageSelect
        value={status}
        label={currentLabel}
        options={VENDOR_DIRECTORY_FILTERS}
        ariaLabel={CHANNELS_PAGE.statusFilterLabel}
        sheetTitle={CHANNELS_PAGE.statusFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="end"
        onPick={(key) => {
          router.replace(filterHref(CHANNELS_HREF, parseVendorDirectoryFilter(key)), {
            scroll: false,
          });
        }}
        attrs={{
          current: { "data-channels-status-current": "" },
          trigger: { "data-channels-status-trigger": "" },
          menu: { "data-channels-status-menu": "" },
          sheet: { "data-channels-status-sheet": "" },
          option: (key) => ({ "data-channels-status-option": key }),
        }}
      />
    </div>
  );
}
