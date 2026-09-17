"use client";

import { Suspense } from "react";

import { SearchField } from "@/components/layout/search-field";
import { TITLES_CATALOG } from "@/lib/titles-catalog";

// Phone catalog search lives in the app header, not on the page list and not
// in shared chrome on `/` or desktop. Desktop search stays on the catalog
// operate bar.

export function TitlesHeaderSearch() {
  return (
    <div className="min-w-0 flex-1 md:hidden" data-titles-header-search="">
      <Suspense fallback={null}>
        <SearchField placeholder={TITLES_CATALOG.searchPlaceholder} />
      </Suspense>
    </div>
  );
}
