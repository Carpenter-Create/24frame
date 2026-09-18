import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HOUSE_THEME_TOGGLE_CLASS, HOUSE_THEME_TOGGLE_HOST_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { THEME_TOGGLE, themeToggleLabel } from "@/lib/theme";

import { ThemeToggle } from "./theme-toggle";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "theme-toggle.tsx"), "utf8");
const leadSrc = readFileSync(join(here, "chrome/house-lead-chrome.tsx"), "utf8");

describe("header theme toggle", () => {
  it("renders the veritytuner sun/moon IA on the existing house hit", () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle));

    expect(html).toContain("data-theme-toggle");
    expect(html).toContain(`aria-label="${THEME_TOGGLE.toDark}"`);
    expect(html).toContain('data-theme-glyph="moon"');
    expect(html).not.toContain('data-theme-glyph="sun"');
    expect(html).toContain(HOUSE_THEME_TOGGLE_CLASS);
    expect(html).toContain("size-8");
    expect(html).toContain("min-h-8");
    expect(html).toContain("min-w-8");
    expect(html).not.toContain("size-[44px]");
    expect(html).toContain(HOUSE_ICON_BUTTON_CLASS);
    expect(html).not.toContain("purple");
    expect(html).not.toContain("violet");
    expect(html).not.toContain("border-hairline");
    expect(html).not.toContain("stroke-width");
    expect(html).not.toContain("strokeWidth");
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain(PHOSPHOR_CHROME_ICON_CLASS);
    expect(themeToggleLabel("light")).toBe(THEME_TOGGLE.toDark);
    expect(themeToggleLabel("dark")).toBe(THEME_TOGGLE.toLight);
  });

  it("flips through toggleDocumentTheme and mounts in HouseLeadChrome, not the avatar menu", () => {
    expect(src).toContain("toggleDocumentTheme");
    expect(src).toContain("ThemeGlyph");
    expect(src).toContain("HOUSE_THEME_TOGGLE_CLASS");
    expect(src).toContain("showSun = useTheme() === \"dark\"");
    expect(src).toContain("from \"@phosphor-icons/react\"");
    expect(src).toContain("Sun");
    expect(src).toContain("Moon");
    expect(src).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(src).toContain(`weight={PHOSPHOR_CHROME_IDLE_WEIGHT}`);
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(src).not.toContain("strokeWidth");
    expect(src).not.toContain("applyDocumentThemePreference");
    expect(leadSrc).toContain("<ThemeToggle />");
    expect(leadSrc).toContain("HOUSE_THEME_TOGGLE_HOST_CLASS");
    expect(HOUSE_THEME_TOGGLE_HOST_CLASS).toBe("hidden md:contents");
    expect(leadSrc.indexOf("HOUSE_THEME_TOGGLE_HOST_CLASS")).toBeLessThan(
      leadSrc.indexOf("<ThemeToggle />"),
    );
    expect(leadSrc.indexOf("<ThemeToggle />")).toBeGreaterThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(leadSrc.indexOf("<AskAssistantHeaderLink />")).toBeLessThan(
      leadSrc.indexOf("className={HOUSE_THEME_TOGGLE_HOST_CLASS}"),
    );
    expect(leadSrc.indexOf("<ThemeToggle />")).toBeLessThan(leadSrc.indexOf("<ActivityBell"));
    expect(leadSrc.indexOf("<ActivityBell")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
  });
});
