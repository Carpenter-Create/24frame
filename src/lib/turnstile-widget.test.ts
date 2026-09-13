import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PORTAL_TURNSTILE_OPTIONS, TURNSTILE_WIDGET_SIZE } from "./turnstile-widget";

const loginSrc = readFileSync("src/app/login/login-form.tsx", "utf8");
const loginActionsSrc = readFileSync("src/app/login/actions.ts", "utf8");
const portalSrc = readFileSync("src/app/portal/[token]/portal-flow.tsx", "utf8");
const portalOtpSrc = readFileSync("src/app/api/portal/request-otp/route.ts", "utf8");

describe("Turnstile widget size lock", () => {
  it("always sets an explicit size so marsidev does not emit style={}", () => {
    expect(TURNSTILE_WIDGET_SIZE).toBe("flexible");
    expect(PORTAL_TURNSTILE_OPTIONS.size).toBe(TURNSTILE_WIDGET_SIZE);
  });

  it("is consumed by portal OTP only — dashboard login has no widget", () => {
    expect(loginSrc).not.toContain("LOGIN_TURNSTILE_OPTIONS");
    expect(loginSrc).not.toContain("<Turnstile");
    expect(loginSrc).not.toContain("@marsidev/react-turnstile");
    expect(loginActionsSrc).not.toContain("verifyTurnstile");
    expect(loginActionsSrc).not.toContain("cf-turnstile-response");

    expect(portalSrc).toContain("PORTAL_TURNSTILE_OPTIONS");
    expect(portalSrc).toContain("<Turnstile");
    expect(portalOtpSrc).toContain("verifyTurnstile");
  });
});
