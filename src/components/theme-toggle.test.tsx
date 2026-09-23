import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "theme-toggle.tsx"), "utf8");
const leadSrc = readFileSync(join(here, "chrome/house-lead-chrome.tsx"), "utf8");

describe("theme preference sync", () => {
  it("keeps gc-theme sync and mounts the header sun/moon after the bell", () => {
    expect(src).toContain("useThemePreference");
    expect(src).toContain("ThemeSync");
    expect(src).toContain("subscribeThemePreference");
    expect(src).toContain("applyResolvedTheme");
    expect(src).toContain("preference !== \"auto\"");
    expect(src).toContain("addEventListener(\"change\"");
    expect(src).toContain("export function ThemeToggle");
    expect(src).toContain("data-theme-toggle");
    expect(src).toContain("toggleDocumentTheme");
    expect(src).toContain("Sun");
    expect(src).toContain("Moon");
    expect(src).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(leadSrc).toContain("<ThemeToggle />");
    expect(leadSrc.indexOf("<ActivityBell")).toBeLessThan(leadSrc.indexOf("<ThemeToggle />"));
    expect(leadSrc.indexOf("<ThemeToggle />")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
    expect(leadSrc.indexOf("<AskAssistantHeaderLink />")).toBeGreaterThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(leadSrc.indexOf("<AskAssistantHeaderLink />")).toBeLessThan(leadSrc.indexOf("<ActivityBell"));
    expect(leadSrc.indexOf("<ActivityBell")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
  });
});
