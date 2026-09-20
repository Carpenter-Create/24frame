import { redirect } from "next/navigation";

import { ActivityInbox } from "@/components/activity/activity-inbox";
import {
  filterActivityItems,
  parseActivityFamily,
  type ActivityItem,
} from "@/lib/activity";
import { loadMyNotifications } from "@/lib/my-lists";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

// Live uncleared-alert feed. Newest first. Category chips only.
export default async function ActivityPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const family = parseActivityFamily(sp.family);

  const supabase = await createClient();
  const loaded = await loadMyNotifications(supabase);
  const items = filterActivityItems(loaded.rows as ActivityItem[], family);

  return (
    <ActivityInbox
      items={items}
      family={family}
      truncated={loaded.truncated}
    />
  );
}
