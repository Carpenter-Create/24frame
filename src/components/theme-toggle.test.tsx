import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "theme-toggle.tsx"), "utf8");
const leadSrc = readFileSync(join(here, "chrome/house-lead-chrome.tsx"), "utf8");

describe("theme preference sync", () => {
  it("keeps gc-theme sync and drops the header sun/moon", () => {
    expect(src).toContain("useThemePreference");
    expect(src).toContain("ThemeSync");
    expect(src).toContain("subscribeThemePreference");
    expect(src).toContain("applyResolvedTheme");
    expect(src).not.toContain("ThemeToggle");
    expect(src).not.toContain("ThemeGlyph");
    expect(src).not.toContain("data-theme-toggle");
    expect(src).not.toContain("toggleDocumentTheme");
    expect(src).not.toContain("Sun");
    expect(src).not.toContain("Moon");
    expect(leadSrc).not.toContain("ThemeToggle");
    expect(leadSrc).not.toContain("theme-toggle");
    expect(leadSrc).not.toContain("data-theme-toggle");
    expect(leadSrc.indexOf("<AskAssistantHeaderLink />")).toBeGreaterThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(leadSrc.indexOf("<AskAssistantHeaderLink />")).toBeLessThan(leadSrc.indexOf("<ActivityBell"));
    expect(leadSrc.indexOf("<ActivityBell")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
  });
});
