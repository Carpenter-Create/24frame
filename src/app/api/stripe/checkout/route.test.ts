import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveDashboardOrigin } from "@/lib/auth-magic-link";

const EVIL = "https://evil.example";
const RETURN_PATH = "/onboarding/complete?session_id={CHECKOUT_SESSION_ID}";
const routeSrc = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

describe("POST /api/stripe/checkout return_url origin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds return_url from resolveDashboardOrigin, not raw Origin", () => {
    expect(routeSrc).toContain(
      'import { resolveDashboardOrigin } from "@/lib/auth-magic-link"',
    );
    expect(routeSrc).toContain(
      'const origin = resolveDashboardOrigin((await headers()).get("origin"));',
    );
    expect(routeSrc).toContain(
      `return_url: \`\${origin}${RETURN_PATH}\``,
    );
    expect(routeSrc).not.toMatch(/\.get\("origin"\)\s*\?\?/);
  });

  it("replaces a foreign Origin with the allowlisted dashboard origin", () => {
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    const origin = resolveDashboardOrigin(EVIL);
    expect(origin).toBe("https://app.24frame.co");
    expect(`${origin}${RETURN_PATH}`).toBe(
      `https://app.24frame.co${RETURN_PATH}`,
    );
    expect(`${origin}${RETURN_PATH}`).not.toContain(EVIL);
  });
});
