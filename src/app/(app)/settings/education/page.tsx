import { permanentRedirect } from "next/navigation";

import { SETTINGS } from "@/lib/settings";

export default function SettingsEducationRedirectPage() {
  permanentRedirect(SETTINGS.preferencesHref);
}
