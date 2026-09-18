import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/settings/you" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import {
  SETTINGS,
  SETTINGS_HUB_NAV,
  SETTINGS_RAIL_ABSENT,
  SETTINGS_RAIL_ACTIVE_CLASS,
  SETTINGS_RAIL_ITEM_CLASS,
  SETTINGS_RAIL_NAV_CLASS,
  SETTINGS_RAIL_TITLE_CLASS,
} from "@/lib/settings";
import { SettingsRail } from "./settings-rail";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "settings-rail.tsx"), "utf8");

describe("SettingsRail", () => {
  it("is Settings title + You / Social / Education / Aggregation", () => {
    navigation.pathname = "/settings/you";
    const html = renderToStaticMarkup(<SettingsRail />);
    expect(html).toContain('data-settings-rail-nav=""');
    expect(html).toContain('data-settings-rail-title=""');
    expect(html).toContain(SETTINGS.title);
    expect(html).toContain(SETTINGS_RAIL_NAV_CLASS);
    expect(html).toContain(SETTINGS_RAIL_TITLE_CLASS);
    for (const item of SETTINGS_HUB_NAV) {
      expect(html).toContain(`data-settings-rail-item="${item.kind}"`);
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(item.label);
    }
    expect(html).toContain(SETTINGS_RAIL_ITEM_CLASS);
    expect(html).not.toContain("Home");
    expect(html).not.toContain(SETTINGS.manageCourses);
    expect(html).not.toContain('href="/education"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(SETTINGS_RAIL_ACTIVE_CLASS);
    expect(src).toContain("settingsHubSection(usePathname())");
    expect(src).not.toContain("persistWorkspaceCookie");
    expect(src).not.toContain("ChevronLeft");
    expect(src).not.toContain("lucide-react");
    expect(src).not.toContain("t-body-sm");
    expect(src).not.toContain("SettingsLocalNav");
  });

  it("washes the hub section that matches the path", () => {
    navigation.pathname = "/settings/education";
    const education = renderToStaticMarkup(<SettingsRail />);
    expect(education).toMatch(
      /data-settings-rail-item="education"[^>]*aria-current="page"/,
    );
    expect(education).not.toMatch(
      /data-settings-rail-item="you"[^>]*aria-current="page"/,
    );

    navigation.pathname = "/settings/profile";
    const you = renderToStaticMarkup(<SettingsRail />);
    expect(you).toMatch(/data-settings-rail-item="you"[^>]*aria-current="page"/);
    expect(you).not.toMatch(
      /data-settings-rail-item="education"[^>]*aria-current="page"/,
    );
  });

  it("does not invent Account / Users / API or the Access destinations", () => {
    navigation.pathname = "/settings/you";
    const html = renderToStaticMarkup(<SettingsRail />);
    for (const absent of SETTINGS_RAIL_ABSENT) {
      expect(html).not.toContain(absent);
    }
    expect(html).not.toContain("GLOBAL CONTENT");
    expect(src).not.toContain("GC_NAV");
    expect(src).not.toContain("@/lib/nav");
    expect(src).not.toContain("purple");
  });
});
