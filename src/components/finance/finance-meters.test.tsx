import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, formatUsdCents } from "@/lib/finance";
import { FINANCE_CHART_VIEW_HEIGHT } from "@/lib/finance-craft";
import { thresholdMeter } from "@/lib/finance-dashboard";

import { NetHistoryChart, ThresholdMeterBar, TitleContributionBars } from "./finance-meters";

describe("finance meters", () => {
  it("renders an 8px threshold track and marks completion", () => {
    const html = renderToStaticMarkup(
      <ThresholdMeterBar meter={thresholdMeter(2000, 1000, true)} />,
    );
    expect(html).toContain("data-finance-threshold-meter");
    expect(html).toContain("data-threshold-complete");
    expect(html).toContain("h-2");
    expect(html).toContain(formatUsdCents(2000));
    expect(html).toContain(formatUsdCents(1000));
    expect(html).toContain("t-data");
  });

  it("omits empty contribution bars", () => {
    expect(TitleContributionBars({ contributions: [] })).toBeNull();
  });

  it("draws a full-width history chart with period labels", () => {
    const html = renderToStaticMarkup(
      <NetHistoryChart
        points={[
          { id: "p-1", label: "2026-07", netCents: 100 },
          { id: "p-2", label: "2026-08", netCents: 400 },
        ]}
      />,
    );
    expect(html).toContain("data-finance-history-chart");
    expect(html).toContain(`0 0 640 ${FINANCE_CHART_VIEW_HEIGHT}`);
    expect(html).toContain("2026-07");
    expect(html).toContain("2026-08");
    expect(html).toContain(FINANCE_CLIENT.history);
  });
});
