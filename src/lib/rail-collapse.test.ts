import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  RAIL_COLLAPSE_CHEVRON,
  RAIL_COLLAPSE_CHEVRON_CLASS,
  RAIL_COLLAPSE_EXPAND_ROW_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT,
  SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COLLAPSED_COOKIE_LEGACY,
  parseSidebarCollapsedCookie,
  readSidebarCollapsed,
  shouldMigrateSidebarCollapsedCookie,
  sidebarCollapsedCookieClearLegacy,
  sidebarCollapsedCookieWrite,
} from "./rail-collapse";

const src = readFileSync("src/lib/rail-collapse.ts", "utf8");

describe("rail-collapse tokens", () => {
  it("keeps house chevron names and measured values", () => {
    expect(RAIL_COLLAPSE_CHEVRON).toBe("chevron");
    expect(RAIL_COLLAPSE_CHEVRON_CLASS).toContain("h-7 w-7");
    expect(RAIL_COLLAPSE_CHEVRON_CLASS).toContain("rounded-[var(--radius-sm)]");
    expect(RAIL_COLLAPSE_CHEVRON_CLASS).toContain("text-ink-3");
    expect(RAIL_COLLAPSE_CHEVRON_ICON_CLASS).toBe("h-4 w-4");
    expect(RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT).toBe("bold");
    expect(RAIL_COLLAPSE_EXPAND_ROW_CLASS).toBe("flex h-8 items-center justify-center");
    expect(RAIL_COLLAPSE_EXPAND_ROW_CLASS).not.toMatch(/border|hairline/);
    expect(src).not.toMatch(/\brl-/);
    expect(src).not.toContain("RAIL_COLLAPSE_RL");
    expect(src).not.toMatch(/Royalogic/i);
  });
});

describe("sidebar collapsed cookie", () => {
  it("writes the house name and can read the legacy name once", () => {
    expect(SIDEBAR_COLLAPSED_COOKIE).toBe("24frame_sidebar_collapsed");
    expect(SIDEBAR_COLLAPSED_COOKIE_LEGACY).toBe("gc_sidebar_collapsed");
    expect(parseSidebarCollapsedCookie("1")).toBe(true);
    expect(parseSidebarCollapsedCookie("0")).toBe(false);
    expect(readSidebarCollapsed(() => undefined)).toBe(false);
    expect(readSidebarCollapsed((name) => (name === SIDEBAR_COLLAPSED_COOKIE ? "1" : undefined))).toBe(
      true,
    );
    expect(
      readSidebarCollapsed((name) => (name === SIDEBAR_COLLAPSED_COOKIE_LEGACY ? "1" : undefined)),
    ).toBe(true);
    expect(
      readSidebarCollapsed((name) =>
        name === SIDEBAR_COLLAPSED_COOKIE ? "0" : name === SIDEBAR_COLLAPSED_COOKIE_LEGACY ? "1" : undefined,
      ),
    ).toBe(false);
    expect(sidebarCollapsedCookieWrite(true)).toContain("24frame_sidebar_collapsed=1");
    expect(sidebarCollapsedCookieClearLegacy()).toContain("gc_sidebar_collapsed=");
    expect(sidebarCollapsedCookieClearLegacy()).toContain("max-age=0");
  });

  it("migrates only when the legacy cookie is present and the house cookie is not", () => {
    expect(shouldMigrateSidebarCollapsedCookie("gc_sidebar_collapsed=1")).toBe(true);
    expect(shouldMigrateSidebarCollapsedCookie("24frame_sidebar_collapsed=0")).toBe(false);
    expect(
      shouldMigrateSidebarCollapsedCookie("24frame_sidebar_collapsed=0; gc_sidebar_collapsed=1"),
    ).toBe(false);
    expect(shouldMigrateSidebarCollapsedCookie("")).toBe(false);
  });
});
