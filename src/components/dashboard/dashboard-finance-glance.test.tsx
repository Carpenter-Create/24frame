import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_CLIENT_HREF, formatUsdCents } from "@/lib/finance";
import { buildClientFinanceGlance } from "@/lib/finance-glance";

import { DashboardClientFinanceGlance, DashboardFinanceGlance } from "./dashboard-finance-glance";

describe("DashboardClientFinanceGlance", () => {
  it("renders a house card with rate, balance, threshold, latest, and a Finance CTA", () => {
    const glance = buildClientFinanceGlance({
      clientRateBp: 8500,
      financeHref: FINANCE_CLIENT_HREF,
      periods: [
        {
          id: "closed-1",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 0,
          closing_balance_cents: 400,
          threshold_cents: 1000,
        },
      ],
    });
    const html = renderToStaticMarkup(<DashboardClientFinanceGlance glance={glance} />);
    expect(html).toContain("data-finance-glance");
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain("border-hairline");
    expect(html).toContain(FINANCE_CLIENT.glanceRate);
    expect(html).toContain("85%");
    expect(html).toContain(formatUsdCents(400));
    expect(html).toContain(formatUsdCents(1000));
    expect(html).toContain("2026-08");
    expect(html).toContain(`href="${FINANCE_CLIENT_HREF}"`);
    expect(html).toContain(FINANCE_CLIENT.glanceCta);
    expect(html).toContain("t-data");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("$12.34");
  });

  it("stays quiet when no closed statement exists", () => {
    const glance = buildClientFinanceGlance({
      clientRateBp: null,
      financeHref: FINANCE_CLIENT_HREF,
      periods: [],
    });
    const html = renderToStaticMarkup(<DashboardClientFinanceGlance glance={glance} />);
    expect(html).toContain(FINANCE_CLIENT.glanceNone);
    expect(html).not.toContain("$");
    expect(html).toContain("dashboard-home-panel");
  });
});

describe("DashboardFinanceGlance", () => {
  it("keeps the staff stub pointer", () => {
    const html = renderToStaticMarkup(<DashboardFinanceGlance />);
    expect(html).toContain("data-finance-glance-stub");
    expect(html).not.toContain("data-finance-glance=\"");
    expect(html).not.toContain("dashboard-home-panel");
  });
});
