import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  NOTIFICATION_KIND_LABEL,
  NOTIFICATION_EMAIL,
  MESSAGES_EMPTY,
  MESSAGES_SUBTITLE,
  MESSAGES_TRUNCATED,
} from "@/lib/notifications";
import type { Database } from "@/lib/supabase/database.types";
import { MarkAllRead } from "@/app/(app)/aggregation/messages/mark-all-read";
import { MarkRead } from "@/app/(app)/aggregation/messages/mark-read";
import { MessageLink } from "@/app/(app)/aggregation/messages/message-link";

type InboxNotification = Database["public"]["Functions"]["my_notifications"]["Returns"][number];

// Existing GC-Support notification inbox. Kept for staff without a client org.
export function NotificationInbox({
  notifications,
  truncated = false,
}: {
  notifications: InboxNotification[];
  truncated?: boolean;
}) {
  const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);

  return (
    <div data-messages-inbox="">
      <PageHeader title="Messages" subtitle={MESSAGES_SUBTITLE} />

      {truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="notifications">
          {MESSAGES_TRUNCATED}
        </InlineNotice>
      ) : null}

      {/* Mark all only when the page is complete. A truncated list plus the
          unbounded my_unread_count badge would otherwise claim every notice
          was read while hidden rows stayed unread. Per-row Mark as read stays. */}
      {unreadIds.length > 0 && !truncated ? (
        <div className="pb-4">
          <MarkAllRead ids={unreadIds} />
        </div>
      ) : null}

      {notifications.length === 0 ? (
        <Card>
          <CardBody>
            <p className="t-body-sm text-ink-3">{MESSAGES_EMPTY}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const refs = (n.source_refs ?? {}) as { title_id?: string };
            const href = NOTIFICATION_EMAIL[n.kind].path({ titleId: refs.title_id });
            return (
              <Card key={n.id}>
                <CardBody className={cn(n.unread && "border-l-2 border-accent")}>
                  <div className="flex items-baseline justify-between gap-3 pb-1">
                    <MessageLink
                      id={n.id}
                      href={href}
                      unread={n.unread}
                      className="t-body font-medium text-ink underline-offset-2 hover:underline"
                    >
                      {n.title}
                    </MessageLink>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="t-label text-ink-3">
                        {NOTIFICATION_KIND_LABEL[n.kind]} · {new Date(n.created_at).toLocaleDateString()}
                      </span>
                      {n.unread ? <MarkRead id={n.id} /> : null}
                    </div>
                  </div>
                  <MessageLink
                    id={n.id}
                    href={href}
                    unread={n.unread}
                    className="block t-body-sm text-ink-2 transition-colors hover:text-ink"
                  >
                    {n.body}
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
