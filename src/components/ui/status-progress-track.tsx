import { cn } from "@/lib/cn";
import {
  STATUS_PROGRESS_HOST_CLASS,
  STATUS_PROGRESS_LABEL_CLASS,
  STATUS_PROGRESS_OFF_CLASS,
  STATUS_PROGRESS_SEG_OFF_CLASS,
  STATUS_PROGRESS_SEG_ON_CLASS,
  STATUS_PROGRESS_TRACK_CLASS,
  statusProgressAriaLabel,
  type StatusProgressVariant,
} from "@/lib/status-progress";

// Shared segmented lifecycle track. Filled segments use the house Sporty Blue
// token. Off-pipeline is a muted greyscale badge — no track.

export function StatusProgressTrack({
  steps,
  currentIndex,
  label,
  variant = "pipeline",
  className,
  ...props
}: {
  steps: readonly string[];
  currentIndex: number;
  label: string;
  variant?: StatusProgressVariant;
} & Omit<React.ComponentProps<"span">, "children">) {
  const model = { steps, currentIndex, label, variant };
  const ariaLabel = statusProgressAriaLabel(model);

  if (variant === "off") {
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
      data-status-progress-current={currentIndex}
      className={cn(STATUS_PROGRESS_HOST_CLASS, className)}
    >
      <span
        role="img"
        aria-label={ariaLabel}
        data-status-progress-track=""
        className={STATUS_PROGRESS_TRACK_CLASS}
      >
        {steps.map((step, index) => {
          const filled = index <= currentIndex;
          return (
            <span
              key={step}
              data-status-progress-seg={filled ? "filled" : "empty"}
              className={filled ? STATUS_PROGRESS_SEG_ON_CLASS : STATUS_PROGRESS_SEG_OFF_CLASS}
            />
          );
        })}
      </span>
      <span data-status-progress-label="" className={STATUS_PROGRESS_LABEL_CLASS}>
        {label}
      </span>
    </span>
  );
}
