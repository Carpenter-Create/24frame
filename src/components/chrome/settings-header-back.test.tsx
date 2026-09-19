import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/settings" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import { HOUSE_HEADER_TRAILING_AVATAR_CLASS } from "@/lib/house-lead-chrome";
import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";
import {
  SETTINGS,
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_HEADER_PAD_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
} from "@/lib/settings";
import { SettingsHeaderBack } from "./settings-header-back";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "settings-header-back.tsx"),
  "utf8",
);
const shellSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "app-shell.tsx"),
  "utf8",
);
const accountSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "account-sheet.tsx"),
  "utf8",
);
const railSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "settings-rail.tsx"),
  "utf8",
);

describe("SettingsHeaderBack", () => {
  it("is 16 chevron-left + Home on the hub list", () => {
    navigation.pathname = "/settings";
    const html = renderToStaticMarkup(<SettingsHeaderBack />);
    expect(html).toContain('data-settings-header-back=""');
    expect(html).toContain(`href="${SETTINGS.dashboardHref}"`);
    expect(html).toContain(SETTINGS.dashboard);
    expect(html).toContain(SETTINGS_HEADER_BACK_CLASS);
    expect(html).toContain(SETTINGS_RAIL_CHEVRON_CLASS);
    expect(html).not.toContain('stroke-width="1.33"');
    expect(html).not.toContain("lucide-chevron-left");
    expect(html).not.toContain("lucide-");
    expect(SETTINGS.dashboardHref).toBe("/aggregation/dashboard");
    expect(SETTINGS_HEADER_BACK_CLASS).toContain("gap-[var(--space-2)]");
    expect(SETTINGS_HEADER_BACK_CLASS).toContain("t-body");
    expect(SETTINGS_HEADER_BACK_CLASS).not.toContain("font-normal");
    expect(SETTINGS_HEADER_BACK_CLASS).toContain("md:hidden");
    expect(SETTINGS_HEADER_PAD_CLASS).toBe(MOBILE_CHROME_LEAD_PAD_CLASS);
    expect(SETTINGS_RAIL_CHEVRON_CLASS).toBe("size-4 shrink-0");
    expect(src).toContain("CaretLeft");
    expect(src).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(src).toContain("settingsHeaderBack");
    expect(src).not.toContain("ChevronLeft");
    expect(src).not.toContain("lucide-react");
    expect(src).not.toContain("Menu");
    expect(src).not.toContain("MobileNav");
    expect(src).not.toContain("hamburger");
    expect(src).not.toContain("t-body-sm");
    expect(src).not.toContain("t-title");
    expect(src).not.toContain("Company");
  });

  it("pushes back to Settings from a section pane", () => {
    navigation.pathname = "/settings/preferences";
    const html = renderToStaticMarkup(<SettingsHeaderBack />);
    expect(html).toContain(`href="${SETTINGS.href}"`);
    expect(html).toContain(SETTINGS.title);
    expect(html).not.toContain(`>${SETTINGS.dashboard}<`);
  });

  it("stays house chrome — rail is the desktop nav, not a new IA", () => {
    expect(src).not.toContain("SettingsLocalNav");
    expect(src).not.toContain("SETTINGS_LOCAL_NAV");
    expect(src).not.toContain("/settings/profile");
    expect(src).not.toContain("/settings/agreements");
    expect(src).not.toContain("/settings/refer");
    expect(src).not.toContain("Appearance");
    expect(shellSrc).toContain("<SettingsHeaderBack />");
    expect(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../lib/house-lead-chrome.ts"), "utf8"),
    ).toContain("HOUSE_LEAD_PHONE_PAD_CLASS");
    expect(SETTINGS_HEADER_PAD_CLASS).toBe(MOBILE_CHROME_LEAD_PAD_CLASS);
    expect(shellSrc).toContain(
      "<DestChipsSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />",
    );
    expect(accountSrc).toContain("HOUSE_HEADER_TRAILING_AVATAR_CLASS");
    expect(HOUSE_HEADER_TRAILING_AVATAR_CLASS).toContain("h-8 w-8");
    expect(accountSrc).toContain("md:hidden");
    expect(railSrc).toContain("SETTINGS_HUB_NAV");
    expect(railSrc).not.toContain("SettingsHeaderBack");
    expect(railSrc).not.toContain("623:785");
  });
});
