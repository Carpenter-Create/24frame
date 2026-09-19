import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { USER_MENU } from "./user-menu";
import { THEME_STORAGE_KEY } from "./theme";
import {
  APPEARANCE,
  APPEARANCE_FLYOUT_OPTIONS,
  APPEARANCE_OPTIONS,
  appearancePreferenceLabel,
} from "./appearance";

const here = dirname(fileURLToPath(import.meta.url));
const prefsSrc = readFileSync(join(here, "../components/settings/appearance-preferences.tsx"), "utf8");
const themeSrc = readFileSync(join(here, "theme.ts"), "utf8");
const sheetSrc = readFileSync(join(here, "../components/chrome/account-sheet.tsx"), "utf8");

describe("appearance copy", () => {
  it("keeps System default / Dark / Light — not a page", () => {
    expect(APPEARANCE.title).toBe("Appearance");
    expect(APPEARANCE.title).toBe(USER_MENU.appearance);
    expect(APPEARANCE.back).toBe("Back");
    expect(APPEARANCE.back).not.toBe("Back to main menu");
    expect(APPEARANCE.light).toBe("Light");
    expect(APPEARANCE.dark).toBe("Dark");
    expect(APPEARANCE.systemDefault).toBe("System default");
    expect(APPEARANCE.systemDefaultHelper).toBe("We'll match your system preferences");
    expect(APPEARANCE_FLYOUT_OPTIONS.map((option) => option.kind)).toEqual([
      "auto",
      "dark",
      "light",
    ]);
    expect(APPEARANCE_FLYOUT_OPTIONS.map((option) => option.label)).toEqual([
      "System default",
      "Dark",
      "Light",
    ]);
    expect(APPEARANCE_FLYOUT_OPTIONS[0]).toMatchObject({
      helper: APPEARANCE.systemDefaultHelper,
    });
    expect(appearancePreferenceLabel("light")).toBe("Light");
    expect(appearancePreferenceLabel("dark")).toBe("Dark");
    expect(appearancePreferenceLabel("auto")).toBe("System default");
    expect(APPEARANCE).not.toHaveProperty("href");
    expect(`${APPEARANCE.title} ${APPEARANCE.systemDefault}`).not.toMatch(
      /seamless|frictionless|elevate|amplify|unleash|supercharge/i,
    );
    expect(existsSync(join(here, "../app/(app)/account/appearance/page.tsx"))).toBe(false);
  });

  it("keeps the unused Auto list off System default / Dark / Light", () => {
    expect(APPEARANCE.auto).toBe("Auto");
    expect(APPEARANCE_OPTIONS.map((option) => option.label)).toEqual(["Light", "Dark", "Auto"]);
    expect(APPEARANCE_FLYOUT_OPTIONS.map((option) => option.label)).not.toContain("Auto");
  });

  it("shares gc-theme with the header toggle and phone sheet — no second store", () => {
    expect(THEME_STORAGE_KEY).toBe("gc-theme");
    expect(themeSrc).toContain("THEME_STORAGE_KEY");
    expect(themeSrc).toContain("applyDocumentThemePreference");
    expect(prefsSrc).toContain("applyDocumentThemePreference");
    expect(prefsSrc).toContain("APPEARANCE_FLYOUT_OPTIONS");
    expect(prefsSrc).toContain("useThemePreference");
    expect(prefsSrc).not.toContain("localStorage.setItem");
    expect(prefsSrc).not.toContain("THEME_STORAGE_KEY");
    expect(sheetSrc).toContain("applyDocumentThemePreference");
    expect(sheetSrc).toContain("APPEARANCE_FLYOUT_OPTIONS");
    expect(existsSync(join(here, "../app/(app)/settings/appearance/page.tsx"))).toBe(false);
  });
});
