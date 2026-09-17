"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  DASHBOARD_ADMIN,
  dashboardHref,
  dashboardPeriodMenuGroups,
  dashboardPeriodOption,
  type DashboardPeriodOption,
} from "@/lib/dashboard-admin";

export function DashboardAdminControls({
  periodKey,
  options,
  defaultOpen = false,
}: {
  periodKey: string;
  options: readonly DashboardPeriodOption[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const current = dashboardPeriodOption(options, periodKey);
  const groups = dashboardPeriodMenuGroups(options).map((group) => ({
    id: group.group,
    label: group.label,
    options: group.options.map((option) => ({ key: option.key, label: option.label })),
    hideLabel: group.group === "all" || group.group === "ytd",
  }));

  function go(period: string) {
    router.replace(dashboardHref({ period }), { scroll: false });
  }

  return (
    <div
      data-dashboard-admin-controls=""
      className="flex w-auto shrink-0 items-center justify-end"
    >
      <div className="flex min-w-0 items-center gap-[var(--space-2)]">
        <HousePageSelect
          value={periodKey}
          label={current?.label ?? periodKey}
          groups={groups}
          ariaLabel={DASHBOARD_ADMIN.period}
          sheetTitle={DASHBOARD_ADMIN.period}
          closeLabel={DASHBOARD_ADMIN.close}
          defaultOpen={defaultOpen}
          onPick={go}
          menuAlign="end"
          attrs={{
            trigger: {
              "data-dashboard-period": "",
              "data-dashboard-period-one": "",
            },
            current: { "data-dashboard-period-current": "" },
            chevron: { "data-dashboard-period-chevron": "" },
            menu: { "data-dashboard-period-menu": "" },
            sheet: { "data-dashboard-period-sheet": "" },
            group: (id) => ({ "data-dashboard-period-group": id }),
            groupLabel: { "data-dashboard-period-group-label": "" },
            option: (key) => ({ "data-dashboard-period-option": key }),
            optionLabel: { "data-dashboard-period-option-label": "" },
            optionCheck: { "data-dashboard-period-option-check": "" },
          }}
        />
      </div>
    </div>
  );
}
