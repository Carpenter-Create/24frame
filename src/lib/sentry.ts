// Shared Sentry init for the Next.js client, Node server, and Edge runtimes.
//
// DSN is env-only. An unset or blank DSN is a deliberate no-op — local and CI
// builds must not require Sentry, and a missing Vercel var must not throw.
//
// Environment is VERCEL_ENV, not NODE_ENV: `next start` is NODE_ENV=production
// on a laptop. VERCEL_ENV is "production" only on the production deployment,
// "preview" on Preview, and unset locally.

export type SentryRuntime = "client" | "server" | "edge";
export type SentryEnvironment = "production" | "preview" | "development";
export type SentryEnv = Partial<NodeJS.ProcessEnv>;

export const SENTRY_IGNORE_ERRORS: Array<string | RegExp> = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /^Network Error$/i,
  /Failed to fetch/i,
  /NetworkError when attempting to fetch/i,
  /^(?:TypeError:\s*)?Load failed\.?$/i,
  /The operation was aborted/i,
  /The user aborted a request/i,
  /signal is aborted/i,
  /^AbortError/i,
  /^cancelled$/i,
  /network timeout/i,
  /Fetch is aborted/i,
  /Loading chunk [\w.-]+ failed/i,
  /ChunkLoadError/i,
];

const SENSITIVE_KEY =
  /(?:^|[_-])(authorization|cookie|set-cookie|token|secret|password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|auth|session|jwt|bearer|otp)(?:[_-]|$)/i;

const SUPABASE_AUTH_COOKIE = /^sb-.+-auth/i;

export type SentryScrubEvent = {
  message?: string;
  exception?: { values?: Array<{ type?: string; value?: string }> };
  request?: {
    url?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string> | string;
    query_string?: string | Array<[string, string]> | Record<string, string>;
    data?: unknown;
  };
  user?: {
    email?: string | null;
    ip_address?: string | null;
    username?: string | null;
  } | null;
  extra?: Record<string, unknown>;
  breadcrumbs?: Array<{ data?: Record<string, unknown>; message?: string }>;
};

export function sentryEnvironment(env: SentryEnv = process.env): SentryEnvironment {
  if (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview") {
    return env.VERCEL_ENV;
  }
  return "development";
}

export function sentryTracesSampleRate(env: SentryEnv = process.env): number {
  return sentryEnvironment(env) === "production" ? 0.1 : 1;
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveSentryDsn(
  runtime: SentryRuntime,
  env: SentryEnv = process.env,
): string | undefined {
  if (runtime === "client") {
    return blankToUndefined(env.NEXT_PUBLIC_SENTRY_DSN);
  }
  return (
    blankToUndefined(env.SENTRY_DSN) ?? blankToUndefined(env.NEXT_PUBLIC_SENTRY_DSN)
  );
}

export function isIgnoredSentryMessage(message: string): boolean {
  return SENTRY_IGNORE_ERRORS.some((pattern) =>
    typeof pattern === "string" ? message.includes(pattern) : pattern.test(message),
  );
}

function eventMessages(event: SentryScrubEvent): string[] {
  const values = [event.message];
  for (const exception of event.exception?.values ?? []) {
    values.push(exception.type, exception.value);
  }
  return values.filter((value): value is string => Boolean(value));
}

export function isIgnoredSentryEvent(event: SentryScrubEvent): boolean {
  return eventMessages(event).some(isIgnoredSentryMessage);
}

export function isSensitiveSentryKey(key: string): boolean {
  return (
    SENSITIVE_KEY.test(key) ||
    SUPABASE_AUTH_COOKIE.test(key) ||
    key.toLowerCase() === "code"
  );
}

function scrubCookieHeader(value: string): string {
  return value.replace(/([^=;\s]+)=([^;]*)/g, (full, name: string) =>
    isSensitiveSentryKey(name) ? `${name}=[Filtered]` : full,
  );
}

function scrubQueryString(value: string): string {
  return value.replace(
    /(^|[?&])([^=&?]+)=([^&]*)/g,
    (full, prefix: string, name: string) =>
      isSensitiveSentryKey(decodeURIComponent(name))
        ? `${prefix}${name}=[Filtered]`
        : full,
  );
}

function scrubUrl(value: string): string {
  const withoutPortalToken = value.replace(
    /\/portal\/[^/?#]+/gi,
    (match: string, offset: number) =>
      value.slice(offset - 4, offset) === "/api" ? match : "/portal/[Filtered]",
  );
  const queryIndex = withoutPortalToken.indexOf("?");
  if (queryIndex === -1) return withoutPortalToken;
  return (
    withoutPortalToken.slice(0, queryIndex) +
    scrubQueryString(withoutPortalToken.slice(queryIndex))
  );
}

function scrubUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubUnknown);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) {
    next[key] = isSensitiveSentryKey(key) ? "[Filtered]" : scrubUnknown(nested);
  }
  return next;
}

function scrubRequest(event: SentryScrubEvent): void {
  const request = event.request;
  if (!request) return;

  if (typeof request.url === "string") {
    request.url = scrubUrl(request.url);
  }

  if (request.headers) {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (isSensitiveSentryKey(key) || key.toLowerCase() === "cookie") {
        headers[key] =
          key.toLowerCase() === "cookie" ? scrubCookieHeader(value) : "[Filtered]";
      } else {
        headers[key] = value;
      }
    }
    request.headers = headers;
  }

  if (typeof request.cookies === "string") {
    request.cookies = scrubCookieHeader(request.cookies);
  } else if (request.cookies) {
    const cookies: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.cookies)) {
      cookies[key] = isSensitiveSentryKey(key) ? "[Filtered]" : value;
    }
    request.cookies = cookies;
  }

  if (typeof request.query_string === "string") {
    request.query_string = scrubQueryString(request.query_string);
  } else if (Array.isArray(request.query_string)) {
    request.query_string = request.query_string.map(
      ([key, value]): [string, string] =>
        isSensitiveSentryKey(key) ? [key, "[Filtered]"] : [key, value],
    );
  } else if (request.query_string) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.query_string)) {
      query[key] = isSensitiveSentryKey(key) ? "[Filtered]" : value;
    }
    request.query_string = query;
  }

  if (request.data !== undefined) {
    request.data = scrubUnknown(request.data);
  }
}

export function scrubSentryPayload<T extends SentryScrubEvent>(event: T): T {
  scrubRequest(event);

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  if (event.extra) {
    event.extra = scrubUnknown(event.extra) as Record<string, unknown>;
  }

  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      if (crumb.message) {
        crumb.message = scrubUrl(crumb.message);
      }
      if (crumb.data) {
        const data = scrubUnknown(crumb.data) as Record<string, unknown>;
        for (const [key, nested] of Object.entries(data)) {
          if (typeof nested === "string") {
            data[key] = scrubUrl(nested);
          }
        }
        crumb.data = data;
      }
    }
  }

  return event;
}

export function scrubSentryEvent<T extends SentryScrubEvent>(event: T): T | null {
  if (isIgnoredSentryEvent(event)) return null;
  return scrubSentryPayload(event);
}

export function scrubSentryTransaction<T extends SentryScrubEvent>(event: T): T {
  return scrubSentryPayload(event);
}

export type SentrySharedInit = {
  dsn: string;
  environment: SentryEnvironment;
  tracesSampleRate: number;
  sendDefaultPii: false;
  enableLogs: false;
  ignoreErrors: Array<string | RegExp>;
  beforeSend: typeof scrubSentryEvent;
  beforeSendTransaction: typeof scrubSentryTransaction;
};

export function sentryInitOptions(
  runtime: SentryRuntime,
  env: SentryEnv = process.env,
): SentrySharedInit | undefined {
  const dsn = resolveSentryDsn(runtime, env);
  if (!dsn) return undefined;

  return {
    dsn,
    environment: sentryEnvironment(env),
    tracesSampleRate: sentryTracesSampleRate(env),
    sendDefaultPii: false,
    enableLogs: false,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryTransaction,
  };
}
