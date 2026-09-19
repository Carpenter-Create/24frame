import { redirect } from "next/navigation";

import { QUEUE_HREF } from "@/lib/queue";

// Findings folded into the Queue (shown as a per-title flag there, and listed on each
// title's detail). This route now redirects.
export default function GcFindingsRedirect() {
  redirect(QUEUE_HREF);
}
