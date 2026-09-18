import { redirect } from "next/navigation";

// Client Aggregation Deliveries is gone. Nested endpoint status lives on
// Dashboard Licensing status and Titles. Staff queue stays at /gc/deliveries.
export default function DeliveriesRedirectPage() {
  redirect("/titles");
}
