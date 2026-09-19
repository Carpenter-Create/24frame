import { permanentRedirect } from "next/navigation";

import { SETTINGS } from "@/lib/settings";

export default function SettingsYouRedirectPage() {
  permanentRedirect(SETTINGS.profileHref);
}
