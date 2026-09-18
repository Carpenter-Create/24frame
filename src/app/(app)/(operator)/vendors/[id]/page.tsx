import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StaffDirectoryRow } from "@/components/staff/staff-directory-row";
import {
  StaffDirectoryFields,
  StaffDirectorySection,
} from "@/components/staff/staff-directory-list";
import { UNPAGINATED_MAX, rangeFor, splitProbe } from "@/lib/list-bounds";
import {
  STAFF_DIRECTORY_COPY_CLASS,
  STAFF_DIRECTORY_NAME_CLASS,
  STAFF_DIRECTORY_ROW_CLASS,
  STAFF_DIRECTORY_SECONDARY_CLASS,
  STAFF_DIRECTORY_STACK_CLASS,
  STAFF_DIRECTORY_SURFACE_CLASS,
} from "@/lib/staff-directory";
import { VENDORS_PAGE, vendorDirectoryMeta } from "@/lib/vendors-directory";
import {
  VENDOR_PROFILE,
  asVendorDeliveryPlacement,
  asVendorProfileRecord,
  vendorCompanyFields,
  vendorEditHref,
  vendorKnownFields,
  vendorLicensedTitles,
} from "@/lib/vendor-profile";

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vn }, deliveryProbe] = await Promise.all([
    supabase
      .from("vendors")
      .select(
        "id, name, delivery_mode, email_to, email_cc, email_template, company_info, active",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("deliveries")
      .select("title_id, territory, status, titles(title, catalog_id)")
      .eq("vendor_id", id)
      .range(...rangeFor(UNPAGINATED_MAX + 1)),
  ]);
  const vendor = asVendorProfileRecord(vn);
  if (!vendor) notFound();

  const { rows: deliveryRows, truncated } = splitProbe(deliveryProbe.data, UNPAGINATED_MAX);
  const placements = deliveryRows
    .map(asVendorDeliveryPlacement)
    .filter((row): row is NonNullable<typeof row> => row !== null);
  const catalog = vendorLicensedTitles(placements);
  const known = vendorKnownFields(vendor);
  const extra = vendorCompanyFields(vendor.companyInfo);

  return (
    <>
      <PageHeader
        title={vendor.name}
        subtitle={vendorDirectoryMeta(vendor)}
        backLink={{ href: "/vendors", label: VENDORS_PAGE.title }}
        actions={
          <Link
            href={vendorEditHref(vendor.id)}
            className="t-body-sm text-accent transition-colors hover:underline"
          >
            {VENDOR_PROFILE.editVendor}
          </Link>
        }
      />

      <div data-vendor-profile="" className={STAFF_DIRECTORY_STACK_CLASS}>
        <div data-vendor-profile-identity="" className={STAFF_DIRECTORY_SURFACE_CLASS}>
          <StaffDirectoryRow
            row={{
              id: vendor.id,
              name: vendor.name,
              secondary: vendorDirectoryMeta(vendor),
              trailing: vendor.active ? "Active" : "Inactive",
            }}
          />
        </div>

        <StaffDirectorySection title={VENDOR_PROFILE.infoTitle}>
          <StaffDirectoryFields fields={known} />
        </StaffDirectorySection>

        <StaffDirectorySection
          title={VENDOR_PROFILE.reservedTitle}
          empty={extra.length === 0 ? VENDOR_PROFILE.reservedEmpty : undefined}
        >
          {extra.length > 0 ? <StaffDirectoryFields fields={extra} /> : undefined}
        </StaffDirectorySection>

        {truncated ? (
          <InlineNotice tone="error">
            {VENDOR_PROFILE.catalogTruncated(String(UNPAGINATED_MAX))}
          </InlineNotice>
        ) : null}

        <StaffDirectorySection
          title={VENDOR_PROFILE.catalogTitle}
          empty={catalog.length === 0 ? VENDOR_PROFILE.catalogEmpty : undefined}
        >
          {catalog.length > 0 ? (
            <ul data-vendor-licensed-catalog="">
              {catalog.map((title) => (
                <li key={title.titleId} className="border-b border-hairline last:border-b-0">
                  <Link href={title.href} className={`${STAFF_DIRECTORY_ROW_CLASS} hover:bg-surface/70`}>
                    <span className={STAFF_DIRECTORY_COPY_CLASS}>
                      <span className={STAFF_DIRECTORY_NAME_CLASS}>{title.title}</span>
                      {title.secondary ? (
                        <span className={STAFF_DIRECTORY_SECONDARY_CLASS}>{title.secondary}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : undefined}
        </StaffDirectorySection>
      </div>
    </>
  );
}
