import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CHANNELS_PAGE,
  VENDOR_FORM_FIELD_LABELS,
  asVendorDirectoryRow,
  channelCardTags,
  filterVendorDirectory,
  normalizeVendorDirectory,
  parseVendorDirectoryFilter,
  vendorDirectoryFilterLabel,
  vendorDirectoryHref,
  vendorDirectoryMeta,
} from "./vendors-directory";

describe("CHANNELS_PAGE lock copy", () => {
  it("keeps the identity line and empty address-book copy", () => {
    expect(CHANNELS_PAGE.title).toBe("Channels");
    expect(CHANNELS_PAGE.identity).toBe("Credentials are never stored here.");
    expect(CHANNELS_PAGE.emptyTitle).toBe("No channels yet");
    expect(CHANNELS_PAGE.filterMiss).toBe("No channels match this filter.");
    expect(CHANNELS_PAGE).not.toHaveProperty("emptySupport");
    expect(CHANNELS_PAGE.addChannel).toBe("Add channel");
    expect(CHANNELS_PAGE.addHref).toBe("/channels/new");
    expect(CHANNELS_PAGE.statusFilterLabel).toBe("Filter by status");
    expect(JSON.stringify(CHANNELS_PAGE)).not.toContain("GC distribution partners.");
    expect(JSON.stringify(CHANNELS_PAGE)).not.toContain("Add your first partner.");
    expect(JSON.stringify(CHANNELS_PAGE)).not.toContain("Vendors");
    expect(JSON.stringify(CHANNELS_PAGE)).not.toContain("vendor");
  });

  it("lists the form fields that must not appear on the empty page", () => {
    expect(VENDOR_FORM_FIELD_LABELS).toEqual([
      "Name",
      "Delivery mode",
      "Email recipients (comma-separated)",
      "Email CC (comma-separated)",
      "Email template",
      "Company info (JSON, optional)",
      "Export format spec (JSON, optional)",
      "Active",
      "Save channel",
      "New channel",
    ]);
  });
});

describe("channel directory rows", () => {
  const real = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Acme Distribution",
    delivery_mode: "portal_upload",
    active: true,
  };

  it("accepts a real DB-shaped row and rejects junk", () => {
    expect(asVendorDirectoryRow(real)).toEqual({
      id: real.id,
      name: real.name,
      deliveryMode: "portal_upload",
      active: true,
    });
    expect(asVendorDirectoryRow(null)).toBeNull();
    expect(asVendorDirectoryRow({ ...real, name: "" })).toBeNull();
    expect(asVendorDirectoryRow({ ...real, delivery_mode: "ftp" })).toBeNull();
  });

  it("normalizes only real rows — no invented fixtures", () => {
    expect(normalizeVendorDirectory(null)).toEqual([]);
    expect(normalizeVendorDirectory([real, { id: "x" }])).toEqual([
      {
        id: real.id,
        name: real.name,
        deliveryMode: "portal_upload",
        active: true,
      },
    ]);
  });

  it("filters active and inactive without inventing rows", () => {
    const row = asVendorDirectoryRow(real);
    if (!row) throw new Error("expected row");
    const inactive = { ...row, active: false };
    expect(filterVendorDirectory([row, inactive], "active")).toEqual([row]);
    expect(filterVendorDirectory([row, inactive], "inactive")).toEqual([inactive]);
    expect(parseVendorDirectoryFilter("inactive")).toBe("inactive");
    expect(parseVendorDirectoryFilter("nope")).toBe("all");
    expect(vendorDirectoryFilterLabel("all")).toBe("All");
    expect(vendorDirectoryFilterLabel("active")).toBe("Active");
    expect(vendorDirectoryFilterLabel("inactive")).toBe("Inactive");
    for (const { label } of [
      { label: vendorDirectoryFilterLabel("all") },
      { label: vendorDirectoryFilterLabel("active") },
      { label: vendorDirectoryFilterLabel("inactive") },
    ]) {
      expect(label).not.toBe(label.toUpperCase());
    }
  });

  it("builds the channel href, meta, and real tags only", () => {
    const row = asVendorDirectoryRow(real);
    if (!row) throw new Error("expected row");
    expect(vendorDirectoryHref(row)).toBe(`/channels/${real.id}`);
    expect(vendorDirectoryMeta(row)).toBe("Portal upload");
    expect(
      vendorDirectoryMeta({
        ...row,
        deliveryMode: "email",
        active: false,
      }),
    ).toBe("Email · inactive");
    expect(channelCardTags(row)).toEqual([
      { label: "Portal upload", tone: "neutral" },
      { label: "Active", tone: "active" },
    ]);
    expect(channelCardTags({ ...row, deliveryMode: "email", active: false })).toEqual([
      { label: "Email", tone: "neutral" },
      { label: "Inactive", tone: "muted" },
    ]);
    expect(JSON.stringify(channelCardTags(row))).not.toMatch(/ACTION|ADVENTURE|genre/i);
  });
});

describe("shared EmptyState primitive stays the dashed 40-circle layout", () => {
  it("does not pick up the channels 48/24 hairline lock", () => {
    const src = readFileSync("src/components/layout/empty-state.tsx", "utf8");
    expect(src).toContain("border-dashed");
    expect(src).toContain("h-10 w-10");
    expect(src).toContain("h-5 w-5");
    expect(src).not.toContain("size-12");
    expect(src).not.toContain("size-6");
  });
});
