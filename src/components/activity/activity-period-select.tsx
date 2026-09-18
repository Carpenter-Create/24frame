"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import { activityHref, type ActivityState } from "@/lib/activity";
import { REPORTS_PAGE } from "@/lib/reports";
import type { HousePageSelectOption } from "@/lib/house-page-select";

export function ActivityPeriodSelect({
  state,
  periodKey,
  periodLabel,
  options,
}: {
  state: ActivityState;
  periodKey: string;
  periodLabel: string;
  options: readonly HousePageSelectOption[];
}) {
  const router = useRouter();
  return (
    <div data-activity-period-select="" className="md:hidden">
      <HousePageSelect
        value={periodKey}
        label={periodLabel}
        options={[...options]}
        ariaLabel={REPORTS_PAGE.period}
        sheetTitle={REPORTS_PAGE.period}
        closeLabel={REPORTS_PAGE.close}
        onPick={(next) => {
          router.push(activityHref({ state, period: next }));
        }}
        menuAlign="start"
        attrs={{
          trigger: { "data-activity-period-trigger": "" },
          current: { "data-activity-period-current": "" },
          menu: { "data-activity-period-menu": "" },
          sheet: { "data-activity-period-sheet": "" },
          option: (key) => ({ "data-activity-period-option": key }),
        }}
      />
    </div>
  );
}
