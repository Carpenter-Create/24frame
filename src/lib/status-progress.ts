import { TITLE_STATUS_LABELS, type DeliveryStatus, type TitleStatus } from "@/lib/titles";

// Segmented Sporty Blue lifecycle track for Titles + Deliveries list rows.
// Pipeline fill is inclusive through the current stage. Off-pipeline statuses
// stay a muted badge — no track, no rainbow, no continuous %.
// Track labels are stage names. Do not reuse the client TITLE_STATUS_LABELS
// quirk that maps in_delivery → "Submitted" on this control.

export const TITLE_STATUS_TRACK_STEPS = [
  "Draft",
  "Submitted",
  "In review",
  "In delivery",
  "Live",
] as const;

export const TITLE_STATUS_TRACK_KEYS = [
  "draft",
  "submitted",
  "in_review",
  "in_delivery",
  "live",
] as const;

export const TITLE_STATUS_OFF_TRACK = [
  "takedown_requested",
  "taken_down",
] as const;

export const DELIVERY_STATUS_TRACK_STEPS = ["Pending", "Delivered", "Live"] as const;

export const DELIVERY_STATUS_TRACK_KEYS = ["pending", "delivered", "live"] as const;

export const DELIVERY_STATUS_OFF_TRACK = ["rejected", "taken_down"] as const;

const TITLE_OFF = new Set<string>(TITLE_STATUS_OFF_TRACK);
const DELIVERY_OFF = new Set<string>(DELIVERY_STATUS_OFF_TRACK);

export type StatusProgressVariant = "pipeline" | "off";

export type StatusProgressModel = {
  steps: readonly string[];
  currentIndex: number;
  label: string;
  variant: StatusProgressVariant;
};

export const STATUS_PROGRESS_HOST_CLASS =
  "flex w-[7.5rem] shrink-0 flex-col items-stretch gap-[2px]";

export const STATUS_PROGRESS_TRACK_CLASS =
  "flex h-[3px] w-full gap-px overflow-hidden rounded-full";

export const STATUS_PROGRESS_SEG_ON_CLASS = "min-w-0 flex-1 bg-accent";

export const STATUS_PROGRESS_SEG_OFF_CLASS = "min-w-0 flex-1 bg-surface-muted";

export const STATUS_PROGRESS_LABEL_CLASS = "t-label text-ink-3";

export const STATUS_PROGRESS_OFF_CLASS =
  "inline-flex w-fit shrink-0 items-center rounded-full border border-hairline px-[var(--space-3)] py-[var(--space-1)] t-body-sm text-ink-2";

function titleOffLabel(status: string): string {
  return status in TITLE_STATUS_LABELS
    ? TITLE_STATUS_LABELS[status as TitleStatus]
    : status;
}

/**
 * Titles list/detail track. Live is the `live` enum or derived live when
 * ≥1 delivery is live — same rollup gate as titleDisplayStatus, without
 * inventing DB state. Official off-pipeline is takedown only; any other
 * existing product signal that is not on-track stays a muted badge.
 */
export function titleStatusProgress(
  status: TitleStatus | string,
  liveCount = 0,
): StatusProgressModel {
  const steps = TITLE_STATUS_TRACK_STEPS;
  if (TITLE_OFF.has(status)) {
    return {
      steps,
      currentIndex: -1,
      label: titleOffLabel(status),
      variant: "off",
    };
  }
  if (status === "live" || liveCount > 0) {
    return {
      steps,
      currentIndex: steps.length - 1,
      label: steps[steps.length - 1],
      variant: "pipeline",
    };
  }
  const currentIndex = (TITLE_STATUS_TRACK_KEYS as readonly string[]).indexOf(status);
  if (currentIndex === -1) {
    return {
      steps,
      currentIndex: -1,
      label: titleOffLabel(status),
      variant: "off",
    };
  }
  return {
    steps,
    currentIndex,
    label: steps[currentIndex],
    variant: "pipeline",
  };
}

export function deliveryStatusProgress(
  status: DeliveryStatus | string,
): StatusProgressModel {
  const steps = DELIVERY_STATUS_TRACK_STEPS;
  if (DELIVERY_OFF.has(status)) {
    return {
      steps,
      currentIndex: -1,
      label: status === "rejected" ? "Rejected" : "Taken down",
      variant: "off",
    };
  }
  const currentIndex = (DELIVERY_STATUS_TRACK_KEYS as readonly string[]).indexOf(status);
  if (currentIndex === -1) {
    return {
      steps,
      currentIndex: -1,
      label: status,
      variant: "off",
    };
  }
  return {
    steps,
    currentIndex,
    label: steps[currentIndex],
    variant: "pipeline",
  };
}

export function statusProgressAriaLabel(model: StatusProgressModel): string {
  if (model.variant === "off" || model.currentIndex < 0) return model.label;
  return `${model.label}, step ${model.currentIndex + 1} of ${model.steps.length}`;
}

export function statusProgressFilledCount(model: StatusProgressModel): number {
  if (model.variant === "off" || model.currentIndex < 0) return 0;
  return model.currentIndex + 1;
}
