import { redirect } from "next/navigation";

import { OVERVIEW_HREF } from "@/lib/overview";

// Former Overview door. Home pulse lives at /home.
export default function OverviewRedirectPage() {
  redirect(OVERVIEW_HREF);
}
