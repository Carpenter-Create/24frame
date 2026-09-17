import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DASHBOARD_LICENSING,
  LICENSING_IN_REVIEW_STATUSES,
  buildLicensingStatus,
  isLicensingInReview,
  isLicensingReady,
  isRecommendedFinding,
  isRequiredFinding,
  licensingBuckets,
} from "./dashboard-licensing";

const titlesSrc = readFileSync("src/lib/dashboard-licensing.ts", "utf8");
const pageSrc = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");

describe("licensing signal map", () => {
  it("maps Ready / Needs attention / In review onto title_status + required findings", () => {
    expect(DASHBOARD_LICENSING.title).toBe("Licensing status");
    expect(DASHBOARD_LICENSING.ready).toBe("Ready");
    expect(DASHBOARD_LICENSING.needsAttention).toBe("Needs attention");
    expect(DASHBOARD_LICENSING.inReview).toBe("In review");
    expect(DASHBOARD_LICENSING.viewAllHref).toBe("/catalog-health");
    expect(LICENSING_IN_REVIEW_STATUSES).toEqual(["submitted", "in_review", "in_delivery"]);
    expect(isRequiredFinding("high")).toBe(true);
    expect(isRequiredFinding("low")).toBe(false);
    expect(isRecommendedFinding("low")).toBe(true);
    expect(isLicensingReady("live", false)).toBe(true);
    expect(isLicensingReady("live", true)).toBe(false);
    expect(isLicensingReady("submitted", false)).toBe(false);
    expect(isLicensingInReview("submitted")).toBe(true);
    expect(isLicensingInReview("in_review")).toBe(true);
    expect(isLicensingInReview("in_delivery")).toBe(true);
    expect(isLicensingInReview("live")).toBe(false);
    expect(licensingBuckets("live", false)).toEqual(["ready"]);
    expect(licensingBuckets("live", true)).toEqual(["needsAttention"]);
    expect(licensingBuckets("submitted", true)).toEqual(["needsAttention", "inReview"]);
    expect(licensingBuckets("draft", false)).toEqual([]);
    expect(licensingBuckets("archived", true)).toEqual(["needsAttention"]);
    expect(licensingBuckets("archived", false)).toEqual([]);
  });

  it("counts required findings only and keeps recommended as row meta", () => {
    const snapshot = buildLicensingStatus({
      titles: [
        {
          id: "live-ready",
          title: "Winter Light",
          status: "live",
          created_at: "2026-09-02T00:00:00.000Z",
          catalog_id: "GC-0001234",
        },
        {
          id: "live-required",
          title: "Harbor Cut",
          status: "live",
          created_at: "2026-09-03T00:00:00.000Z",
          catalog_id: "GC-0001235",
        },
        {
          id: "review",
          title: "North Star",
          status: "in_review",
          created_at: "2026-09-04T00:00:00.000Z",
          catalog_id: "GC-0001236",
        },
        {
          id: "draft-recommended",
          title: "Quiet Draft",
          status: "draft",
          created_at: "2026-09-05T00:00:00.000Z",
        },
        {
          id: "archived-required",
          title: "Old Reel",
          status: "archived",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      findings: [
        {
          org_id: "org-1",
          entity_id: "live-required",
          severity: "high",
          message: "Synopsis is required.",
        },
        {
          org_id: "org-1",
          entity_id: "live-ready",
          severity: "low",
          message: "Keywords recommended.",
        },
        {
          org_id: "org-1",
          entity_id: "draft-recommended",
          severity: "low",
          message: "Artwork recommended.",
        },
        {
          org_id: "org-1",
          entity_id: "archived-required",
          severity: "high",
          message: "Master is required.",
        },
      ],
    });

    expect(snapshot.ready).toBe(1);
    expect(snapshot.needsAttention).toBe(2);
    expect(snapshot.inReview).toBe(1);
    expect(snapshot.rows.map((row) => row.id)).toEqual([
      "live-required",
      "archived-required",
      "review",
      "live-ready",
    ]);
    const liveRequired = snapshot.rows.find((row) => row.id === "live-required");
    const liveReady = snapshot.rows.find((row) => row.id === "live-ready");
    const archivedRequired = snapshot.rows.find((row) => row.id === "archived-required");
    expect(liveRequired?.href).toBe("/titles/24F-0001235");
    expect(liveRequired?.statusLabel).toBe("Live");
    expect(liveRequired?.meta).toBe("Synopsis is required.");
    expect(liveReady?.meta).toBe("Keywords recommended.");
    expect(liveReady?.href).toBe("/titles/24F-0001234");
    expect(archivedRequired?.buckets).toEqual(["needsAttention"]);
    expect(snapshot.rows.some((row) => row.id === "draft-recommended")).toBe(false);
  });

  it("does not invent a licensing table or Filmhub Licensed/Removed domain", () => {
    expect(titlesSrc).not.toMatch(/from\(["']licensing_/);
    expect(titlesSrc).not.toContain("Licensed");
    expect(titlesSrc).not.toContain("Removed");
    expect(pageSrc).not.toMatch(/from\(["']licensing_/);
    expect(pageSrc).toContain("buildLicensingStatus");
    expect(pageSrc).toContain("DashboardRecentActivity");
    expect(pageSrc).toContain("licensing={licensing}");
    expect(pageSrc).not.toContain("activity={");
  });
});
