import { describe, expect, it } from "vitest";

import { ACTIVE_DELIVERY_STATUSES_LIST } from "@/lib/master-licence";
import {
  asVendorDeliveryPlacement,
  asVendorProfileRecord,
  channelCompanyRailFields,
  channelOverviewText,
  channelTerritories,
  countLicensedTitlesByVendor,
  isLicensedDeliveryStatus,
  vendorCompanyFields,
  vendorEditHref,
  vendorKnownFields,
  vendorLicensedTitles,
} from "./vendor-profile";

describe("vendor licensed-title catalog SoT", () => {
  it("treats pending/delivered/live deliveries as licensed — same list as master-licence", () => {
    expect(ACTIVE_DELIVERY_STATUSES_LIST.every(isLicensedDeliveryStatus)).toBe(true);
    expect(isLicensedDeliveryStatus("rejected")).toBe(false);
    expect(isLicensedDeliveryStatus("taken_down")).toBe(false);
  });

  it("counts unique licensed titles per vendor and ignores rejected rows", () => {
    const counts = countLicensedTitlesByVendor([
      { vendor_id: "v1", title_id: "t1", status: "pending" },
      { vendor_id: "v1", title_id: "t1", status: "live" },
      { vendor_id: "v1", title_id: "t2", status: "delivered" },
      { vendor_id: "v1", title_id: "t3", status: "rejected" },
      { vendor_id: "v2", title_id: "t1", status: "live" },
    ]);
    expect(counts.get("v1")).toBe(2);
    expect(counts.get("v2")).toBe(1);
  });

  it("collapses placements into a title catalog with territory and status", () => {
    const catalog = vendorLicensedTitles([
      {
        titleId: "t2",
        title: "Winter Light",
        catalogId: "GC-2",
        territory: "CA",
        status: "pending",
      },
      {
        titleId: "t1",
        title: "Autumn Road",
        catalogId: "GC-1",
        territory: "US",
        status: "live",
      },
      {
        titleId: "t1",
        title: "Autumn Road",
        catalogId: "GC-1",
        territory: "GB",
        status: "live",
      },
      {
        titleId: "t3",
        title: "Gone",
        catalogId: "GC-3",
        territory: "US",
        status: "taken_down",
      },
    ]);
    expect(catalog.map((row) => row.title)).toEqual(["Autumn Road", "Winter Light"]);
    expect(catalog[0]).toMatchObject({
      titleId: "t1",
      href: "/titles/t1",
      secondary: "GC-1 · US, GB · Approved",
    });
    expect(catalog[1]?.secondary).toBe("GC-2 · CA · Pending");
  });
});

describe("vendor profile fields", () => {
  it("keeps edit on a dedicated route under the profile", () => {
    expect(vendorEditHref("11111111-1111-4111-8111-111111111111")).toBe(
      "/channels/11111111-1111-4111-8111-111111111111/edit",
    );
  });

  it("accepts a real vendor row and known fields only", () => {
    const row = asVendorProfileRecord({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Acme Distribution",
      delivery_mode: "email",
      active: true,
      email_to: ["ops@vendor.example"],
      email_cc: [],
      email_template: "Please collect the package.",
      company_info: { region: "US" },
    });
    expect(row?.name).toBe("Acme Distribution");
    expect(vendorKnownFields(row!)).toEqual([
      { label: "Delivery mode", value: "Email" },
      { label: "Status", value: "Active" },
      { label: "Email recipients", value: "ops@vendor.example" },
      { label: "Email template", value: "Please collect the package." },
    ]);
    expect(vendorCompanyFields(row!.companyInfo)).toEqual([{ label: "region", value: "US" }]);
  });

  it("reads a delivery join without inventing a title", () => {
    expect(
      asVendorDeliveryPlacement({
        title_id: "t1",
        territory: "US",
        status: "live",
        titles: { title: "Autumn Road", catalog_id: "GC-1" },
      }),
    ).toEqual({
      titleId: "t1",
      title: "Autumn Road",
      catalogId: "GC-1",
      territory: "US",
      status: "live",
    });
    expect(asVendorDeliveryPlacement({ title_id: "t1", territory: "US", status: "live" })).toBeNull();
  });

  it("reads overview and territories from real fields only", () => {
    expect(channelOverviewText({ description: "Independent stories." })).toBe(
      "Independent stories.",
    );
    expect(channelOverviewText({ region: "US" })).toBeNull();
    expect(channelCompanyRailFields({ region: "US", description: "Hide me" })).toEqual([
      { label: "region", value: "US" },
    ]);
    expect(
      channelTerritories([
        { titleId: "t1", title: "Autumn Road", catalogId: "GC-1", territory: "ca", status: "live" },
        { titleId: "t1", title: "Autumn Road", catalogId: "GC-1", territory: "US", status: "live" },
      ]),
    ).toEqual([
      { code: "CA", label: "Canada" },
      { code: "US", label: "United States" },
    ]);
  });
});
