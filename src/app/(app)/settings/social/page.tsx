import { permanentRedirect } from "next/navigation";

import { SETTINGS } from "@/lib/settings";

export default function SettingsSocialRedirectPage() {
  permanentRedirect(SETTINGS.preferencesHref);
}
