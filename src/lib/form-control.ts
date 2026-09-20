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

// Search + dictate hosts share FORM_CONTROL_FOCUS_CLASS. focus-within
// keeps the pill/field chrome calm when the circular mic is focused.
export const HOUSE_VOICE_FOCUS_HOST_CLASS =
  `${FORM_CONTROL_FOCUS_CLASS} focus-within:border-hairline focus-within:outline-none focus-within:ring-0`;

export const HOUSE_VOICE_FIELD_HOST_CLASS = `flex items-start gap-2 rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 ${HOUSE_VOICE_FOCUS_HOST_CLASS}`;

export const HOUSE_VOICE_MIC_CLASS = `flex size-7 shrink-0 items-center justify-center rounded-full text-ink-2 ${FORM_CONTROL_FOCUS_CLASS}`;

export const HOUSE_VOICE_MIC_LISTENING_CLASS = "bg-surface-muted text-ink";

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
