"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  DELIVERY_STATUS_FILTERS,
  GC_LICENSING_STATUS,
  gcLicensingHref,
  parseDeliveryStatusFilter,
  type DeliveryStatusFilter,
} from "@/lib/gc-deliveries";

// Phone status lens — Dashboard All time HousePageSelect. Desktop keeps
// StatusFilter chips. Do not invent a Licensing-only mobile menu.

export function LicensingStatusFilter({
  status,
  vendor,
  q = "",
  defaultOpen = false,
}: {
  status: DeliveryStatusFilter;
  vendor: string | null;
  q?: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const current =
    DELIVERY_STATUS_FILTERS.find((option) => option.key === status)?.label ??
    DELIVERY_STATUS_FILTERS[0].label;

  return (
    <div data-gc-licensing-status-compact="" className="w-auto min-w-0 md:hidden">
      <HousePageSelect
        value={status}
        label={current}
        options={DELIVERY_STATUS_FILTERS}
        ariaLabel={GC_LICENSING_STATUS.statusFilterLabel}
        sheetTitle={GC_LICENSING_STATUS.statusFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="start"
        onPick={(key) => {
          router.replace(gcLicensingHref(parseDeliveryStatusFilter(key), vendor, q), {
            scroll: false,
          });
        }}
        attrs={{
          current: { "data-gc-licensing-status-current": "" },
          trigger: { "data-gc-licensing-status-trigger": "" },
          menu: { "data-gc-licensing-status-menu": "" },
          sheet: { "data-gc-licensing-status-sheet": "" },
          option: (key) => ({ "data-gc-licensing-status-option": key }),
        }}
      />
    </div>
  );
}
