import Link from "next/link";
import { Store } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatusFilter } from "@/components/layout/status-filter";
import { StaffDirectoryList } from "@/components/staff/staff-directory-list";
import { UNPAGINATED_MAX, rangeFor, splitProbe } from "@/lib/list-bounds";
import {
  STAFF_DIRECTORY_EMPTY_CLASS,
  directoryCountLabel,
  filterHref,
  searchParamString,
} from "@/lib/staff-directory";
import { countLicensedTitlesByVendor } from "@/lib/vendor-profile";
import {
  VENDORS_PAGE,
  VENDOR_DIRECTORY_FILTERS,
  filterVendorDirectory,
  normalizeVendorDirectory,
  parseVendorDirectoryFilter,
  vendorDirectoryHref,
  vendorDirectoryMeta,
} from "@/lib/vendors-directory";

export default async function GcVendorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({}));
  const filter = parseVendorDirectoryFilter(searchParamString(sp.status));

  const supabase = await createClient();
  const [{ data: vendors }, deliveryProbe] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, delivery_mode, active")
      .order("name", { ascending: true })
      .range(...rangeFor(UNPAGINATED_MAX)),
    supabase
      .from("deliveries")
      .select("vendor_id, title_id, status")
      .range(...rangeFor(UNPAGINATED_MAX + 1)),
  ]);
  const { rows: deliveryRows, truncated: titlesTruncated } = splitProbe(
    deliveryProbe.data,
    UNPAGINATED_MAX,
  );
  const directory = normalizeVendorDirectory(vendors);
  const list = filterVendorDirectory(directory, filter);
  const titleCounts = countLicensedTitlesByVendor(deliveryRows);
  const emptyDirectory = directory.length === 0;

  const rows = list.map((vn) => {
    const titles = titleCounts.get(vn.id) ?? 0;
    return {
      id: vn.id,
      name: vn.name,
      secondary: vendorDirectoryMeta(vn),
      trailing:
        titles > 0
          ? directoryCountLabel(titles, "title", "titles", titlesTruncated)
          : null,
      href: vendorDirectoryHref(vn),
    };
  });

  return (
    <>
      <PageHeader
        title={VENDORS_PAGE.title}
        subtitle={VENDORS_PAGE.identity}
        actions={
          emptyDirectory ? undefined : (
            <Link
              href={VENDORS_PAGE.addHref}
              data-vendors-add=""
              className="t-body-sm text-accent transition-colors hover:underline"
            >
              {VENDORS_PAGE.addVendor}
            </Link>
          )
        }
      />

      <div data-vendors-address-book="">
        <StaffDirectoryList
          rows={rows}
          countLabel={directoryCountLabel(rows.length, "vendor", "vendors")}
          filters={
            <StatusFilter
              current={filter}
              options={[...VENDOR_DIRECTORY_FILTERS]}
              hrefFor={(key) => filterHref("/vendors", key)}
            />
          }
          empty={
            emptyDirectory ? (
              <div
                data-vendors-empty=""
                className="flex flex-col items-center gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-12)] text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-surface text-ink-3">
                  <Store className="size-6" strokeWidth={1.33} />
                </span>
                <p className="t-body font-medium text-ink">{VENDORS_PAGE.emptyTitle}</p>
                <Link
                  href={VENDORS_PAGE.addHref}
                  data-vendors-add=""
                  className="t-body-sm text-accent transition-colors hover:underline"
                >
                  {VENDORS_PAGE.addVendor}
                </Link>
              </div>
            ) : (
              <p data-vendors-filter-miss="" className={STAFF_DIRECTORY_EMPTY_CLASS}>
                {VENDORS_PAGE.filterMiss}
              </p>
            )
          }
        />
      </div>
    </>
  );
}
