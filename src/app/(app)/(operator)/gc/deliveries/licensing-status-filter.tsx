"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  DELIVERY_STATUS_FILTERS,
  GC_LICENSING_STATUS,
  deliveryStatusFilterLabel,
  gcLicensingHref,
  parseDeliveryStatusFilter,
  type DeliveryStatusFilter,
} from "@/lib/gc-deliveries";

// Status lens — house-page-select consumer (Dashboard All time / Titles SoT).
// Trailing on TitlesCatalogHeader at every breakpoint. No StatusFilter chips.

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
  const currentLabel = deliveryStatusFilterLabel(status);

  return (
    <div data-gc-licensing-status-compact="" className="w-auto shrink-0">
      <HousePageSelect
        value={status}
        label={currentLabel}
        options={DELIVERY_STATUS_FILTERS}
        ariaLabel={GC_LICENSING_STATUS.statusFilterLabel}
        sheetTitle={GC_LICENSING_STATUS.statusFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="end"
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
