import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_PAGE } from "./finance";
import {
  FINANCE_CHART_VIEW_HEIGHT,
  FINANCE_DOWNLOAD_CLASS,
  FINANCE_HERO_CLASS,
  FINANCE_METER_TRACK_CLASS,
  FINANCE_STACK_CLASS,
} from "./finance-craft";
import { GC_NAV, NAV } from "./nav";

const glance = readFileSync("src/components/dashboard/dashboard-finance-glance.tsx", "utf8");
const period = readFileSync("src/components/finance/client-period-dashboard.tsx", "utf8");
const meters = readFileSync("src/components/finance/finance-meters.tsx", "utf8");
const statementPage = readFileSync("src/app/(app)/aggregation/reports/[periodId]/page.tsx", "utf8");
const switcher = readFileSync("src/lib/workspace-switcher.ts", "utf8");

const clientSurfaces = [glance, period, meters, statementPage];

describe("finance visual craft register", () => {
  it("keeps house 8/16/24/48 and kills band/shadow/orphan gaps on client purse surfaces", () => {
    for (const src of clientSurfaces) {
      expect(src).not.toContain("bg-band");
      expect(src).not.toContain("text-band-ink");
      expect(src).not.toContain("gap-3");
      expect(src).not.toContain("h-1.5");
      expect(src).not.toMatch(/shadow-(?:sm|md|lg|xl|2xl)/);
    }
    expect(FINANCE_STACK_CLASS).toContain("--space-12");
    expect(FINANCE_HERO_CLASS).toContain("border-hairline");
    expect(FINANCE_HERO_CLASS).toContain("bg-surface");
    expect(FINANCE_METER_TRACK_CLASS).toContain("h-2");
    expect(FINANCE_CHART_VIEW_HEIGHT).toBe(148);
    expect(FINANCE_DOWNLOAD_CLASS).toContain("bg-accent");
    expect(glance).toContain("DashboardHomePanel");
    expect(period).toContain("data-finance-contract-strip");
    expect(period).toContain("data-finance-statement-doc");
    expect(period).toContain("data-finance-close-outcome");
    expect(statementPage).toContain("data-finance-download");
    expect(statementPage).toContain("FINANCE_CLIENT.download");
    expect(meters).toContain("FINANCE_CHART_VIEW_HEIGHT");
  });

  it("does not reopen workspace switcher chrome", () => {
    expect(glance).not.toContain("workspace-switcher");
    expect(period).not.toContain("workspace-switcher");
    expect(switcher).toContain("APP_HEADER_TRAILING_CLUSTER_CLASS");
  });

  it("keeps Reports on the client rail and Finance on STAFF ops", () => {
    const client = NAV.find((item) => item.href === "/aggregation/reports");
    const staff = GC_NAV.find((item) => item.href === "/aggregation/gc/finance");
    expect(client?.label).toBe("Reports");
    expect(staff?.label).toBe("Finance");
    expect(client?.ariaLabel).toBe(FINANCE_CLIENT.navAria);
    expect(staff?.ariaLabel).toBe(FINANCE_PAGE.navAria);
    expect(FINANCE_CLIENT.subtitle.toLowerCase()).toContain("purse");
    expect(FINANCE_PAGE.subtitle.toLowerCase()).toContain("import");
    expect(client?.ariaLabel).not.toBe(staff?.ariaLabel);
    expect(GC_NAV.map((item) => item.label)).not.toContain("Earn");
    expect(NAV.map((item) => item.label)).not.toContain("Earn");
  });
});
