import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardAdminChrome } from "@/components/dashboard/dashboard-admin-hero";
import { DashboardAdminControls } from "@/components/dashboard/dashboard-admin-controls";
import { DASHBOARD_ADMIN, dashboardPeriodOptions, parseDashboardPeriod } from "@/lib/dashboard-admin";
import {
  DASHBOARD_ADMIN_CHROME_CLASS,
  DASHBOARD_ORG_NAME_MOBILE_CLASS,
  DASHBOARD_PERIOD_KICKER_CLASS,
  DASHBOARD_PERIOD_SHEET_HOST_CLASS,
  DASHBOARD_PERIOD_TRIGGER_CLASS,
  DASHBOARD_TITLE_MOBILE_CLASS,
} from "@/lib/dashboard-craft";
import {
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
  APP_HEADER_WORKSPACE_PILL_HOST_CLASS,
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_PILL_PANEL_CLASS,
  WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS,
} from "@/lib/workspace-switcher";
import { WorkspaceSwitcher } from "@/components/chrome/workspace-switcher";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const now = new Date("2026-09-16T12:00:00.000Z");
const options = dashboardPeriodOptions(now, [
  { year: 2025, month: 12 },
  { year: 2026, month: 8 },
]);
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const heroSrc = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
const controlsSrc = readFileSync("src/components/dashboard/dashboard-admin-controls.tsx", "utf8");
const craftSrc = readFileSync("src/lib/dashboard-craft.ts", "utf8");
const switcherSrc = readFileSync("src/lib/workspace-switcher.ts", "utf8");

function chromeHtml() {
  return renderToStaticMarkup(
    createElement(DashboardAdminChrome, {
      orgName: "GCNH, LLC",
      period: parseDashboardPeriod("all", now),
      options,
      periodMenuOpen: true,
    }),
  );
}

describe("Aggregation Dashboard mobile chrome — Mercury leading pill", () => {
  it("puts a compact Aggregation pill after the hamburger — not centered, not with the avatar", () => {
    expect(APP_HEADER_LEADING_CLASS).toContain("gap-[var(--space-2)]");
    expect(APP_HEADER_LEADING_CLASS).not.toContain("justify-center");
    expect(APP_HEADER_WORKSPACE_PILL_HOST_CLASS).toContain("md:hidden");
    expect(APP_HEADER_WORKSPACE_PILL_HOST_CLASS).not.toContain("mx-auto");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("border-hairline");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("bg-surface-muted");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("t-body-sm");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).toContain("text-ink");
    expect(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS).not.toMatch(/green|emerald|#00|#12|#1[Bb]|#1769FF/);
    expect(shellSrc).toContain("data-app-header-leading");
    expect(shellSrc).toContain("data-app-header-workspace-pill");
    expect(shellSrc).toContain("APP_HEADER_LEADING_CLASS");
    expect(shellSrc).toContain('tone="pill"');
    const header = shellSrc.slice(
      shellSrc.indexOf("data-app-header="),
      shellSrc.indexOf("</header>"),
    );
    expect(header).not.toContain("justify-center");
    expect(header).not.toContain("left-1/2");
    expect(header).not.toContain("-translate-x-1/2");
    const leading = header.slice(
      header.indexOf("data-app-header-leading"),
      header.indexOf("data-app-header-trailing"),
    );
    expect(leading).toContain("MobileNavSlot");
    expect(leading).toContain("data-app-header-workspace-pill");
    expect(leading).toContain("<WorkspaceSwitcher current={workspace} tone=\"pill\" />");
    expect(leading).not.toContain("AccountMenuSlot");
    expect(leading.indexOf("MobileNavSlot")).toBeLessThan(
      leading.indexOf("data-app-header-workspace-pill"),
    );
    expect(leading.indexOf("data-app-header-workspace-pill")).toBeLessThan(
      leading.indexOf("MessagesHeaderSlot"),
    );
    const pillHtml = renderToStaticMarkup(
      createElement(WorkspaceSwitcher, { current: "aggregation", tone: "pill" }),
    );
    expect(pillHtml).toContain('data-workspace-switcher-tone="pill"');
    expect(pillHtml).toContain("Aggregation");
    expect(pillHtml).toContain(WORKSPACE_SWITCHER_PILL_TRIGGER_CLASS);
    expect(pillHtml).toContain("data-workspace-switcher-chevron");
  });

  it("leaves the trailing avatar alone — no Aggregation+avatar phone cluster", () => {
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("shrink-0");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("gap-[var(--space-2)]");
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("hidden");
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("md:contents");
    expect(shellSrc).toContain("data-app-header-trailing");
    expect(shellSrc).toContain("APP_HEADER_TRAILING_CLUSTER_CLASS");
    const trailing = shellSrc.slice(
      shellSrc.indexOf("data-app-header-trailing"),
      shellSrc.indexOf("</header>"),
    );
    expect(trailing).toContain("data-app-header-workspace-desktop");
    expect(trailing).toContain("<WorkspaceSwitcher current={workspace} />");
    expect(trailing).not.toContain('tone="pill"');
    expect(trailing).toContain("AccountMenuSlot");
    expect(trailing.indexOf("data-app-header-workspace-desktop")).toBeLessThan(
      trailing.indexOf("AccountMenuSlot"),
    );
    expect(trailing).not.toContain("MobileNav");
    expect(trailing).not.toContain("data-dashboard-period");
    expect(trailing).not.toContain("Move");
    expect(shellSrc).not.toContain("data-header-move");
    expect(shellSrc).not.toContain("data-mercury-search");
    expect(shellSrc).not.toContain("data-workspace-switcher-lead");
    expect(shellSrc).not.toContain("data-workspace-switcher-rail");
  });

  it("keeps a quiet always-on chevron on the pill and the Workspaces menu", () => {
    expect(WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS).toContain("opacity-100");
    expect(WORKSPACE_SWITCHER_PILL_CHEVRON_CLASS).not.toContain("opacity-0");
    expect(WORKSPACE_SWITCHER_PILL_PANEL_CLASS).toContain("left-0");
    expect(WORKSPACE_SWITCHER_PILL_PANEL_CLASS).not.toContain("right-0");
    expect(WORKSPACE_SWITCHER.heading).toBe("Workspaces");
    const open = renderToStaticMarkup(
      createElement(WorkspaceSwitcher, {
        current: "aggregation",
        tone: "pill",
        defaultOpen: true,
      }),
    );
    expect(open).toContain("data-workspace-switcher-popover");
    expect(open).toContain(WORKSPACE_SWITCHER.heading);
    expect(open).toContain('data-workspace-switcher-option="aggregation"');
    expect(open).toContain('data-workspace-switcher-option="social"');
    expect(open).toContain('data-workspace-switcher-option="education"');
    expect(open).toContain(WORKSPACE_SWITCHER_PILL_PANEL_CLASS);
    expect(switcherSrc).toContain("Mercury");
    expect(switcherSrc).toContain("Workspaces");
  });

  it("does not put Period in the top header next to Aggregation", () => {
    const header = shellSrc.slice(
      shellSrc.indexOf("data-app-header="),
      shellSrc.indexOf("</header>"),
    );
    expect(header).not.toContain("DashboardAdminControls");
    expect(header).not.toContain("data-dashboard-period");
    expect(header).not.toContain("DASHBOARD_ADMIN.period");
    expect(shellSrc).not.toContain("data-dashboard-period");
    expect(heroSrc).not.toContain("data-app-header");
  });
});

describe("Aggregation Dashboard mobile chrome — org-row Period", () => {
  it("puts quiet All time ⌄ on the org row and drops the PERIOD kicker", () => {
    const html = chromeHtml();
    expect(html).toContain("data-dashboard-identity-row");
    expect(html).toContain("data-dashboard-title-mobile");
    expect(html).toContain("GCNH, LLC");
    expect(html).toContain("data-dashboard-period");
    expect(html).toContain("data-dashboard-period-one");
    expect(html).toContain("data-dashboard-period-current");
    expect(html).toContain(DASHBOARD_ADMIN.allTime);
    expect(html).toContain("data-dashboard-period-chevron");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).toContain("items-center");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).toContain("justify-between");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).toContain("gap-[var(--space-2)]");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).not.toContain("flex-col");
    expect(DASHBOARD_TITLE_MOBILE_CLASS).toBe(DASHBOARD_ORG_NAME_MOBILE_CLASS);
    expect(DASHBOARD_ORG_NAME_MOBILE_CLASS).toContain("t-body-sm");
    expect(DASHBOARD_ORG_NAME_MOBILE_CLASS).toContain("text-ink-2");
    expect(DASHBOARD_ORG_NAME_MOBILE_CLASS).toContain("md:hidden");
    expect(DASHBOARD_ORG_NAME_MOBILE_CLASS).not.toContain("t-title");
    expect(DASHBOARD_ORG_NAME_MOBILE_CLASS).not.toContain("t-label");
    expect(DASHBOARD_PERIOD_KICKER_CLASS).toContain("max-md:hidden");
    expect(DASHBOARD_PERIOD_KICKER_CLASS).toContain("t-label");
    expect(html).toContain("data-dashboard-period-kicker");
    expect(html).toMatch(/data-dashboard-period-kicker=""[^>]*max-md:hidden/);
    expect(DASHBOARD_PERIOD_TRIGGER_CLASS).toContain("t-body-sm");
    expect(DASHBOARD_PERIOD_TRIGGER_CLASS).toContain("max-md:bg-transparent");
    expect(DASHBOARD_PERIOD_TRIGGER_CLASS).toContain("max-md:border-0");
    expect(DASHBOARD_PERIOD_TRIGGER_CLASS).toContain("max-md:flex-none");
    expect(DASHBOARD_PERIOD_TRIGGER_CLASS).not.toContain("max-md:flex-1");
    expect(html.indexOf("data-dashboard-title-mobile")).toBeLessThan(
      html.indexOf("data-dashboard-period-current"),
    );
    expect(heroSrc).toContain("data-dashboard-identity-row");
    expect(controlsSrc).toContain("data-dashboard-period-kicker");
  });

  it("opens Period from the org-row control into the existing bottom sheet", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardAdminControls, {
        periodKey: "all",
        options,
        defaultOpen: true,
      }),
    );
    expect(html).toContain("data-dashboard-period-one");
    expect(html).toContain("data-dashboard-period-sheet");
    expect(html).toContain(DASHBOARD_PERIOD_SHEET_HOST_CLASS);
    expect(html).toContain("app-sheet-rise");
    expect(html).toContain(DASHBOARD_ADMIN.allTime);
    expect(html).toContain(DASHBOARD_ADMIN.ytd);
    expect(html.split("data-dashboard-period=").length - 1).toBe(1);
    expect(html).not.toContain("data-dashboard-period-grains");
    expect(html).not.toContain("<select");
  });

  it("keeps Find-user off Dashboard and does not return Markets or Export", () => {
    const html = chromeHtml();
    expect(html).not.toContain("data-dashboard-user");
    expect(html).not.toContain("data-dashboard-user-overflow");
    expect(html).not.toContain("data-dashboard-user-sheet");
    expect(html).not.toContain(DASHBOARD_ADMIN.findUser);
    expect(html).not.toContain("FIND A USER ACCOUNT");
    expect(html).not.toContain(DASHBOARD_ADMIN.allCompany);
    expect(controlsSrc).not.toContain("Find a user account");
    expect(controlsSrc).not.toContain("data-dashboard-user");
    expect(craftSrc).not.toContain("DASHBOARD_USER_FIELD_DESKTOP_CLASS");
    expect(heroSrc).not.toMatch(/\bMarkets\b/);
    expect(heroSrc).not.toContain("Export CSV");
    expect(controlsSrc).not.toContain("Export CSV");
  });
});
