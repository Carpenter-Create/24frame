"use server";

import { revalidatePath } from "next/cache";

import { ACTIVITY_HREF } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

// Mark the given notifications Done for the current user (per-user read state).
// Done ⇒ read. Reuses mark_notifications_read — do not fork a second write path.
export async function markActivityDone(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) return { error: error.message };

  revalidatePath(ACTIVITY_HREF);
  revalidatePath("/messages");
  return {};
}
