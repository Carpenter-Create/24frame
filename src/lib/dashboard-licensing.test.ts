import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DASHBOARD_LICENSING,
  DASHBOARD_LICENSING_TITLE_CAP,
  buildLicensingStatus,
} from "./dashboard-licensing";

const titlesSrc = readFileSync("src/lib/dashboard-licensing.ts", "utf8");
const pageSrc = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");

function delivery(partial: {
  delivery_id: string;
  title_id: string;
  title: string;
  vendor_name: string;
  status: "pending" | "delivered" | "live" | "rejected" | "taken_down";
  updated_at: string;
  territory?: string;
}) {
  return {
    territory: partial.territory ?? "US",
    ...partial,
  };
}

describe("licensing nested title → endpoint", () => {
  it("locks composition copy and cap — no readiness buckets", () => {
    expect(DASHBOARD_LICENSING.title).toBe("Licensing status");
    expect(DASHBOARD_LICENSING.viewAllHref).toBe("/titles");
    expect(DASHBOARD_LICENSING.empty).toBe("No submissions yet.");
    expect(DASHBOARD_LICENSING_TITLE_CAP).toBe(3);
    expect(titlesSrc).not.toContain("Ready");
    expect(titlesSrc).not.toContain("Needs attention");
    expect(titlesSrc).not.toContain("In review");
    expect(titlesSrc).not.toContain("Licensed");
    expect(titlesSrc).not.toContain("Removed");
  });

  it("nests submitted endpoints under titles, newest titles first, capped", () => {
    const snapshot = buildLicensingStatus({
      titles: [
        { id: "t1", title: "Winter Light", catalog_id: "GC-0001234" },
        { id: "t2", title: "Harbor Cut", catalog_id: "GC-0001235" },
        { id: "t3", title: "North Star", catalog_id: "GC-0001236" },
        { id: "t4", title: "Quiet Draft", catalog_id: "GC-0001237" },
      ],
      deliveries: [
        delivery({
          delivery_id: "d-old",
          title_id: "t1",
          title: "Winter Light",
          vendor_name: "Endpoint A",
          status: "live",
          updated_at: "2026-09-01T00:00:00.000Z",
        }),
        delivery({
          delivery_id: "d-mid",
          title_id: "t2",
          title: "Harbor Cut",
          vendor_name: "Endpoint B",
          status: "pending",
          updated_at: "2026-09-08T00:00:00.000Z",
        }),
        delivery({
          delivery_id: "d-new",
          title_id: "t3",
          title: "North Star",
          vendor_name: "Endpoint C",
          status: "delivered",
          updated_at: "2026-09-12T00:00:00.000Z",
        }),
        delivery({
          delivery_id: "d-new-2",
          title_id: "t3",
          title: "North Star",
          vendor_name: "Endpoint D",
          status: "rejected",
          updated_at: "2026-09-11T00:00:00.000Z",
        }),
        delivery({
          delivery_id: "d-oldest",
          title_id: "t4",
          title: "Quiet Draft",
          vendor_name: "Endpoint E",
          status: "taken_down",
          updated_at: "2026-08-01T00:00:00.000Z",
        }),
      ],
    });

    expect(snapshot.groups.map((group) => group.id)).toEqual(["t3", "t2", "t1"]);
    expect(snapshot.groups.some((group) => group.id === "t4")).toBe(false);
    const north = snapshot.groups[0];
    expect(north.href).toBe("/titles/24F-0001236");
    expect(north.endpoints.map((row) => row.deliveryId)).toEqual(["d-new", "d-new-2"]);
    expect(north.endpoints[0]).toMatchObject({
      endpoint: "Endpoint C",
      status: "delivered",
    });
    expect(north.endpoints[1]).toMatchObject({
      endpoint: "Endpoint D",
      status: "rejected",
    });
  });

  it("returns a quiet empty when nothing has been submitted", () => {
    expect(
      buildLicensingStatus({
        titles: [{ id: "t1", title: "Winter Light", catalog_id: "GC-0001234" }],
        deliveries: [],
      }).groups,
    ).toEqual([]);
  });

  it("does not invent a licensing table or Filmhub Licensed/Removed domain", () => {
    expect(titlesSrc).not.toMatch(/from\(["']licensing_/);
    expect(pageSrc).not.toMatch(/from\(["']licensing_/);
    expect(pageSrc).toContain("buildLicensingStatus");
    expect(pageSrc).toContain("DashboardRecentActivity");
    expect(pageSrc).toContain("DashboardLicensingStatus");
    expect(pageSrc).not.toContain("licensing={licensing}");
  });
});
