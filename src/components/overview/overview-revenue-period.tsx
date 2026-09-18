"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { DASHBOARD_ADMIN, type DashboardPeriod } from "@/lib/dashboard-admin";
import {
  OVERVIEW_REVENUE_PERIOD_SELECT_CLASS,
  overviewHref,
} from "@/lib/overview";
import {
  REPORTS_PERIOD_PRESETS,
  reportsPeriodPresetKey,
} from "@/lib/reports";

// Home Net revenue period — phone. HousePageSelect is the SoT
// (Dashboard All time / Reports phone trigger). Desktop keeps the
// Reports period chips. Do not invent a Home chip-wrap fork.

export function OverviewRevenuePeriodSelect({
  period,
  now,
  defaultOpen = false,
}: {
  period: DashboardPeriod;
  now: Date;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const options = REPORTS_PERIOD_PRESETS.map((preset) => ({
    key: reportsPeriodPresetKey(preset.grain, now),
    label: preset.label,
  }));
  const current =
    REPORTS_PERIOD_PRESETS.find((preset) => preset.grain === period.kind)?.label ??
    period.label;

  return (
    <div
      data-overview-revenue-period-select=""
      className={OVERVIEW_REVENUE_PERIOD_SELECT_CLASS}
    >
      <HousePageSelect
        value={reportsPeriodPresetKey(period.kind, now)}
        label={current}
        options={options}
        ariaLabel={DASHBOARD_ADMIN.period}
        sheetTitle={DASHBOARD_ADMIN.period}
        closeLabel={DASHBOARD_ADMIN.close}
        defaultOpen={defaultOpen}
        menuAlign="start"
        onPick={(key) => {
          router.replace(overviewHref({ period: key }), { scroll: false });
        }}
        attrs={{
          trigger: { "data-overview-revenue-period-trigger": "" },
          current: { "data-overview-revenue-period-current": "" },
          menu: { "data-overview-revenue-period-menu": "" },
          sheet: { "data-overview-revenue-period-sheet": "" },
          option: (key) => ({ "data-overview-revenue-period-option": key }),
        }}
      />
    </div>
  );
}
