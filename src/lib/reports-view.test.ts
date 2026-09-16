import { describe, expect, it } from "vitest";

import { parseReportsPeriod } from "./reports";
import {
  filterReportsDeliveries,
  filterReportsTitles,
  reportsHasBody,
  reportsPlatformRows,
  reportsTerritoryRows,
} from "./reports-view";

const now = new Date("2026-09-16T12:00:00.000Z");

describe("reports view filters", () => {
  it("scopes titles by period and created_by without inventing rows", () => {
    const titles = [
      { id: "a", title: "A", status: "live", created_at: "2026-08-02T00:00:00.000Z", created_by: "u1" },
      { id: "b", title: "B", status: "draft", created_at: "2026-09-02T00:00:00.000Z", created_by: "u2" },
    ];
    expect(filterReportsTitles(titles, parseReportsPeriod("2026-08", now), null).map((t) => t.id)).toEqual([
      "a",
    ]);
    expect(filterReportsTitles(titles, parseReportsPeriod("all", now), "u2").map((t) => t.id)).toEqual([
      "b",
    ]);
  });

  it("keeps deliveries on real vendor/territory names", () => {
    const deliveries = [
      {
        delivery_id: "d1",
        title_id: "a",
        title: "A",
        vendor_name: "Alpha",
        territory: "US",
        updated_at: "2026-08-10T00:00:00.000Z",
      },
      {
        delivery_id: "d2",
        title_id: "b",
        title: "B",
        vendor_name: "Alpha",
        territory: "CA",
        updated_at: "2026-09-02T00:00:00.000Z",
      },
    ];
    const august = filterReportsDeliveries(deliveries, parseReportsPeriod("2026-08", now), null);
    expect(august.map((row) => row.delivery_id)).toEqual(["d1"]);
    expect(reportsPlatformRows(deliveries)).toEqual([{ name: "Alpha", count: 2 }]);
    expect(reportsTerritoryRows(deliveries)).toEqual([
      { name: "CA", count: 1 },
      { name: "US", count: 1 },
    ]);
    expect(reportsHasBody({ titles: [], deliveries: [], hasMoney: false })).toBe(false);
    expect(reportsHasBody({ titles, deliveries: [], hasMoney: false })).toBe(true);
  });
});
