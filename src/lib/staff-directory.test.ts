import { describe, expect, it } from "vitest";

import { HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import {
  STAFF_DIRECTORY_NAME_CLASS,
  STAFF_DIRECTORY_SURFACE_CLASS,
  directoryCountLabel,
  directoryInitials,
  filterHref,
  primitiveInfoFields,
} from "./staff-directory";

describe("staff directory primitive", () => {
  it("keeps the Circle row grammar on a Coinbase grey module", () => {
    expect(STAFF_DIRECTORY_SURFACE_CLASS).toBe(HOUSE_MODULE_CLASS);
    expect(STAFF_DIRECTORY_SURFACE_CLASS).toContain("bg-surface-muted");
    expect(STAFF_DIRECTORY_NAME_CLASS).toContain("font-semibold");
  });

  it("builds initials from company, person, or email without inventing a name", () => {
    expect(directoryInitials("Acme Distribution")).toBe("AD");
    expect(directoryInitials("Northwind")).toBe("NO");
    expect(directoryInitials("jane@acmefilms.com")).toBe("JA");
    expect(directoryInitials("kwame-adebayo@gmail.com")).toBe("KA");
    expect(directoryInitials("")).toBe("?");
  });

  it("labels a result count with honest truncation", () => {
    expect(directoryCountLabel(1, "vendor", "vendors")).toBe("1 vendor");
    expect(directoryCountLabel(12, "vendor", "vendors")).toBe("12 vendors");
    expect(directoryCountLabel(12, "title", "titles", true)).toBe("12+ titles");
  });

  it("drops the all-filter query string and keeps others", () => {
    expect(filterHref("/channels", "all")).toBe("/channels");
    expect(filterHref("/gc/clients", "active")).toBe("/gc/clients?status=active");
  });

  it("surfaces only primitive company_info keys for the extensible shell", () => {
    expect(
      primitiveInfoFields({
        region: "US",
        seats: 12,
        nested: { ignore: true },
        _: "skip-empty-label",
      }),
    ).toEqual([
      { label: "region", value: "US" },
      { label: "seats", value: "12" },
    ]);
    expect(primitiveInfoFields(["nope"])).toEqual([]);
    expect(primitiveInfoFields(null)).toEqual([]);
  });
});
