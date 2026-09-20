import Link from "next/link";
import { Gear } from "@phosphor-icons/react/ssr";

import { ActivityPageLead } from "@/components/activity/activity-page-lead";
import { Card, CardBody } from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/layout/empty-state";
import { MessageLink } from "@/app/(app)/aggregation/messages/message-link";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_HREF,
  ACTIVITY_LEAD_ROW_CLASS,
  ACTIVITY_PAGE,
  ACTIVITY_PAGE_CLASS,
  ACTIVITY_PREFS_HREF,
  ACTIVITY_SECTION_CLASS,
  activityEmptyCopy,
  activityItemHref,
  type ActivityFamily,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { NOTIFICATION_KIND_LABEL } from "@/lib/notifications";
import { ActivityFamilyChips } from "./activity-family-chips";
import { MarkDone } from "./mark-done";

// Live uncleared-alert feed. Category chips only. X clears a row.
// Gear is the only settings door: existing Preferences Notifications.
// Page-lead + pane air reuse the Settings / Get Help SoT.

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
    <div data-activity-inbox="" className={ACTIVITY_PAGE_CLASS}>
      <section data-activity-section="" className={ACTIVITY_SECTION_CLASS}>
        <div data-activity-lead-row="" className={ACTIVITY_LEAD_ROW_CLASS}>
          <ActivityPageLead
            title={ACTIVITY_PAGE.title}
            helper={ACTIVITY_PAGE.subtitle}
            pathname={ACTIVITY_HREF}
          />
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
        </div>

        <div data-activity-filters="">
          <ActivityFamilyChips family={family} />
        </div>

        {truncated ? (
          <InlineNotice tone="info" data-my-list-truncated="notifications">
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
              const href = activityItemHref(item);
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
      </section>
    </div>
  );
}
