"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

// Mark the given notifications read for the current user (per-user read state).
// Used by per-message "Mark as read". "Mark all read" uses markAllNotificationsRead
// so hidden rows past the inbox bound still get a notification_reads row.
export async function markNotificationsRead(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) return { error: error.message };

  revalidatePath("/messages");
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) return { error: error.message };

  revalidatePath("/messages");
  return {};
}
