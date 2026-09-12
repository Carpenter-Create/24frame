// Client-side Turnstile widget options. Server verification stays in turnstile.ts.
//
// @marsidev/react-turnstile applies container style={} when `size` is omitted.
// Safari paints that idle iframe as a grey box showing literal "{}". Always pass
// an explicit size so the library emits real dimensions instead of {}.

export const TURNSTILE_WIDGET_SIZE = "flexible" as const;

/** Login magic-link: managed/invisible until a challenge is actually required. */
export const LOGIN_TURNSTILE_OPTIONS = {
  appearance: "interaction-only",
  size: TURNSTILE_WIDGET_SIZE,
} as const;

/** Portal OTP: visible challenge (submit waits on the token). Same size lock. */
export const PORTAL_TURNSTILE_OPTIONS = {
  size: TURNSTILE_WIDGET_SIZE,
} as const;
