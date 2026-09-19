import { redirect } from "next/navigation";

import { ActivityInbox } from "@/components/activity/activity-inbox";
import {
  filterActivityItems,
  parseActivityPeriod,
  parseActivityStatus,
  type ActivityItem,
} from "@/lib/activity";
import { loadMyNotifications } from "@/lib/my-lists";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

// Durable account-alert log. Notifications feed only.
// Default: Open, newest→oldest. Done stays in history.
export default async function ActivityPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const status = parseActivityStatus(sp.status);
  const period = parseActivityPeriod(sp.period, now);

  const supabase = await createClient();
  const loaded = await loadMyNotifications(supabase);
  const items = filterActivityItems(loaded.rows as ActivityItem[], status, period);

  return (
    <ActivityInbox
      items={items}
      status={status}
      period={period}
      now={now}
      truncated={loaded.truncated}
    />
  );
}
