import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeaderBackLink } from "@/components/ui/page-header";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import {
  SETTINGS,
  SETTINGS_PAGE_LEAD_BACK_CLASS,
  settingsHeaderBack,
} from "@/lib/settings";
import { SettingsPageLead } from "./settings-page-lead";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "settings-page-lead.tsx"), "utf8");
const pageHeaderSrc = readFileSync(join(here, "../ui/page-header.tsx"), "utf8");
const shellSrc = readFileSync(join(here, "../chrome/app-shell.tsx"), "utf8");
const hubSrc = readFileSync(join(here, "../chrome/settings-hub-list.tsx"), "utf8");
const railSrc = readFileSync(join(here, "../chrome/settings-rail.tsx"), "utf8");
const leadChromeSrc = readFileSync(join(here, "../chrome/house-lead-chrome.tsx"), "utf8");

const SETTINGS_PANES = [
  "src/components/chrome/settings-hub-list.tsx",
  "src/components/settings/profile-settings.tsx",
  "src/components/settings/organization-settings.tsx",
  "src/components/settings/preferences-settings.tsx",
  "src/app/(app)/settings/agreements/page.tsx",
  "src/app/(app)/settings/refer/page.tsx",
] as const;

describe("SettingsPageLead", () => {
  it("reuses News PageHeader ArrowLeft — Home on the hub, Settings on a pane", () => {
    const hub = renderToStaticMarkup(
      createElement(SettingsPageLead, { title: SETTINGS.title, pathname: SETTINGS.href }),
    );
    const hubBack = settingsHeaderBack(SETTINGS.href);
    expect(hub).toContain('data-settings-page-lead=""');
    expect(hub).toContain(`href="${hubBack.href}"`);
    expect(hub).toContain(hubBack.label);
    expect(hub).toContain(TEXT_ACTION_CLASS);
    expect(hub).toContain(SETTINGS_PAGE_LEAD_BACK_CLASS);
    expect(hub).toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(hubBack).toEqual({ href: SETTINGS.dashboardHref, label: "Home" });

    const pane = renderToStaticMarkup(
      createElement(SettingsPageLead, {
        title: "Rights Holder",
        pathname: SETTINGS.organizationHref,
      }),
    );
    const paneBack = settingsHeaderBack(SETTINGS.organizationHref);
    expect(pane).toContain(`href="${paneBack.href}"`);
    expect(pane).toContain(paneBack.label);
    expect(pane).toMatch(/<h1[^>]*>Rights Holder<\/h1>/);
    expect(paneBack).toEqual({ href: SETTINGS.href, label: SETTINGS.title });

    expect(src).toContain("PageHeaderBackLink");
    expect(src).toContain("settingsHeaderBack");
    expect(src).toContain("SETTINGS_PAGE_LEAD_BACK_CLASS");
    expect(src).toContain("SETTINGS_PANE_TITLE_CLASS");
    expect(src).not.toContain("CaretLeft");
    expect(src).not.toContain("SettingsHeaderBack");
    expect(pageHeaderSrc).toContain("ArrowLeft");
    expect(pageHeaderSrc).toContain("TEXT_ACTION_CLASS");
    expect(pageHeaderSrc).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(pageHeaderSrc).not.toContain("CaretLeft");
    expect(SETTINGS_PAGE_LEAD_BACK_CLASS).toBe("md:hidden");
  });

  it("is the one title-block SoT — hub and every pane mount it, chrome does not", () => {
    expect(hubSrc).toContain("SettingsPageLead");
    expect(hubSrc).toContain("SETTINGS.href");
    expect(hubSrc).not.toContain("<h1");
    for (const path of SETTINGS_PANES) {
      const page = readFileSync(path, "utf8");
      expect(page).toContain("SettingsPageLead");
      expect(page).not.toContain("SettingsHeaderBack");
      expect(page).not.toContain("data-settings-header-back");
      expect(page).not.toContain("CaretLeft");
      expect(page).not.toContain("SETTINGS_HEADER_BACK_CLASS");
    }
    expect(existsSync("src/components/chrome/settings-header-back.tsx")).toBe(false);
    expect(existsSync("src/components/chrome/settings-header-back.test.tsx")).toBe(false);
    expect(shellSrc).not.toContain("SettingsHeaderBack");
    expect(shellSrc).not.toContain("leadingNav");
    expect(shellSrc).not.toContain("settings-header-back");
    expect(railSrc).not.toContain("SettingsHeaderBack");
    expect(railSrc).not.toContain("SettingsPageLead");
    expect(leadChromeSrc).not.toContain("SettingsHeaderBack");
    expect(leadChromeSrc).not.toContain("CaretLeft");
    const backLink = renderToStaticMarkup(
      createElement(PageHeaderBackLink, { href: "/home", label: "Home" }),
    );
    expect(backLink).toContain(TEXT_ACTION_CLASS);
    expect(backLink).toContain("Home");
    expect(backLink).toContain('href="/home"');
  });
});
