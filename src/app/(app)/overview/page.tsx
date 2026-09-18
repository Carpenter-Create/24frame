import { redirect } from "next/navigation";

import { OVERVIEW_HREF } from "@/lib/overview";

export default function OverviewRedirectPage() {
  redirect(OVERVIEW_HREF);
}
