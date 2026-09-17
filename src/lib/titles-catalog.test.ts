import { describe, expect, it } from "vitest";

import { HOUSE_FILTER_ON_CLASS } from "@/lib/house-shell";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import { DASHBOARD_HOME } from "./dashboard-home";
import {
  CATALOG_LIFECYCLE_STATES,
  CATALOG_STATUS_FILTERS,
  TITLE_STATUS_PILL_IDLE_CLASS,
  TITLE_STATUS_PILL_LIVE_CLASS,
  TITLES_CATALOG,
  catalogCountLabel,
  catalogCountValue,
  catalogFilterHref,
  catalogReleaseYear,
  catalogStatusMark,
  catalogStatusPillClass,
  catalogStillSrc,
  filterCatalogByStatus,
  parseCatalogStatusFilter,
} from "./titles-catalog";

const ALL_STATES: TitleStatus[] = [
  "draft",
  "submitted",
  "in_review",
  "in_delivery",
  "live",
  "takedown_requested",
  "taken_down",
];

describe("catalog lifecycle", () => {
  it("keeps every existing title.status on one catalog list", () => {
    expect([...CATALOG_LIFECYCLE_STATES]).toEqual(ALL_STATES);
    const list = ALL_STATES.map((status) => ({ id: status, status }));
    expect(list.map((row) => row.status)).toEqual(ALL_STATES);
    expect(list).toHaveLength(7);
  });

  it("surfaces founder-decided labels for each existing status", () => {
    for (const status of ALL_STATES) {
      expect(catalogStatusMark(status)).toBe(TITLE_STATUS_LABELS[status]);
    }
    expect(catalogStatusMark("draft")).toBe("Draft");
    expect(catalogStatusMark("submitted")).toBe("Submitted");
    expect(catalogStatusMark("in_review")).toBe("In review");
    expect(catalogStatusMark("in_delivery")).toBe("Submitted");
    expect(catalogStatusMark("live")).toBe("Live");
    expect(catalogStatusMark("takedown_requested")).toBe("Takedown requested");
    expect(catalogStatusMark("taken_down")).toBe("Taken down");
    expect(ALL_STATES.map(catalogStatusMark)).not.toContain("Delivered");
    const unique = [...new Set(ALL_STATES.map(catalogStatusMark))];
    expect(unique).toEqual([
      "Draft",
      "Submitted",
      "In review",
      "Live",
      "Takedown requested",
      "Taken down",
    ]);
    expect(unique).toHaveLength(6);
  });

  it("does not invent a status or a second catalog label", () => {
    expect(CATALOG_LIFECYCLE_STATES).not.toContain("upcoming");
    expect(CATALOG_LIFECYCLE_STATES).not.toContain("in_progress");
    expect(CATALOG_LIFECYCLE_STATES).not.toContain("approved");
    expect(Object.values(TITLES_CATALOG)).not.toContain("Drafts");
  });
});

describe("catalogStillSrc", () => {
  it("uses the landscape banner and returns null when it is missing", () => {
    expect(catalogStillSrc("https://cdn/banner.jpg")).toBe("https://cdn/banner.jpg");
    expect(catalogStillSrc(null)).toBeNull();
    expect(catalogStillSrc(undefined)).toBeNull();
    expect(catalogStillSrc("")).toBeNull();
  });
});

describe("catalogReleaseYear", () => {
  it("returns the calendar year from titles.release_date", () => {
    expect(catalogReleaseYear("2019-05-01")).toBe("2019");
    expect(catalogReleaseYear("2026-12-31")).toBe("2026");
  });

  it("omits a year when release_date is null or not a calendar date", () => {
    expect(catalogReleaseYear(null)).toBeNull();
    expect(catalogReleaseYear(undefined)).toBeNull();
    expect(catalogReleaseYear("")).toBeNull();
    expect(catalogReleaseYear("2019")).toBeNull();
    expect(catalogReleaseYear("2019-05")).toBeNull();
    expect(catalogReleaseYear("May 2019")).toBeNull();
    expect(catalogReleaseYear("2026-08-10T00:00:00Z")).toBeNull();
  });
});

describe("Add Title copy", () => {
  it("keeps Add Title on the catalog", () => {
    expect(TITLES_CATALOG.addTitle).toBe("Add Title");
    expect(TITLES_CATALOG.title).toBe("Titles");
    expect(TITLES_CATALOG.searchPlaceholder).toBe("Search titles...");
  });

  it("keeps empty catalog copy aligned with home and a quieter ops empty line", () => {
    expect(TITLES_CATALOG.empty).toBe("No titles yet.");
    expect(TITLES_CATALOG.emptyCatalog).toBe("The catalog is empty.");
    expect(TITLES_CATALOG.emptyCatalog).toBe(DASHBOARD_HOME.catalogEmpty);
    expect(TITLES_CATALOG.emptyCatalog).not.toBe(TITLES_CATALOG.empty);
    expect(TITLES_CATALOG.emptyCatalog).not.toBe(TITLES_CATALOG.emptyCanOperate);
  });
});

describe("catalog status pills", () => {
  it("keeps greyscale ink pills and fills only Live", () => {
    expect(TITLE_STATUS_PILL_LIVE_CLASS).toBe(HOUSE_FILTER_ON_CLASS);
    expect(catalogStatusPillClass("live")).toBe(HOUSE_FILTER_ON_CLASS);
    expect(catalogStatusPillClass("draft")).toBe(TITLE_STATUS_PILL_IDLE_CLASS);
    expect(catalogStatusPillClass("in_review")).toBe(TITLE_STATUS_PILL_IDLE_CLASS);
    expect(catalogStatusPillClass("taken_down")).toBe(TITLE_STATUS_PILL_IDLE_CLASS);
    expect(catalogStatusPillClass("live")).not.toContain("bg-accent");
    expect(catalogStatusPillClass("draft")).not.toMatch(/green|red|emerald|rose/);
  });
});

describe("catalog status filter", () => {
  it("uses product-true labels and does not invent Upcoming or In progress", () => {
    expect(CATALOG_STATUS_FILTERS.map((f) => f.key)).toEqual([
      "all",
      "draft",
      "submitted",
      "in_review",
      "live",
      "takedown_requested",
      "taken_down",
    ]);
    expect(CATALOG_STATUS_FILTERS.map((f) => f.label)).not.toContain("Upcoming");
    expect(CATALOG_STATUS_FILTERS.map((f) => f.label)).not.toContain("In progress");
    expect(parseCatalogStatusFilter("draft")).toBe("draft");
    expect(parseCatalogStatusFilter("bogus")).toBe("all");
    expect(parseCatalogStatusFilter(undefined)).toBe("all");
  });

  it("groups submitted and in_delivery under Submitted", () => {
    const rows = ALL_STATES.map((status) => ({ id: status, status }));
    expect(filterCatalogByStatus(rows, "submitted").map((r) => r.status)).toEqual([
      "submitted",
      "in_delivery",
    ]);
    expect(filterCatalogByStatus(rows, "draft").map((r) => r.status)).toEqual(["draft"]);
    expect(filterCatalogByStatus(rows, "all")).toHaveLength(7);
  });

  it("preserves search when building a status href", () => {
    expect(catalogFilterHref("winter", "live")).toBe("/titles?q=winter&status=live");
    expect(catalogFilterHref("", "all")).toBe("/titles");
    expect(catalogFilterHref("  ", "draft")).toBe("/titles?status=draft");
  });
});

describe("catalog count chrome", () => {
  it("names the real count and marks a bounded read as a floor", () => {
    expect(catalogCountValue(7, false)).toBe("7");
    expect(catalogCountValue(200, true)).toBe("200+");
    expect(catalogCountLabel(7, false)).toBe("7 in catalog");
    expect(catalogCountLabel(200, true)).toBe("200+ in catalog");
    expect(catalogCountLabel(0, false)).toBe("0 in catalog");
    expect(catalogCountLabel(7, false)).not.toBe("10 in catalog");
  });
});
