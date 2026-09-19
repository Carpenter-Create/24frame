import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("settings/security page", () => {
  it("exists as a hard-cut IA route", () => {
    expect(existsSync("src/app/(app)/settings/security/page.tsx")).toBe(true);
  });

  it("imports SecuritySettings component and fetches from security_events", () => {
    const src = readFileSync("src/app/(app)/settings/security/page.tsx", "utf8");
    expect(src).toContain("SecuritySettings");
    expect(src).toContain("security_events");
    expect(src).toContain("getOrgContext");
    expect(src).toContain("createClient");
  });

  it("does not contain Suggested actions or Run check-in (v1 scope)", () => {
    const src = readFileSync("src/app/(app)/settings/security/page.tsx", "utf8");
    expect(src).not.toMatch(/suggested.action/i);
    expect(src).not.toMatch(/run.check.in/i);
    expect(src).not.toMatch(/check-in/i);
  });

  it("does not use Mercury skin tokens", () => {
    const src = readFileSync("src/app/(app)/settings/security/page.tsx", "utf8");
    expect(src).not.toMatch(/mercury/i);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
