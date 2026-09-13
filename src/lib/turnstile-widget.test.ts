import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  LOGIN_TURNSTILE_OPTIONS,
  LOGIN_TURNSTILE_SIZE,
  PORTAL_TURNSTILE_OPTIONS,
  TURNSTILE_WIDGET_SIZE,
} from "./turnstile-widget";

const loginSrc = readFileSync("src/app/login/login-form.tsx", "utf8");
const portalSrc = readFileSync("src/app/portal/[token]/portal-flow.tsx", "utf8");

describe("Turnstile widget size lock", () => {
  it("always sets an explicit size so marsidev does not emit style={}", () => {
    expect(TURNSTILE_WIDGET_SIZE).toBe("flexible");
    expect(LOGIN_TURNSTILE_SIZE).toBe("normal");
    expect(LOGIN_TURNSTILE_OPTIONS.size).toBe(LOGIN_TURNSTILE_SIZE);
    expect(LOGIN_TURNSTILE_OPTIONS.appearance).toBe("interaction-only");
    expect(LOGIN_TURNSTILE_OPTIONS.responseField).toBe(false);
    expect(PORTAL_TURNSTILE_OPTIONS.size).toBe(TURNSTILE_WIDGET_SIZE);
  });

  it("is consumed by login magic-link and portal OTP, without dropping Turnstile", () => {
    expect(loginSrc).toContain("LOGIN_TURNSTILE_OPTIONS");
    expect(loginSrc).toContain("<Turnstile");
    expect(loginSrc).toContain("onSuccess={markReady}");
    expect(loginSrc).toContain('name="cf-turnstile-response"');
    expect(loginSrc).toContain("disabled={pending || !token}");
    expect(loginSrc).toContain("if (!token) event.preventDefault()");
    expect(loginSrc).toContain("turnstileRef.current?.reset()");
    expect(loginSrc).not.toMatch(/options=\{\{\s*appearance:\s*"interaction-only"\s*\}\}/);

    expect(portalSrc).toContain("PORTAL_TURNSTILE_OPTIONS");
    expect(portalSrc).toContain("<Turnstile");
    expect(portalSrc).toContain("disabled={busy || !turnstileToken}");
  });
});
