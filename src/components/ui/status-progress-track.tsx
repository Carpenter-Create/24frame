import { cn } from "@/lib/cn";
import {
  STATUS_PROGRESS_HOST_CLASS,
  STATUS_PROGRESS_LABEL_CLASS,
  STATUS_PROGRESS_OFF_CLASS,
  STATUS_PROGRESS_SEG_OFF_CLASS,
  STATUS_PROGRESS_SEG_ON_CLASS,
  STATUS_PROGRESS_TRACK_CLASS,
  deliveryStatusProgress,
  statusProgressAriaLabel,
  titleStatusProgress,
} from "@/lib/status-progress";

// Shared segmented lifecycle track. Label sits above the ticks in house meta
// type. Filled segments use the house Sporty Blue token. Off-pipeline is a
// muted greyscale badge — no track.

export function StatusProgressTrack({
  pipeline,
  status,
  liveCount = 0,
  label: labelOverride,
  className,
  ...props
}: {
  pipeline: "title" | "delivery";
  status: string;
  liveCount?: number;
  label?: string;
} & Omit<React.ComponentProps<"span">, "children">) {
  const model =
    pipeline === "title"
      ? titleStatusProgress(status, liveCount)
      : deliveryStatusProgress(status);
  const label = labelOverride ?? model.label;
  const ariaLabel = statusProgressAriaLabel({ ...model, label });

  if (model.variant === "off") {
    return (
      <span
        {...props}
        role="img"
        aria-label={ariaLabel}
        data-status-progress=""
        data-status-progress-variant="off"
        className={cn(STATUS_PROGRESS_OFF_CLASS, className)}
      >
        <span data-status-progress-label="">{label}</span>
      </span>
    );
  }

  return (
    <span
      {...props}
      data-status-progress=""
      data-status-progress-variant="pipeline"
      data-status-progress-current={model.currentIndex}
      className={cn(STATUS_PROGRESS_HOST_CLASS, className)}
    >
      <span data-status-progress-label="" className={STATUS_PROGRESS_LABEL_CLASS}>
        {label}
      </span>
      <span
        role="img"
        aria-label={ariaLabel}
        data-status-progress-track=""
        className={STATUS_PROGRESS_TRACK_CLASS}
      >
        {model.steps.map((step, index) => {
          const filled = index <= model.currentIndex;
          return (
            <span
              key={step}
              data-status-progress-seg={filled ? "filled" : "empty"}
              className={filled ? STATUS_PROGRESS_SEG_ON_CLASS : STATUS_PROGRESS_SEG_OFF_CLASS}
            />
          );
        })}
      </span>
    </span>
  );
}
