import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  ATTENTION_HREF,
  ATTENTION_KINDS,
  CATALOG_HEALTH_HREF,
  DASHBOARD_ATTENTION,
  DASHBOARD_ATTENTION_CAP,
  buildAttentionGlance,
} from "./dashboard-attention";

describe("dashboard Attention glance", () => {
  it("is a dated catalog-findings glance — not readiness buckets", () => {
    expect(DASHBOARD_ATTENTION.title).toBe("Recent activity");
    expect(DASHBOARD_ATTENTION.viewAllHref).toBe("/attention");
    expect(ATTENTION_HREF).toBe("/attention");
    expect(CATALOG_HEALTH_HREF).toBe("/catalog-health");
    expect(DASHBOARD_ATTENTION_CAP).toBe(5);
    expect(ATTENTION_KINDS).toEqual(["catalog", "contract"]);
    expect(DASHBOARD_ATTENTION.empty).toBe("Nothing needs your attention right now.");
  });

  it("emits catalog rows as what + timestamp, newest first, capped", () => {
    const snapshot = buildAttentionGlance({
      titles: [
        {
          id: "t1",
          title: "Winter Light",
          status: "live",
          created_at: "2026-09-01T00:00:00.000Z",
          catalog_id: "GC-0001234",
        },
        {
          id: "t2",
          title: "Harbor Cut",
          status: "draft",
          created_at: "2026-09-02T00:00:00.000Z",
          catalog_id: "GC-0001235",
        },
      ],
      findings: [
        {
          id: "f-old",
          org_id: "org-1",
          entity_id: "t1",
          message: "Synopsis is required.",
          created_at: "2026-09-10T08:00:00.000Z",
        },
        {
          id: "f-new",
          org_id: "org-1",
          entity_id: "t2",
          message: "Artwork recommended.",
          created_at: "2026-09-12T15:04:00.000Z",
        },
        {
          id: "f-skip",
          org_id: "org-1",
          entity_id: "t1",
          message: "   ",
          created_at: "2026-09-13T00:00:00.000Z",
        },
        {
          id: "f-no-time",
          org_id: "org-1",
          entity_id: "t1",
          message: "Keywords recommended.",
        },
      ],
    });

    expect(snapshot.rows.map((row) => row.id)).toEqual(["f-new", "f-old"]);
    expect(snapshot.rows[0]).toMatchObject({
      what: "Artwork recommended.",
      at: "2026-09-12T15:04:00.000Z",
      href: "/titles/24F-0001235",
      kind: "catalog",
    });
    expect(snapshot.rows.every((row) => row.kind === "catalog")).toBe(true);
    expect(snapshot.rows.some((row) => row.kind === "contract")).toBe(false);
  });

  it("does not invent contract schema or readiness buckets", () => {
    const src = [
      readFileSync("src/lib/dashboard-attention.ts", "utf8"),
      readFileSync("src/components/dashboard/dashboard-attention.tsx", "utf8"),
    ].join("\n");
    expect(src).not.toMatch(/from\(["']contract_/);
    expect(src).not.toContain("Ready");
    expect(src).not.toContain("In review");
    expect(src).not.toContain("Needs attention");
    expect(src).not.toContain("Licensed");
  });
});
