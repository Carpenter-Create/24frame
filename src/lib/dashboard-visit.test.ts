import { describe, expect, it } from "vitest";

import {
  DASHBOARD_SEEN_COOKIE,
  afterLastVisit,
  dashboardSeenCookieWrite,
  parseDashboardSeen,
} from "./dashboard-visit";

describe("dashboard last-seen stamp", () => {
  it("parses a real ISO stamp and refuses junk", () => {
    expect(parseDashboardSeen("2026-09-01T00:00:00.000Z")).toBe(Date.parse("2026-09-01T00:00:00.000Z"));
    expect(parseDashboardSeen(undefined)).toBeNull();
    expect(parseDashboardSeen("nope")).toBeNull();
    expect(dashboardSeenCookieWrite(new Date("2026-09-16T00:00:00.000Z"))).toContain(
      `${DASHBOARD_SEEN_COOKIE}=2026-09-16T00:00:00.000Z`,
    );
  });

  it("only counts activity after the last visit", () => {
    const last = Date.parse("2026-09-01T00:00:00.000Z");
    expect(afterLastVisit("2026-09-02T00:00:00.000Z", last)).toBe(true);
    expect(afterLastVisit("2026-08-31T00:00:00.000Z", last)).toBe(false);
    expect(afterLastVisit("2026-09-02T00:00:00.000Z", null)).toBe(false);
    expect(afterLastVisit(null, last)).toBe(false);
  });
});
