import { cn } from "@/lib/cn";

// Canonical text-entry type. House t-body is 15px and t-body-sm is 13px.
// iOS Safari zooms the page when a focused input/textarea is under 16px.
// One size for every focusable text control — do not restyle per surface.
// No maximum-scale viewport hack.

export const FORM_CONTROL_TEXT_CLASS = "t-control";

export const FORM_CONTROL_BOX_CLASS =
  "w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent";

export const FORM_CONTROL_BARE_CLASS =
  "min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-3";

export type FormControlVariant = "box" | "bare";

export function formControlClass(
  variant: FormControlVariant = "box",
  className?: string,
) {
  return cn(
    FORM_CONTROL_TEXT_CLASS,
    variant === "bare" ? FORM_CONTROL_BARE_CLASS : FORM_CONTROL_BOX_CLASS,
    className,
  );
}
