import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  isIgnoredSentryMessage,
  isSensitiveSentryKey,
  resolveSentryDsn,
  scrubSentryEvent,
  sentryEnvironment,
  sentryInitOptions,
  sentryTracesSampleRate,
} from "./sentry";

const CONFIG_FILES = [
  "src/lib/sentry.ts",
  "src/instrumentation.ts",
  "src/instrumentation-client.ts",
  "src/sentry.server.config.ts",
  "src/sentry.edge.config.ts",
  "next.config.ts",
  "src/app/global-error.tsx",
  "src/app/error.tsx",
  "src/app/(app)/error.tsx",
] as const;

describe("Sentry environment and sampling", () => {
  it("tags production, preview, and local from VERCEL_ENV not NODE_ENV", () => {
    expect(sentryEnvironment({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(
      "production",
    );
    expect(sentryEnvironment({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(
      "preview",
    );
    expect(sentryEnvironment({ NODE_ENV: "production" })).toBe("development");
    expect(sentryEnvironment({})).toBe("development");
  });

  it("keeps production traces conservative and samples preview/dev fully", () => {
    expect(sentryTracesSampleRate({ VERCEL_ENV: "production" })).toBe(0.1);
    expect(sentryTracesSampleRate({ VERCEL_ENV: "preview" })).toBe(1);
    expect(sentryTracesSampleRate({})).toBe(1);
  });
});

describe("Sentry DSN resolution", () => {
  it("no-ops when DSN env is missing or blank", () => {
    expect(resolveSentryDsn("client", {})).toBeUndefined();
    expect(resolveSentryDsn("server", { SENTRY_DSN: "  " })).toBeUndefined();
    expect(sentryInitOptions("edge", {})).toBeUndefined();
  });

  it("reads client DSN only from NEXT_PUBLIC_SENTRY_DSN", () => {
    expect(
      resolveSentryDsn("client", {
        SENTRY_DSN: "https://server@example.invalid/1",
        NEXT_PUBLIC_SENTRY_DSN: "https://public@example.invalid/1",
      }),
    ).toBe("https://public@example.invalid/1");
    expect(
      resolveSentryDsn("client", { SENTRY_DSN: "https://server@example.invalid/1" }),
    ).toBeUndefined();
  });

  it("prefers SENTRY_DSN on server/edge and falls back to the public name", () => {
    expect(
      resolveSentryDsn("server", {
        SENTRY_DSN: "https://server@example.invalid/1",
        NEXT_PUBLIC_SENTRY_DSN: "https://public@example.invalid/1",
      }),
    ).toBe("https://server@example.invalid/1");
    expect(
      resolveSentryDsn("edge", {
        NEXT_PUBLIC_SENTRY_DSN: "https://public@example.invalid/1",
      }),
    ).toBe("https://public@example.invalid/1");
  });

  it("returns init options only when a DSN is present", () => {
    const options = sentryInitOptions("server", {
      SENTRY_DSN: "https://server@example.invalid/1",
      VERCEL_ENV: "production",
    });
    expect(options).toMatchObject({
      dsn: "https://server@example.invalid/1",
      environment: "production",
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      enableLogs: false,
    });
  });
});

describe("Sentry ignore and scrubbing", () => {
  it("ignores ResizeObserver and transient network noise", () => {
    expect(isIgnoredSentryMessage("ResizeObserver loop limit exceeded")).toBe(true);
    expect(
      isIgnoredSentryMessage(
        "ResizeObserver loop completed with undelivered notifications.",
      ),
    ).toBe(true);
    expect(isIgnoredSentryMessage("Failed to fetch")).toBe(true);
    expect(isIgnoredSentryMessage("NetworkError when attempting to fetch resource.")).toBe(
      true,
    );
    expect(isIgnoredSentryMessage("Load failed")).toBe(true);
    expect(isIgnoredSentryMessage("The operation was aborted.")).toBe(true);
    expect(isIgnoredSentryMessage("TypeError: Network Error")).toBe(false);
    expect(isIgnoredSentryMessage("Rights grant update failed")).toBe(false);
  });

  it("drops ignored events in beforeSend", () => {
    expect(
      scrubSentryEvent({
        exception: { values: [{ value: "ResizeObserver loop limit exceeded" }] },
      }),
    ).toBeNull();
  });

  it("scrubs auth cookies, headers, and tokens without touching other fields", () => {
    const event = scrubSentryEvent({
      request: {
        headers: {
          authorization: "Bearer secret-token",
          cookie:
            "sb-abc-auth-token=jwt.here; theme=light; refresh_token=abc; locale=en",
          "content-type": "application/json",
        },
        cookies: {
          "sb-abc-auth-token": "jwt.here",
          theme: "light",
        },
        query_string: "access_token=abc&title=heat",
        data: { access_token: "abc", title: "Heat" },
      },
      user: {
        email: "rights@example.com",
        ip_address: "203.0.113.10",
        username: "rights-holder",
      },
      extra: { authorization: "Bearer x", titleId: "t1" },
      breadcrumbs: [{ data: { authorization: "Bearer x", path: "/titles" } }],
    });

    expect(event).not.toBeNull();
    expect(event?.request?.headers?.authorization).toBe("[Filtered]");
    expect(event?.request?.headers?.cookie).toContain("sb-abc-auth-token=[Filtered]");
    expect(event?.request?.headers?.cookie).toContain("theme=light");
    expect(event?.request?.headers?.cookie).toContain("refresh_token=[Filtered]");
    expect(event?.request?.headers?.["content-type"]).toBe("application/json");
    expect(event?.request?.cookies).toEqual({
      "sb-abc-auth-token": "[Filtered]",
      theme: "light",
    });
    expect(event?.request?.query_string).toBe("access_token=[Filtered]&title=heat");
    expect(event?.request?.data).toEqual({ access_token: "[Filtered]", title: "Heat" });
    expect(event?.user).toEqual({});
    expect(event?.extra).toEqual({ authorization: "[Filtered]", titleId: "t1" });
    expect(event?.breadcrumbs?.[0]?.data).toEqual({
      authorization: "[Filtered]",
      path: "/titles",
    });
  });

  it("treats supabase auth cookies and authorization as sensitive", () => {
    expect(isSensitiveSentryKey("sb-uevsculwzwlhxeamagwg-auth-token")).toBe(true);
    expect(isSensitiveSentryKey("Authorization")).toBe(true);
    expect(isSensitiveSentryKey("theme")).toBe(false);
  });
});

describe("Sentry wiring contract", () => {
  it("does not hardcode a DSN and skips source-map upload", () => {
    for (const file of CONFIG_FILES) {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/https:\/\/[^\s'"]+@o\d+\.ingest/i);
      expect(src).not.toMatch(/dsn:\s*["']https:/);
    }
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain("withSentryConfig");
    expect(nextConfig).toContain("sourcemaps: { disable: true }");
    expect(nextConfig).not.toContain("authToken:");
    expect(readFileSync("src/middleware.ts", "utf8")).toContain("sentry-tunnel");
  });

  it("reports from App Router error boundaries", () => {
    expect(readFileSync("src/app/error.tsx", "utf8")).toContain("captureException");
    expect(readFileSync("src/app/(app)/error.tsx", "utf8")).toContain("captureException");
    expect(readFileSync("src/app/global-error.tsx", "utf8")).toContain("captureException");
    expect(readFileSync("src/app/(app)/education/error.tsx", "utf8")).toContain(
      "captureException",
    );
    expect(
      readFileSync("src/app/(app)/education/[slug]/error.tsx", "utf8"),
    ).toContain("captureException");
  });
});
