// Last-seen stamp for Dashboard "What changed". Cookie only — no invented
// activity. First visit has nothing to compare.

export const DASHBOARD_SEEN_COOKIE = "24frame_dashboard_seen";

const COOKIE_ATTRS = "path=/; max-age=31536000; samesite=lax";

export function parseDashboardSeen(value: string | undefined | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function dashboardSeenCookieWrite(now: Date): string {
  return `${DASHBOARD_SEEN_COOKIE}=${now.toISOString()}; ${COOKIE_ATTRS}`;
}

export function persistDashboardSeen(now: Date): void {
  document.cookie = dashboardSeenCookieWrite(now);
}

export function afterLastVisit(iso: string | null | undefined, lastVisitMs: number | null): boolean {
  if (lastVisitMs == null || !iso) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms > lastVisitMs;
}
