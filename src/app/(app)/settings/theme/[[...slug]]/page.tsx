import { permanentRedirect } from "next/navigation";

import { SETTINGS } from "@/lib/settings";

// Flat /settings/theme and /settings/theme/* permanently redirect
// into the Preferences Theme drill. This route does not render
// the picker. preferences-drill-nested-slugs-lock-v1.

export default function SettingsThemeRedirectPage() {
  permanentRedirect(SETTINGS.themeHref);
}
