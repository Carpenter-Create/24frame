"use server";

import { markActivityDone } from "@/app/(app)/activity/actions";

// Staff inbox leftover. Activity owns the write path — Done ⇒ read.
export async function markNotificationsRead(ids: string[]): Promise<{ error?: string }> {
  return markActivityDone(ids);
}
