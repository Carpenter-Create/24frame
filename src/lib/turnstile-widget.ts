// Client-side Turnstile widget options. Server verification stays in turnstile.ts.
//
// @marsidev/react-turnstile applies container style={} when `size` is omitted.
// Safari paints that idle iframe as a grey box showing literal "{}". Always pass
// an explicit size so the library emits real dimensions instead of {}.

export const TURNSTILE_WIDGET_SIZE = "flexible" as const;

// Login is interaction-only. `flexible` is a visible-widget size (min 300px) and
// must not be forwarded to Cloudflare here — Safari will submit before a token
// exists if the widget is still settling. `normal` is a valid CF size; marsidev
// still emits real container dimensions so Safari does not paint style={}.
export const LOGIN_TURNSTILE_SIZE = "normal" as const;

/** Login magic-link: managed/invisible until a challenge is actually required. */
export const LOGIN_TURNSTILE_OPTIONS = {
  appearance: "interaction-only",
  size: LOGIN_TURNSTILE_SIZE,
  // We own the hidden field from onSuccess. CF's injected input is easy for
  // Safari to submit empty on the first tap.
  responseField: false,
} as const;

/** Portal OTP: visible challenge (submit waits on the token). Same size lock. */
export const PORTAL_TURNSTILE_OPTIONS = {
  size: TURNSTILE_WIDGET_SIZE,
} as const;
