import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  formatSecurityEventDate,
  parseSourceLabel,
  SECURITY_EVENT_KINDS,
  SECURITY_EVENT_LABELS,
  SECURITY_HISTORY_COLUMNS,
  SECURITY_PAGE,
  SECURITY_PILL_BASE_CLASS,
  SECURITY_PILL_CLASSES,
  securityEventPillTone,
} from "./security-events";

describe("security events", () => {
  it("defines the canonical event kinds", () => {
    expect(SECURITY_EVENT_KINDS).toEqual([
      "sign_in",
      "sign_out",
      "failed_sign_in",
      "invite_sent",
      "invite_accepted",
      "invite_withdrawn",
      "role_change",
    ]);
  });

  it("maps every event kind to a user-facing label", () => {
    for (const kind of SECURITY_EVENT_KINDS) {
      expect(typeof SECURITY_EVENT_LABELS[kind]).toBe("string");
      expect(SECURITY_EVENT_LABELS[kind].length).toBeGreaterThan(0);
    }
    expect(SECURITY_EVENT_LABELS.sign_in).toBe("Log in");
    expect(SECURITY_EVENT_LABELS.sign_out).toBe("Log out");
    expect(SECURITY_EVENT_LABELS.failed_sign_in).toBe("Failed sign-in");
    expect(SECURITY_EVENT_LABELS.invite_sent).toBe("Invite sent");
    expect(SECURITY_EVENT_LABELS.invite_accepted).toBe("Invite accepted");
    expect(SECURITY_EVENT_LABELS.invite_withdrawn).toBe("Invite withdrawn");
    expect(SECURITY_EVENT_LABELS.role_change).toBe("Role change");
  });

  it("locks the history table columns", () => {
    expect(SECURITY_HISTORY_COLUMNS).toEqual([
      "Date and time",
      "Team member",
      "Event",
      "Source",
      "IP Address",
    ]);
  });

  it("locks the Security page copy", () => {
    expect(SECURITY_PAGE.title).toBe("Security");
    expect(SECURITY_PAGE.href).toBe("/settings/security");
    expect(SECURITY_PAGE.subtitle).toBe("Activity history for your organization.");
    expect(SECURITY_PAGE.emptyState).toBe("No security events recorded yet.");
  });

  it("does not use Mercury skin tokens or hardcoded hex", () => {
    const src = readFileSync("src/lib/security-events.ts", "utf8");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SECURITY_PILL_BASE_CLASS).not.toMatch(/mercury/i);
    for (const cls of Object.values(SECURITY_PILL_CLASSES)) {
      expect(cls).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });

  it("assigns pill tones per event kind", () => {
    expect(securityEventPillTone("sign_in")).toBe("success");
    expect(securityEventPillTone("invite_accepted")).toBe("success");
    expect(securityEventPillTone("failed_sign_in")).toBe("warning");
    expect(securityEventPillTone("sign_out")).toBe("neutral");
    expect(securityEventPillTone("invite_sent")).toBe("neutral");
    expect(securityEventPillTone("invite_withdrawn")).toBe("neutral");
    expect(securityEventPillTone("role_change")).toBe("neutral");
  });
});

describe("parseSourceLabel", () => {
  it("parses Chrome on macOS", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome (macOS, 10.15.7)");
  });

  it("parses Safari on macOS", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ),
    ).toBe("Safari (macOS, 10.15.7)");
  });

  it("parses Chrome on Windows", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome (Windows, 10.0)");
  });

  it("parses Edge on Windows", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
      ),
    ).toBe("Edge (Windows, 10.0)");
  });

  it("parses Safari on iOS", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari (iOS, 26.6.2)");
  });

  it("parses Chrome on Android", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe("Chrome (Android, 14)");
  });

  it("parses Chrome on iOS (CriOS, not the compatibility Safari token)", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Chrome (iOS, 17.5.1)");
  });

  it("parses Firefox on iOS (FxiOS, not the compatibility Safari token)", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
      ),
    ).toBe("Firefox (iOS, 17.5.1)");
  });

  it("parses Edge on iOS (EdgiOS, not the compatibility Safari token)", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/126.0.2592.67 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Edge (iOS, 17.5.1)");
  });

  it("parses Firefox on Linux", () => {
    expect(
      parseSourceLabel(
        "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
      ),
    ).toBe("Firefox (Linux)");
  });

  it("returns null for empty or null UA", () => {
    expect(parseSourceLabel(null)).toBeNull();
    expect(parseSourceLabel(undefined)).toBeNull();
    expect(parseSourceLabel("")).toBeNull();
  });

  it("returns null for unrecognizable UA", () => {
    expect(parseSourceLabel("curl/7.0")).toBeNull();
  });
});

describe("formatSecurityEventDate", () => {
  it("formats in UTC with a zone label", () => {
    expect(formatSecurityEventDate("2026-09-19T17:28:00.000Z")).toBe("09/19/2026, 5:28 PM UTC");
  });

  it("returns the raw value when the timestamp is unparseable", () => {
    expect(formatSecurityEventDate("not-a-date")).toBe("not-a-date");
  });
});

describe("security page route", () => {
  it("exists at the expected path", () => {
    expect(existsSync("src/app/(app)/settings/security/page.tsx")).toBe(true);
  });

  it("does not have a Suggested actions component or Run check-in card", () => {
    const src = readFileSync("src/app/(app)/settings/security/page.tsx", "utf8");
    expect(src).not.toMatch(/suggested.action/i);
    expect(src).not.toMatch(/run.check.in/i);
    expect(src).not.toMatch(/check-in/i);
  });
});
