import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
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
    expect(html).toContain("size-[44px]");
    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("md:size-8");
    expect(html).toContain(HOUSE_ICON_BUTTON_CLASS);
    expect(html).not.toContain("purple");
    expect(html).not.toContain("violet");
    expect(html).not.toContain("border-hairline");
    expect(themeToggleLabel("light")).toBe(THEME_TOGGLE.toDark);
    expect(themeToggleLabel("dark")).toBe(THEME_TOGGLE.toLight);
  });

  it("flips through toggleDocumentTheme and mounts in HouseLeadChrome, not the avatar menu", () => {
    expect(src).toContain("toggleDocumentTheme");
    expect(src).toContain("ThemeGlyph");
    expect(src).toContain("HOUSE_THEME_TOGGLE_CLASS");
    expect(src).toContain("showSun = useTheme() === \"dark\"");
    expect(src).not.toContain("applyDocumentThemePreference");
    expect(leadSrc).toContain("<ThemeToggle />");
    expect(leadSrc.indexOf("<ThemeToggle />")).toBeGreaterThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(leadSrc.indexOf("<ThemeToggle />")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
  });
});
