import Link from "next/link";
import { Gear } from "@phosphor-icons/react/ssr";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/layout/empty-state";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { SEGMENTED_TRACK_PERSIST } from "@/lib/segmented-track";
import { MessageLink } from "@/app/(app)/aggregation/messages/message-link";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_FAMILIES,
  ACTIVITY_FAMILY_SCROLL_CLASS,
  ACTIVITY_PAGE,
  ACTIVITY_PREFS_HREF,
  activityEmptyCopy,
  activityFamilyLabel,
  activityHref,
  type ActivityFamily,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import {
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
  DASHBOARD_TOP_PILL_CLUSTER_CLASS,
  DASHBOARD_TOP_PILL_THUMB_CLASS,
} from "@/lib/dashboard-craft";
import { NOTIFICATION_EMAIL, NOTIFICATION_KIND_LABEL } from "@/lib/notifications";
import { REPORTS_RELATED_GAP_CLASS } from "@/lib/reports-craft";
import { MarkDone } from "./mark-done";

// Live uncleared-alert feed. Category chips only. X clears a row.
// Gear is the only settings door: existing Preferences Notifications.

export function ActivityInbox({
  items,
  family,
  truncated = false,
}: {
  items: ActivityItem[];
  family: ActivityFamily;
  truncated?: boolean;
}) {
  return (
    <div data-activity-inbox="">
      <PageHeader
        title={ACTIVITY_PAGE.title}
        subtitle={ACTIVITY_PAGE.subtitle}
        actions={
          <Link
            href={ACTIVITY_PREFS_HREF}
            aria-label={ACTIVITY_PAGE.prefs}
            data-activity-prefs=""
            className={HOUSE_THEME_TOGGLE_CLASS}
          >
            <Gear
              className={PHOSPHOR_CHROME_ICON_CLASS}
              weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
            />
          </Link>
        }
      />

      <div data-activity-filters="" className={cn("flex flex-col pb-6", REPORTS_RELATED_GAP_CLASS)}>
        <div data-activity-family-scroll="" className={ACTIVITY_FAMILY_SCROLL_CLASS}>
          <SegmentedTrack
            activeIndex={ACTIVITY_FAMILIES.indexOf(family)}
            persistKey={SEGMENTED_TRACK_PERSIST.activityFamily}
            trackClass={DASHBOARD_TOP_PILL_CLUSTER_CLASS}
            thumbClass={DASHBOARD_TOP_PILL_THUMB_CLASS}
            data-activity-family=""
          >
            {ACTIVITY_FAMILIES.map((key) => {
              const on = family === key;
              return (
                <Link
                  key={key}
                  href={activityHref({ family: key })}
                  aria-pressed={on}
                  data-segmented-item=""
                  data-activity-family-chip={key}
                  className={cn(
                    DASHBOARD_TOP_PILL_BUTTON_CLASS,
                    on ? DASHBOARD_TOP_PILL_BUTTON_ON_CLASS : DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
                  )}
                >
                  {activityFamilyLabel(key)}
                </Link>
              );
            })}
          </SegmentedTrack>
        </div>
      </div>

      {truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="notifications">
          {ACTIVITY_PAGE.truncated}
        </InlineNotice>
      ) : null}

      {items.length === 0 ? (
        <div data-activity-empty="">
          <EmptyState title={activityEmptyCopy()} description={ACTIVITY_PAGE.emptyHint} />
        </div>
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
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="t-label text-ink-3">
                        {NOTIFICATION_KIND_LABEL[item.kind]} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <MarkDone id={item.id} />
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
