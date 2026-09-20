"use client";

import { useEffect, useState } from "react";

import type { ActivityItem } from "@/lib/activity";
import {
  retainOwnNotificationsRealtime,
  type NotificationsRealtimeClient,
} from "@/lib/notifications-realtime";
import { createBrowserSupabase } from "@/lib/supabase/browser";

// One hook. Bell calls it once at the chrome root. Inbox list calls
// it once. retainOwnNotificationsRealtime ref-counts a single
// recipient channel — no twin listeners on a surface.

export function useOwnNotificationsRealtime(): ActivityItem[] {
  const [live, setLive] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let released = false;
    let release: (() => void) | undefined;
    const client = createBrowserSupabase();

    void client.auth.getSession().then(({ data }) => {
      if (released) return;
      const userId = data.session?.user.id;
      if (!userId) return;
      release = retainOwnNotificationsRealtime(
        client as NotificationsRealtimeClient,
        userId,
        (items) => {
          setLive([...items]);
        },
      );
    });

    return () => {
      released = true;
      release?.();
    };
  }, []);

  return live;
}
