"use server";

import { revalidatePath } from "next/cache";

import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREFS,
  notificationPrefsToRow,
  notificationPrefWriteSchema,
  parseNotificationPrefsRow,
  withNotificationPref,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

async function readOwnNotificationPrefs(
  userId: string,
): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { ...NOTIFICATION_PREF_DEFAULTS };
  return parseNotificationPrefsRow(data);
}

/** Missing row or a pre-apply table miss washes to defaults. */
export async function loadOwnNotificationPrefs(): Promise<NotificationPrefs> {
  const ctx = await getOrgContext();
  if (!ctx) return { ...NOTIFICATION_PREF_DEFAULTS };
  return readOwnNotificationPrefs(ctx.user.id);
}

export async function saveNotificationPref(
  input: unknown,
): Promise<{ error?: string; prefs?: NotificationPrefs }> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: NOTIFICATION_PREFS.signedOut };

  const parsed = notificationPrefWriteSchema.safeParse(input);
  if (!parsed.success) return { error: NOTIFICATION_PREFS.invalid };

  const current = await readOwnNotificationPrefs(ctx.user.id);
  const next = withNotificationPref(
    current,
    parsed.data.event,
    parsed.data.channel,
    parsed.data.enabled,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_notification_preferences")
    .upsert(notificationPrefsToRow(ctx.user.id, next), { onConflict: "user_id" });
  if (error) return { error: error.message || NOTIFICATION_PREFS.saveFailed };

  revalidatePath(SETTINGS.preferencesHref);
  revalidatePath(SETTINGS.href);
  return { prefs: next };
}
