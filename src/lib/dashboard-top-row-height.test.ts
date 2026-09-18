import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardAdminHero } from "@/components/dashboard/dashboard-admin-hero";
import { DASHBOARD_ADMIN, parseDashboardPeriod } from "@/lib/dashboard-admin";
import {
  DASHBOARD_ADMIN_HERO_ATTENTION_CLASS,
  DASHBOARD_ADMIN_HERO_REVENUE_CLASS,
  DASHBOARD_ADMIN_OVERVIEW_CLASS,
  DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS,
  DASHBOARD_CARD_CLASS,
} from "@/lib/dashboard-craft";
import { DASHBOARD_ATTENTION, type AttentionRow } from "@/lib/dashboard-attention";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const now = new Date("2026-09-16T12:00:00.000Z");
const craft = readFileSync("src/lib/dashboard-craft.ts", "utf8");
const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
const attention = readFileSync("src/components/dashboard/dashboard-attention.tsx", "utf8");

function renderHero(rows: AttentionRow[]) {
  return renderToStaticMarkup(
    createElement(DashboardAdminHero, {
      orgName: "Acme",
      period: parseDashboardPeriod("all", now),
      options: [{ key: "all", label: "All time", group: "all" }],
      hero: {
        totalCents: 120_000_00,
        asOf: "All time",
        updated: "2026-07",
        compare: null,
        points: [
          { key: "2026-07", label: "2026-07", year: 2026, month: 7, netCents: 120_000_00 },
        ],
      },
      attention: { rows },
    }),
  );
}

describe("Dashboard top-row height pair (Net | Recent activity)", () => {
  it("G1/G6 — one shared row/cell/card contract, not an Attention-only height hack", () => {
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("lg:items-stretch");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("lg:grid-cols-5");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).not.toMatch(/(^|\s)items-stretch(\s|$)/);
    expect(DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS).toBe("h-full min-h-0 w-full");
    expect(DASHBOARD_ADMIN_HERO_REVENUE_CLASS).toContain(DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS);
    expect(DASHBOARD_ADMIN_HERO_ATTENTION_CLASS).toContain(DASHBOARD_ADMIN_TOP_ROW_CELL_CLASS);
    expect(DASHBOARD_ADMIN_HERO_REVENUE_CLASS).toContain("lg:col-span-3");
    expect(DASHBOARD_ADMIN_HERO_ATTENTION_CLASS).toContain("lg:col-span-2");
    expect(DASHBOARD_CARD_CLASS).toContain("h-full");
    expect(DASHBOARD_CARD_CLASS).toContain("flex-col");
    expect(hero).toContain("DASHBOARD_ADMIN_OVERVIEW_CLASS");
    expect(hero).toContain("DASHBOARD_ADMIN_HERO_REVENUE_CLASS");
    expect(hero).toContain("DASHBOARD_ADMIN_HERO_ATTENTION_CLASS");
    expect(hero).toContain("DASHBOARD_CARD_CLASS");
    expect(attention).toContain("DASHBOARD_CARD_CLASS");
    expect(attention).not.toMatch(/min-h-\[/);
    expect(attention).not.toMatch(/\bh-\[/);
    expect(craft).not.toMatch(/DASHBOARD_ADMIN_HERO_ATTENTION_CLASS[\s\S]{0,80}min-h-/);
  });

  it("G2/G4 — Recent activity content stays top-aligned; no filler charts or fake rows", () => {
    const html = renderHero([
      {
        id: "f1",
        what: "Synopsis is required.",
        at: "2026-09-12T15:04:00.000Z",
        href: "/titles/24F-0001234",
        kind: "catalog",
      },
    ]);
    expect(html).toContain('data-dashboard-module="attention"');
    expect(html).toContain(DASHBOARD_ATTENTION.title);
    expect(html).toContain("Synopsis is required.");
    expect(html).toContain("data-dashboard-attention-row");
    expect(html).not.toContain("data-dashboard-attention-filler");
    expect(html).not.toContain('data-dashboard-module="recent-activity"');
    expect(attention).not.toContain("DashboardRevenueChart");
    expect(attention).not.toContain("justify-center");
    expect(attention).not.toContain("justify-end");
    expect(attention).not.toContain("mt-auto");
    expect(DASHBOARD_CARD_CLASS).not.toContain("justify-center");
    expect(DASHBOARD_CARD_CLASS).not.toContain("justify-end");
  });

  it("G3 — empty Recent activity still uses the shared fill contract (no shrink-wrap class)", () => {
    const html = renderHero([]);
    expect(html).toContain("data-dashboard-attention-empty");
    expect(html).toContain(DASHBOARD_ATTENTION.empty);
    expect(html).not.toContain("data-dashboard-attention-row");
    expect(html).toContain(DASHBOARD_ADMIN_OVERVIEW_CLASS);
    expect(html).toContain(DASHBOARD_ADMIN_HERO_REVENUE_CLASS);
    expect(html).toContain(DASHBOARD_ADMIN_HERO_ATTENTION_CLASS);
    expect(html).toContain(DASHBOARD_CARD_CLASS);
    const attentionAt = html.indexOf('data-dashboard-module="attention"');
    const revenueAt = html.indexOf("data-dashboard-revenue");
    expect(attentionAt).toBeGreaterThan(-1);
    expect(revenueAt).toBeGreaterThan(-1);
    expect(html.slice(attentionAt, attentionAt + 280)).toContain("h-full");
    expect(html.slice(revenueAt, revenueAt + 280)).toContain("h-full");
  });

  it("G5 — phone stack stretches full width; equal-height stretch stays lg-only", () => {
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("max-md:flex-col");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("max-md:items-stretch");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("max-md:w-full");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("lg:items-stretch");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("items-start");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS.split(/\s+/)).not.toContain("md:items-stretch");
    expect(htmlHasUnprefixedItemsStretch(DASHBOARD_ADMIN_OVERVIEW_CLASS)).toBe(false);
    expect(DASHBOARD_ADMIN.revenue).toBe("Net revenue");
  });
});

function htmlHasUnprefixedItemsStretch(classes: string): boolean {
  return classes.split(/\s+/).includes("items-stretch");
}
