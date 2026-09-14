import { UNPAGINATED_MAX } from "@/lib/list-bounds";

// Staff /gc/deliveries empty. Client /deliveries keeps DELIVERIES_NO_DATA
// (title without a period, plus a support line). Do not restyle that surface.
export const GC_DELIVERIES_EMPTY = {
  title: "No deliveries yet.",
  actionLabel: "View titles",
  actionHref: "/titles",
} as const;

// Honesty copy when a companion list hits the probe cap. A short list that looks
// finished is the failure — same contract as the catalog truncation notice.
export const GC_DELIVERIES_TRUNCATED = {
  grants: `Showing the first ${UNPAGINATED_MAX} active grants. More exist — this list is not complete.`,
  companions:
    "Portal records for the deliveries on this page were cut off. Links, sessions, or the access log may be incomplete.",
} as const;
