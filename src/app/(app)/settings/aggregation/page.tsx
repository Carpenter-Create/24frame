import { permanentRedirect } from "next/navigation";

import { SETTINGS } from "@/lib/settings";

export default function SettingsAggregationRedirectPage() {
  permanentRedirect(SETTINGS.organizationHref);
}
