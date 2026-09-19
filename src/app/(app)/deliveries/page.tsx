import { redirect } from "next/navigation";

import { TITLES_HREF } from "@/lib/title-public-id";

// Client Aggregation Deliveries is gone. Nested endpoint status lives on
// Dashboard Licensing status and Titles. Staff queue stays at /aggregation/gc/deliveries.
export default function DeliveriesRedirectPage() {
  redirect(TITLES_HREF);
}
