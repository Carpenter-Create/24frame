import { describe, expect, it, vi } from "vitest";

import {
  CLIENT_CATALOG_PREFIX,
  OPS_CATALOG_PREFIX,
  firstTitleMatch,
  isCanonicalTitleSlug,
  isCanonicalUuid,
  opsCatalogId,
  publicCatalogId,
  titleClientPath,
  titleRouteLookups,
} from "./title-public-id";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("public / ops catalog prefix split", () => {
  it("swaps GC- and 24F- on the same digit suffix", () => {
    expect(publicCatalogId("GC-0001234")).toBe("24F-0001234");
    expect(opsCatalogId("24F-0001234")).toBe("GC-0001234");
    expect(publicCatalogId("24F-0001234")).toBe("24F-0001234");
    expect(opsCatalogId("GC-0001234")).toBe("GC-0001234");
    expect(CLIENT_CATALOG_PREFIX).toBe("24F");
    expect(OPS_CATALOG_PREFIX).toBe("GC");
  });

  it("preserves the stored digit width and ignores case", () => {
    expect(publicCatalogId("gc-0000042")).toBe("24F-0000042");
    expect(publicCatalogId("24f-7")).toBe("24F-7");
    expect(opsCatalogId("  24F-0001234  ")).toBe("GC-0001234");
  });

  it("does not invent a public id from a UUID or empty value", () => {
    expect(publicCatalogId(UUID)).toBeNull();
    expect(publicCatalogId(null)).toBeNull();
    expect(publicCatalogId("")).toBeNull();
    expect(publicCatalogId("not-an-id")).toBeNull();
  });
});

describe("titleClientPath", () => {
  it("builds /titles/24F-####### and never a UUID path", () => {
    expect(titleClientPath("GC-0001234")).toBe("/aggregation/titles/24F-0001234");
    expect(titleClientPath("GC-0001234", "/metadata")).toBe("/aggregation/titles/24F-0001234/metadata");
    expect(titleClientPath(UUID)).toBe("/aggregation/titles");
    expect(titleClientPath(null)).toBe("/aggregation/titles");
    expect(titleClientPath(UUID)).not.toContain(UUID);
  });

  it("treats only the exact 24F- slug as canonical", () => {
    expect(isCanonicalTitleSlug("24F-0001234", "GC-0001234")).toBe(true);
    expect(isCanonicalTitleSlug("24f-0001234", "GC-0001234")).toBe(false);
    expect(isCanonicalTitleSlug("GC-0001234", "GC-0001234")).toBe(false);
    expect(isCanonicalTitleSlug("0001234", "GC-0001234")).toBe(false);
    expect(isCanonicalTitleSlug(UUID, "GC-0001234")).toBe(false);
    expect(isCanonicalTitleSlug("24F-0001234", null)).toBe(false);
  });
});

describe("titleRouteLookups", () => {
  it("accepts 24F-, GC-, bare digits, and a legacy UUID", () => {
    expect(titleRouteLookups("24F-0001234")).toEqual([
      { field: "catalog_id", value: "GC-0001234" },
      { field: "catalog_no", value: 1234 },
    ]);
    expect(titleRouteLookups("GC-0001234")).toEqual([
      { field: "catalog_id", value: "GC-0001234" },
      { field: "catalog_no", value: 1234 },
    ]);
    expect(titleRouteLookups("0001234")).toEqual([
      { field: "catalog_id", value: "GC-0001234" },
      { field: "catalog_no", value: 1234 },
    ]);
    expect(titleRouteLookups("1234")).toEqual([
      { field: "catalog_id", value: "GC-1234" },
      { field: "catalog_no", value: 1234 },
    ]);
    expect(titleRouteLookups(UUID)).toEqual([{ field: "id", value: UUID }]);
    expect(titleRouteLookups(UUID.toUpperCase())).toEqual([{ field: "id", value: UUID }]);
  });

  it("trims pasted input and rejects junk", () => {
    expect(titleRouteLookups("  24F-0001234  ")?.[0]).toEqual({
      field: "catalog_id",
      value: "GC-0001234",
    });
    expect(titleRouteLookups("")).toBeNull();
    expect(titleRouteLookups("   ")).toBeNull();
    expect(titleRouteLookups("title-draft")).toBeNull();
    expect(titleRouteLookups("24F-")).toBeNull();
    expect(titleRouteLookups("24F-abc")).toBeNull();
    expect(isCanonicalUuid(UUID)).toBe(true);
    expect(isCanonicalUuid("not-a-uuid")).toBe(false);
  });
});

describe("firstTitleMatch", () => {
  it("returns the catalog_id hit and does not continue to catalog_no", async () => {
    const lookup = vi.fn(async (filter: { field: string }) =>
      filter.field === "catalog_id" ? { id: "hit" } : { id: "nope" },
    );
    await expect(firstTitleMatch(lookup, "24F-0001234")).resolves.toEqual({ id: "hit" });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith({ field: "catalog_id", value: "GC-0001234" });
  });

  it("falls through to catalog_no when the padded catalog_id misses", async () => {
    const lookup = vi.fn(async (filter: { field: string; value: string | number }) =>
      filter.field === "catalog_no" && filter.value === 1234 ? { id: "by-no" } : null,
    );
    await expect(firstTitleMatch(lookup, "1234")).resolves.toEqual({ id: "by-no" });
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenNthCalledWith(1, { field: "catalog_id", value: "GC-1234" });
    expect(lookup).toHaveBeenNthCalledWith(2, { field: "catalog_no", value: 1234 });
  });

  it("resolves a legacy UUID path in one lookup", async () => {
    const lookup = vi.fn(async () => ({ id: UUID }));
    await expect(firstTitleMatch(lookup, UUID)).resolves.toEqual({ id: UUID });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith({ field: "id", value: UUID });
  });

  it("returns null for an unparseable slug without calling through", async () => {
    const lookup = vi.fn();
    await expect(firstTitleMatch(lookup, "not-a-ref")).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });
});
