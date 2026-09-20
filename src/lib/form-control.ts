import { cn } from "@/lib/cn";

// Canonical text-entry type. House t-body is 15px and t-body-sm is 13px.
// iOS Safari zooms the page when a focused input/textarea is under 16px.
// One size for every focusable text control — do not restyle per surface.
// No maximum-scale viewport hack.

export const FORM_CONTROL_TEXT_CLASS = "t-control";

// Calm house focus for every search / text field. Hairline ink —
// never Sporty Blue, never a thick accent ring. Buttons and links
// keep the global :focus-visible accent in globals.css.
// One primitive: box + bare both consume this. No per-surface fork.
export const FORM_CONTROL_FOCUS_CLASS =
  "outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";

export const FORM_CONTROL_BOX_CLASS =
  `w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-ink ${FORM_CONTROL_FOCUS_CLASS} transition-colors placeholder:text-ink-3 focus:border-ink-3`;

// House search / in-pill fields. Caret is ink — never Sporty Blue
// (browser default / accent-color). Focus is the same calm SoT;
// the pill is the chrome, so the field itself stays borderless.
export const FORM_CONTROL_BARE_CLASS =
  `min-w-0 bg-transparent text-ink caret-ink accent-ink ${FORM_CONTROL_FOCUS_CLASS} focus:border-transparent placeholder:text-ink-3`;

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
