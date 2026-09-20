import { Card, CardBody } from "@/components/ui/card";
import { MessageLink } from "@/app/(app)/aggregation/messages/message-link";
import { cn } from "@/lib/cn";
import { activityItemHref, type ActivityItem } from "@/lib/activity";
import { NOTIFICATION_KIND_LABEL } from "@/lib/notifications";
import { MarkDone } from "./mark-done";

// One row SoT: title link + X marks done. Inbox and the bell peek
// consume this. Do not fork a peek-only row.

export function ActivityFeedRow({ item }: { item: ActivityItem }) {
  const href = activityItemHref(item);
  return (
    <Card data-activity-row={item.id}>
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
}
