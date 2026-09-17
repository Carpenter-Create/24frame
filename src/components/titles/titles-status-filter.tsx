"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  CATALOG_STATUS_FILTERS,
  TITLES_CATALOG,
  catalogFilterHref,
  catalogStatusFilterLabel,
  type CatalogStatusFilter,
} from "@/lib/titles-catalog";

// Titles status lens — house-page-select consumer (Dashboard All time SoT).
// Not a full-bleed native <select>, not a wrapping chip wall on phone.

export function TitlesCatalogStatusFilter({
  q,
  status,
  defaultOpen = false,
}: {
  q: string;
  status: CatalogStatusFilter;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const currentLabel = catalogStatusFilterLabel(status);

  return (
    <div data-titles-catalog-status-compact="" className="w-auto shrink-0">
      <HousePageSelect
        value={status}
        label={currentLabel}
        options={CATALOG_STATUS_FILTERS}
        ariaLabel={TITLES_CATALOG.statusFilterLabel}
        sheetTitle={TITLES_CATALOG.statusFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="start"
        triggerClassName="min-w-0 w-auto max-md:justify-start"
        onPick={(key) => {
          router.replace(catalogFilterHref(q, key as CatalogStatusFilter), {
            scroll: false,
          });
        }}
        attrs={{
          current: { "data-titles-catalog-status-current": "" },
          trigger: { "data-titles-catalog-status-trigger": "" },
          menu: { "data-titles-catalog-status-menu": "" },
          sheet: { "data-titles-catalog-status-sheet": "" },
          option: (key) => ({ "data-titles-catalog-status-option": key }),
        }}
      />
    </div>
  );
}
