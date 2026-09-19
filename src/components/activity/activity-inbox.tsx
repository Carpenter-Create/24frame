import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { MessageLink } from "@/app/(app)/aggregation/messages/message-link";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_PAGE,
  activityEmptyCopy,
  activityHref,
  type ActivityItem,
  type ActivityStatus,
} from "@/lib/activity";
import {
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
  DASHBOARD_TOP_PILL_CLUSTER_CLASS,
  DASHBOARD_TOP_PILL_THUMB_CLASS,
} from "@/lib/dashboard-craft";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
} from "@/lib/house-shell";
import { NOTIFICATION_EMAIL, NOTIFICATION_KIND_LABEL } from "@/lib/notifications";
import {
  REPORTS_PERIOD_PRESETS,
  reportsPeriodPresetKey,
  type ReportsPeriod,
} from "@/lib/reports";
import {
  REPORTS_RELATED_GAP_CLASS,
} from "@/lib/reports-craft";
import { MarkDone } from "./mark-done";

// Durable account-alert log. One notifications feed. Open inbox is
// unread; Done is read history. Reports pills for status + period.

export function ActivityInbox({
  items,
  status,
  period,
  now,
  truncated = false,
}: {
  items: ActivityItem[];
  status: ActivityStatus;
  period: ReportsPeriod;
  now: Date;
  truncated?: boolean;
}) {
  return (
    <div data-activity-inbox="">
      <PageHeader title={ACTIVITY_PAGE.title} subtitle={ACTIVITY_PAGE.subtitle} />

      <div data-activity-filters="" className={cn("flex flex-col pb-6", REPORTS_RELATED_GAP_CLASS)}>
        <SegmentedTrack
          activeIndex={(["open", "done"] as const).indexOf(status)}
          trackClass={DASHBOARD_TOP_PILL_CLUSTER_CLASS}
          thumbClass={DASHBOARD_TOP_PILL_THUMB_CLASS}
          data-activity-status=""
        >
          {(["open", "done"] as const).map((key) => {
            const on = status === key;
            return (
              <Link
                key={key}
                href={activityHref({ status: key, period: period.key })}
                aria-pressed={on}
                data-segmented-item=""
                data-activity-status-chip={key}
                className={cn(
                  DASHBOARD_TOP_PILL_BUTTON_CLASS,
                  on ? DASHBOARD_TOP_PILL_BUTTON_ON_CLASS : DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
                )}
              >
                {ACTIVITY_PAGE[key]}
              </Link>
            );
          })}
        </SegmentedTrack>
        <SegmentedTrack
          activeIndex={REPORTS_PERIOD_PRESETS.findIndex((p) => p.grain === period.kind)}
          trackClass={cn(HOUSE_SEGMENTED_TRACK_CLASS, "hidden md:flex")}
          thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}
          data-activity-period=""
        >
          {REPORTS_PERIOD_PRESETS.map((preset) => {
            const on = period.kind === preset.grain;
            const key = reportsPeriodPresetKey(preset.grain, now);
            return (
              <Link
                key={preset.grain}
                href={activityHref({ status, period: key })}
                aria-pressed={on}
                data-segmented-item=""
                data-activity-period-chip={preset.grain}
                className={cn(
                  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
                  on ? HOUSE_SEGMENTED_ITEM_ON_CLASS : HOUSE_SEGMENTED_ITEM_OFF_CLASS,
                )}
              >
                {preset.label}
              </Link>
            );
          })}
        </SegmentedTrack>
      </div>

      {truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="notifications">
          {ACTIVITY_PAGE.truncated}
        </InlineNotice>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardBody>
            <p className="t-body-sm text-ink-3">{activityEmptyCopy(status)}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const refs = (item.source_refs ?? {}) as { title_id?: string };
            const href = NOTIFICATION_EMAIL[item.kind].path({ titleId: refs.title_id });
            return (
              <Card key={item.id}>
                <CardBody className={cn(item.unread && "border-l-2 border-accent")}>
                  <div className="flex items-baseline justify-between gap-3 pb-1">
                    <MessageLink
                      id={item.id}
                      href={href}
                      unread={item.unread}
                      className="t-body font-medium text-ink underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </MessageLink>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="t-label text-ink-3">
                        {NOTIFICATION_KIND_LABEL[item.kind]} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.unread ? <MarkDone id={item.id} /> : null}
                    </div>
                  </div>
                  <MessageLink
                    id={item.id}
                    href={href}
                    unread={item.unread}
                    className="block t-body-sm text-ink-2 transition-colors hover:text-ink"
                  >
                    {item.body}
                  </MessageLink>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
