import { describe, expect, it } from "vitest";

import { DELIVERY_STATUS_FILTERS } from "@/lib/deliveries-browse";
import { GC_NAV } from "@/lib/nav";

import {
  GC_DELIVERIES_EMPTY,
  GC_LICENSING_STATUS,
  GC_LICENSING_VENDOR_ALL,
  buildGcLicensingQuery,
  gcLicensingHasFilters,
  gcLicensingHref,
  gcLicensingShowAllHref,
  gcLicensingVendorLabel,
  gcLicensingVendorOptions,
  parseDeliveryStatusFilter,
  parseGcLicensingVendorFilter,
} from "./gc-deliveries";

const VENDOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("GC_LICENSING_STATUS copy", () => {
  it("locks staff nav, H1, and empty strings on Licensing Status", () => {
    expect(GC_LICENSING_STATUS.title).toBe("Licensing Status");
    expect(GC_LICENSING_STATUS.intro).toBe(
      "Licensing status across all clients. Status is set by hand.",
    );
    expect(GC_LICENSING_STATUS.empty).toBe("No licensing status yet.");
    expect(GC_DELIVERIES_EMPTY.title).toBe(GC_LICENSING_STATUS.empty);
    expect(GC_DELIVERIES_EMPTY.actionLabel).toBe("View titles");
    expect(GC_DELIVERIES_EMPTY.actionHref).toBe("/titles");
    expect(GC_NAV.find((item) => item.href === "/gc/deliveries")?.label).toBe(
      GC_LICENSING_STATUS.title,
    );
  });
});

describe("staff licensing filters", () => {
  it("reuses the live delivery-status enum SoT", () => {
    expect(DELIVERY_STATUS_FILTERS.map((f) => f.key)).toEqual([
      "all",
      "pending",
      "delivered",
      "live",
      "rejected",
      "taken_down",
    ]);
    expect(parseDeliveryStatusFilter("live")).toBe("live");
    expect(parseDeliveryStatusFilter("bogus")).toBe("all");
  });

  it("accepts a canonical vendor UUID and fail-closes everything else to all", () => {
    expect(parseGcLicensingVendorFilter(VENDOR_ID)).toBe(VENDOR_ID);
    expect(parseGcLicensingVendorFilter(VENDOR_ID.toUpperCase())).toBe(VENDOR_ID);
    expect(parseGcLicensingVendorFilter(GC_LICENSING_VENDOR_ALL)).toBeNull();
    expect(parseGcLicensingVendorFilter("")).toBeNull();
    expect(parseGcLicensingVendorFilter(undefined)).toBeNull();
    expect(parseGcLicensingVendorFilter("not-a-uuid")).toBeNull();
    expect(parseGcLicensingVendorFilter([VENDOR_ID])).toBeNull();
  });

  it("builds /gc/deliveries hrefs that preserve the other filter", () => {
    expect(buildGcLicensingQuery({ status: "all", vendor: null })).toBe("");
    expect(buildGcLicensingQuery({ status: "live", vendor: null })).toBe("?status=live");
    expect(buildGcLicensingQuery({ status: "all", vendor: VENDOR_ID })).toBe(
      `?vendor=${VENDOR_ID}`,
    );
    expect(gcLicensingHref("pending", VENDOR_ID)).toBe(
      `/gc/deliveries?status=pending&vendor=${VENDOR_ID}`,
    );
    expect(gcLicensingShowAllHref()).toBe("/gc/deliveries");
    expect(gcLicensingHasFilters("all", null)).toBe(false);
    expect(gcLicensingHasFilters("live", null)).toBe(true);
    expect(gcLicensingHasFilters("all", VENDOR_ID)).toBe(true);
  });

  it("labels the vendor select from the house All + named options", () => {
    const vendors = [
      { id: VENDOR_ID, name: "Acme Distribution" },
      { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Northwind" },
    ];
    expect(gcLicensingVendorOptions(vendors)).toEqual([
      { key: GC_LICENSING_VENDOR_ALL, label: "All" },
      { key: VENDOR_ID, label: "Acme Distribution" },
      { key: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", label: "Northwind" },
    ]);
    expect(gcLicensingVendorLabel(null, vendors)).toBe("All");
    expect(gcLicensingVendorLabel(VENDOR_ID, vendors)).toBe("Acme Distribution");
    expect(gcLicensingVendorLabel("cccccccc-cccc-4ccc-8ccc-cccccccccccc", vendors)).toBe("All");
  });
});
