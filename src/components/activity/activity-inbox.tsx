import Link from "next/link";
import { Gear } from "@phosphor-icons/react/ssr";

import { ActivityPageLead } from "@/components/activity/activity-page-lead";
import { InlineNotice } from "@/components/ui/inline-notice";
import { EmptyState } from "@/components/layout/empty-state";
import {
  ACTIVITY_HREF,
  ACTIVITY_LEAD_ROW_CLASS,
  ACTIVITY_PAGE,
  ACTIVITY_PAGE_CLASS,
  ACTIVITY_PREFS_HREF,
  ACTIVITY_SECTION_CLASS,
  activityEmptyCopy,
  type ActivityFamily,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { ActivityFamilyChips } from "./activity-family-chips";
import { ActivityFeedRow } from "./activity-feed-row";

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
            {items.map((item) => (
              <ActivityFeedRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
