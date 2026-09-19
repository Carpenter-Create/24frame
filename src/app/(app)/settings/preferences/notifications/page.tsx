import { redirect } from "next/navigation";

import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { loadOwnNotificationPrefs } from "@/app/(app)/settings/preferences/actions";
import { NOTIFICATION_PREFS } from "@/lib/notification-prefs";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";

// Notifications drill-in. Instant switches stay here — they commit
// on tap. Back to Preferences. Desktop still shows the matrix on
// the Preferences pane.

export default async function SettingsPreferencesNotificationsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const prefs = await loadOwnNotificationPrefs();
  return (
    <SettingsEditPane
      title={NOTIFICATION_PREFS.title}
      helper={NOTIFICATION_PREFS.helper}
      pathname={SETTINGS.notificationsHref}
      hub="preferences"
    >
      <NotificationPreferences initialPrefs={prefs} showIntro={false} />
    </SettingsEditPane>
  );
}
