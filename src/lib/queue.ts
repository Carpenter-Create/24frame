import { CATALOG_LIFECYCLE_STATES } from "@/lib/titles-catalog";
import type { TitleStatus } from "@/lib/titles";
import { aggregationPath } from "@/lib/workspace";

// Staff /queue copy and staff-column helpers. The page consumes the Titles
// catalog list primitive — this file does not own a second row grammar.
// Active work is the live title_status values in_review and in_delivery.
//
// Submitted date: prefer the first titles audit_log update whose after.status
// is submitted or in_review (the submit / in_review transition). When that
// row is missing or the bounded audit read did not include it, fall back to
// titles.created_at — never invent a submit clock.
//
// Submitter: titles.created_by → profiles.display_name. profiles has no
// email column, so a missing name is "—", not a guessed address.

export const QUEUE_HREF = aggregationPath("queue");

export const QUEUE_PAGE = {
  title: "Queue",
  empty: "Nothing waiting.",
} as const;

export const QUEUE_ACTIVE_STATUSES = ["in_review", "in_delivery"] as const satisfies readonly TitleStatus[];

export const QUEUE_SUBMIT_TRANSITION_STATUSES = ["submitted", "in_review"] as const satisfies readonly TitleStatus[];

const QUEUE_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function isQueueActiveStatus(status: string): status is (typeof QUEUE_ACTIVE_STATUSES)[number] {
  return (QUEUE_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export function queueActiveStatuses(): readonly TitleStatus[] {
  return QUEUE_ACTIVE_STATUSES.filter((status) =>
    (CATALOG_LIFECYCLE_STATES as readonly string[]).includes(status),
  );
}

export function queueSubmitterLabel(displayName: string | null | undefined): string {
  const name = displayName?.trim();
  return name ? name : "—";
}

export function queueOrgName(name: string | null | undefined): string {
  const org = name?.trim();
  return org ? org : "—";
}

export function queueSubmittedAt(
  createdAt: string,
  submitTransitionAt: string | null | undefined,
): string {
  return submitTransitionAt || createdAt;
}

export function queueSubmittedDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return QUEUE_DATE_FMT.format(date);
}

export function auditAfterStatus(after: unknown): string | null {
  if (!after || typeof after !== "object") return null;
  const status = (after as { status?: unknown }).status;
  return typeof status === "string" ? status : null;
}

export function isSubmitTransitionStatus(status: string | null | undefined): boolean {
  return !!status && (QUEUE_SUBMIT_TRANSITION_STATUSES as readonly string[]).includes(status);
}

/** First submit / in_review transition per title. Caller must pass events oldest-first. */
export function collectFirstSubmitAts(
  events: ReadonlyArray<{ entity_id: string | null; at: string; after?: unknown }>,
): Map<string, string> {
  const first = new Map<string, string>();
  for (const event of events) {
    if (!event.entity_id || first.has(event.entity_id)) continue;
    if (isSubmitTransitionStatus(auditAfterStatus(event.after))) {
      first.set(event.entity_id, event.at);
    }
  }
  return first;
}
