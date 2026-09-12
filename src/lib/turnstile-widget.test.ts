import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  LOGIN_TURNSTILE_OPTIONS,
  PORTAL_TURNSTILE_OPTIONS,
  TURNSTILE_WIDGET_SIZE,
} from "./turnstile-widget";

const loginSrc = readFileSync("src/app/login/login-form.tsx", "utf8");
const portalSrc = readFileSync("src/app/portal/[token]/portal-flow.tsx", "utf8");

describe("Turnstile widget size lock", () => {
  it("always sets an explicit size so marsidev does not emit style={}", () => {
    expect(TURNSTILE_WIDGET_SIZE).toBe("flexible");
    expect(LOGIN_TURNSTILE_OPTIONS.size).toBe(TURNSTILE_WIDGET_SIZE);
    expect(LOGIN_TURNSTILE_OPTIONS.appearance).toBe("interaction-only");
    expect(PORTAL_TURNSTILE_OPTIONS.size).toBe(TURNSTILE_WIDGET_SIZE);
  });

  it("is consumed by login magic-link and portal OTP, without dropping Turnstile", () => {
    expect(loginSrc).toContain("LOGIN_TURNSTILE_OPTIONS");
    expect(loginSrc).toContain("<Turnstile");
    expect(loginSrc).not.toMatch(/options=\{\{\s*appearance:\s*"interaction-only"\s*\}\}/);

    expect(portalSrc).toContain("PORTAL_TURNSTILE_OPTIONS");
    expect(portalSrc).toContain("<Turnstile");
  });
});
