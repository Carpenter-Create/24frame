import { NOTIFICATION_EMAIL } from "@/lib/notifications";
import { quoteTitleName } from "@/lib/titles-lifecycle";
import {
  gcTitleStatusLabel,
  TITLE_STATUS_LABELS,
  type TitleStatus,
} from "@/lib/titles";

// GC title status override. Copy and lock-in live here, not in JSX.
// Write authority is gc_set_title_status. This module decides the control
// and the lock formula the UI shares with that RPC.
//
// Approved for lock-in is the founder pair in_delivery | live — not
// POST_APPROVAL_TITLE_STATUSES (those include takedown_*).
// Delivered-to is delivery_status delivered | live. pending is not delivered.
// Reporting is the existing title_has_reporting_activity SoT.

export const APPROVED_TITLE_STATUSES = ["in_delivery", "live"] as const;
export type ApprovedTitleStatus = (typeof APPROVED_TITLE_STATUSES)[number];

export const DELIVERED_ENDPOINT_STATUSES = ["delivered", "live"] as const;
export type DeliveredEndpointStatus = (typeof DELIVERED_ENDPOINT_STATUSES)[number];

export const TITLE_STATUS_OVERRIDE_VALUES = Object.keys(TITLE_STATUS_LABELS) as TitleStatus[];

export const TITLE_STATUS_OVERRIDE = {
  label: "Status",
  reasonLabel: "Reason",
  reasonPlaceholder: "Reason (required)",
  reasonRequired: "A reason is required to set title status.",
  confirm: "Set status",
  confirmTitle: "Set title status",
  cancelLabel: "Cancel",
  locked:
    "Status cannot change. This title is Approved and has a delivered endpoint or reporting activity. Archive it to leave the active catalog.",
} as const;

export function isApprovedTitleStatus(status: string): status is ApprovedTitleStatus {
  return (APPROVED_TITLE_STATUSES as readonly string[]).includes(status);
}

export function isDeliveredEndpointStatus(status: string): status is DeliveredEndpointStatus {
  return (DELIVERED_ENDPOINT_STATUSES as readonly string[]).includes(status);
}

export function titleHasDeliveredEndpoint(
  deliveries: readonly { status: string }[],
): boolean {
  return deliveries.some((row) => isDeliveredEndpointStatus(row.status));
}

// Shared helper used by the GC control. SQL title_status_override_locked is
// the same formula: Approved ∧ (hasDeliveredEndpoint ∨ hasReportingActivity).
export function titleStatusOverrideLocked(input: {
  status: TitleStatus | string;
  hasDeliveredEndpoint: boolean;
  hasReportingActivity: boolean;
}): boolean {
  return (
    isApprovedTitleStatus(input.status) &&
    (input.hasDeliveredEndpoint || input.hasReportingActivity)
  );
}

export function titleStatusOverrideConfirmBody(name: string, status: TitleStatus): string {
  return `${quoteTitleName(name)} will move to ${gcTitleStatusLabel(status)}.`;
}

export type TitleStatusOverrideNotify = {
  kind: "title_rejected";
  title: string;
  body: string;
  subject: string;
  cta: string;
  path: string;
};

export function titleStatusOverrideShouldNotify(status: TitleStatus | string): boolean {
  return status === "draft" || status === "in_review";
}

export function titleStatusOverrideNotifyCopy(
  to: TitleStatus,
  titleName: string,
  reason: string,
  titleId: string,
): TitleStatusOverrideNotify | null {
  if (!titleStatusOverrideShouldNotify(to)) return null;
  const trimmed = reason.trim();
  const { cta, path } = NOTIFICATION_EMAIL.title_rejected.link({ titleId });
  if (to === "draft") {
    return {
      kind: "title_rejected",
      title: "Title returned for amendment",
      body: `"${titleName}" was returned for amendment: ${trimmed}`,
      subject: `"${titleName}" was returned for amendment`,
      cta,
      path,
    };
  }
  return {
    kind: "title_rejected",
    title: "Title needs review",
    body: `"${titleName}" needs review: ${trimmed}`,
    subject: `"${titleName}" needs review`,
    cta,
    path,
  };
}

export function titleStatusOverrideOptionLabel(status: TitleStatus): string {
  return gcTitleStatusLabel(status);
}
