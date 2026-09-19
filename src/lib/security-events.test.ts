import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  parseSourceLabel,
  SECURITY_EVENT_ICON_CLASS,
  SECURITY_EVENT_KINDS,
  SECURITY_EVENT_LABELS,
  SECURITY_HISTORY_COLUMNS,
  SECURITY_PAGE,
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
    expect(SECURITY_PAGE.historyHeading).toBe("Activity history from all users");
    expect(SECURITY_PAGE.emptyState).toBe("No security events recorded yet.");
  });

  it("does not use Mercury skin tokens or hardcoded hex", () => {
    const src = readFileSync("src/lib/security-events.ts", "utf8");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/mercury/i);
  });

  it("uses plain icon+label for events — no pill backgrounds", () => {
    const src = readFileSync("src/lib/security-events.ts", "utf8");
    expect(src).not.toContain("SECURITY_PILL");
    expect(src).not.toContain("rounded-full");
    expect(src).not.toContain("bg-amber");
    expect(SECURITY_EVENT_ICON_CLASS).toBe("size-4 shrink-0");
  });

  it("uses Phosphor SSR icons in the component — not invented glyphs", () => {
    const component = readFileSync("src/components/settings/security-settings.tsx", "utf8");
    expect(component).toContain("@phosphor-icons/react/ssr");
    expect(component).toContain("SignIn");
    expect(component).toContain("SignOut");
    expect(component).toContain("Warning");
    expect(component).not.toContain("SECURITY_PILL");
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
