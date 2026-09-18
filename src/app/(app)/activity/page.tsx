import { redirect } from "next/navigation";

import { ActivityInbox } from "@/components/activity/activity-inbox";
import { HouseEmpty } from "@/components/chrome/house";
import {
  ACTIVITY,
  activityItemsFromNotifications,
  filterActivityItems,
  parseActivityPeriod,
  parseActivityState,
} from "@/lib/activity";
import { loadMyNotifications } from "@/lib/my-lists";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

export default async function ActivityPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const search = await searchParams;
  const now = new Date();
  const state = parseActivityState(search.state);
  const period = parseActivityPeriod(search.period, now);

  if (!ctx.activeOrg && !ctx.isGcStaff) {
    return (
      <div data-activity-page="">
        <h1 className="t-title text-ink">{ACTIVITY.title}</h1>
        <HouseEmpty>{ACTIVITY.noOrg}</HouseEmpty>
      </div>
    );
  }

  const supabase = await createClient();
  const loaded = await loadMyNotifications(supabase);
  const items = filterActivityItems(activityItemsFromNotifications(loaded.rows), {
    state,
    period,
  });

  return (
    <ActivityInbox
      items={items}
      state={state}
      period={period}
      truncated={loaded.truncated}
      now={now}
    />
  );
}
