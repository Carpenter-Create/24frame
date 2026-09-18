import Link from "next/link";

import { MarkAllDone, MarkDone } from "@/app/(app)/activity/mark-done";
import { Card, CardBody } from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/inline-notice";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import {
  ACTIVITY,
  ACTIVITY_PERIOD_PRESETS,
  activityEmptyCopy,
  activityHistoryPeriodVisible,
  activityHref,
  activityPeriodPresetKey,
  type ActivityItem,
  type ActivityState,
} from "@/lib/activity";
import { REPORTS_PAGE, type ReportsPeriod } from "@/lib/reports";
import {
  REPORTS_PERIOD_CHIP_CLASS,
  REPORTS_PERIOD_CHIP_OFF_CLASS,
  REPORTS_PERIOD_CHIP_ON_CLASS,
  REPORTS_PERIOD_CHIP_STUB_CLASS,
  REPORTS_RELATED_GAP_CLASS,
} from "@/lib/reports-craft";

const STATES: ActivityState[] = ["open", "done", "all"];

const ACTIVITY_CHIP_CLUSTER_CLASS = "flex flex-wrap items-center gap-[var(--space-2)]";

export function ActivityInbox({
  items,
  state,
  period,
  truncated = false,
  now = new Date(),
}: {
  items: readonly ActivityItem[];
  state: ActivityState;
  period: ReportsPeriod;
  truncated?: boolean;
  now?: Date;
}) {
  const openIds = items.filter((item) => item.open).map((item) => item.id);
  const history = activityHistoryPeriodVisible(state);

  return (
    <div data-activity-inbox="" data-activity-state={state}>
      <PageHeader title={ACTIVITY.title} subtitle={ACTIVITY.subtitle} />

      <div
        data-activity-controls=""
        className={cn("flex flex-col pb-4", REPORTS_RELATED_GAP_CLASS)}
      >
        <div data-activity-state-cluster="" className={ACTIVITY_CHIP_CLUSTER_CLASS}>
          {STATES.map((next) => {
            const on = state === next;
            return (
              <Link
                key={next}
                href={activityHref({
                  state: next,
                  period: next === "open" ? undefined : period.key,
                })}
                data-activity-state-chip={next}
                aria-current={on ? "page" : undefined}
                className={cn(
                  REPORTS_PERIOD_CHIP_CLASS,
                  on ? REPORTS_PERIOD_CHIP_ON_CLASS : REPORTS_PERIOD_CHIP_OFF_CLASS,
                )}
              >
                {ACTIVITY[next]}
              </Link>
            );
          })}
        </div>
        {history ? (
          <div data-activity-period="" className={cn("min-w-0", REPORTS_RELATED_GAP_CLASS, "flex items-center")}>
            <div data-activity-period-cluster="" className={ACTIVITY_CHIP_CLUSTER_CLASS}>
              {ACTIVITY_PERIOD_PRESETS.map((preset) => {
                const key = activityPeriodPresetKey(preset.grain, now);
                const on = period.kind === preset.grain;
                return (
                  <Link
                    key={preset.grain}
                    href={activityHref({ state, period: key })}
                    data-activity-period-chip={preset.grain}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      REPORTS_PERIOD_CHIP_CLASS,
                      on ? REPORTS_PERIOD_CHIP_ON_CLASS : REPORTS_PERIOD_CHIP_OFF_CLASS,
                    )}
                  >
                    {preset.label}
                  </Link>
                );
              })}
              <span
                data-activity-period-custom=""
                data-activity-period-stub=""
                title={REPORTS_PAGE.customStub}
                className={cn(REPORTS_PERIOD_CHIP_CLASS, REPORTS_PERIOD_CHIP_STUB_CLASS)}
              >
                {REPORTS_PAGE.custom}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="activity">
          {ACTIVITY.truncated}
        </InlineNotice>
      ) : null}

      {openIds.length > 0 && state === "open" && !truncated ? (
        <div className="pb-4">
          <MarkAllDone ids={openIds} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardBody>
            <p className="t-body-sm text-ink-3">{activityEmptyCopy(state)}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardBody className={cn(item.open && "border-l-2 border-accent")}>
                <div className="flex items-baseline justify-between gap-3 pb-1">
                  <Link
                    href={item.href}
                    className="t-body font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="t-label text-ink-3">
                      {item.kindLabel} · {new Date(item.at).toLocaleDateString()}
                    </span>
                    {item.open ? <MarkDone id={item.id} /> : null}
                  </div>
                </div>
                <Link
                  href={item.href}
                  className="block t-body-sm text-ink-2 transition-colors hover:text-ink"
                >
                  {item.body}
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
