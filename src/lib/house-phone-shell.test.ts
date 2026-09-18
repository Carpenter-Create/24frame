import { createElement } from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: React.ReactNode;
    prefetch?: boolean;
  }) {
    return React.createElement("a", { href, ...props }, children);
  }
  return { __esModule: true, default: MockLink };
});

import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { HousePhoneAppShell } from "@/components/chrome/house-phone-app-shell";
import { HousePhoneBottomNav } from "@/components/chrome/house-phone-bottom-nav";
import { HousePhoneTopChrome } from "@/components/chrome/house-phone-top-chrome";
import { SocialPhoneDests } from "@/components/social/social-phone-dests";
import { SocialTopBar } from "@/components/social/social-top-bar";
import {
  HOUSE_PHONE_BOTTOM_NAV,
  HOUSE_PHONE_BOTTOM_NAV_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS,
  HOUSE_PHONE_WORKSPACE_TABS,
  SOCIAL_PHONE_DESTS,
  housePhoneWorkspaceSelected,
} from "@/lib/house-phone-shell";
import { SOCIAL_ROUTES } from "@/lib/social";
import {
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
} from "@/lib/workspace-switcher";

const leadSrc = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const phoneShellSrc = readFileSync("src/lib/house-phone-shell.ts", "utf8");

function renderLead(
  workspace: "aggregation" | "social" | "education",
  destRail = false,
) {
  return renderToStaticMarkup(
    createElement(HouseLeadChrome, {
      workspace,
      trailingNav: destRail
        ? createElement("button", { "data-mobile-nav-trigger": "" })
        : undefined,
      trailingSearch:
        workspace === "social"
          ? createElement("button", { "data-social-header-search-icon": "" })
          : undefined,
      accountMenu: createElement("div", { "data-account-sheet-trigger": "" }),
    }),
  );
}

describe("phone app-shell Option 2 — workspace bottom bar", () => {
  it("keeps phone top free of a workspace pill and desktop switcher in the header", () => {
    expect(leadSrc).not.toContain("data-app-header-workspace-pill");
    expect(leadSrc).not.toContain('tone="pill"');
    expect(leadSrc).toContain('presentation="pills"');
    expect(leadSrc).toContain("APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS");
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(1);
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("hidden");
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("md:contents");

    const aggregation = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    expect(aggregation).not.toContain("data-app-header-workspace-pill");
    expect(aggregation).not.toContain('data-workspace-switcher-tone="pill"');
    expect(aggregation).toContain('data-workspace-switcher-presentation="pills"');
    expect(aggregation).toContain("data-app-header-workspace-desktop");

    const top = renderToStaticMarkup(
      createElement(HousePhoneTopChrome, {
        workspace: "social",
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    expect(top).toContain("data-house-lead-chrome");
    expect(top).not.toContain("data-app-header-workspace-pill");
  });

  it("keeps Agg/Edu emblem alone on the left and puts hamburger in the trailing cluster", () => {
    expect(shellSrc).toContain("trailingNav=");
    expect(shellSrc).toContain("settingsPage || homeChrome ? undefined");
    expect(shellSrc).toContain("Emblem owns the left alone");

    const aggregation = renderLead("aggregation", true);
    const aggLead = aggregation.slice(
      aggregation.indexOf("data-app-header-leading"),
      aggregation.indexOf("data-app-header-trailing"),
    );
    const aggTrail = aggregation.slice(aggregation.indexOf("data-app-header-trailing"));
    expect(aggLead).toContain("data-brand-emblem");
    expect(aggLead).not.toContain("data-mobile-nav-trigger");
    expect(aggTrail).toContain("data-mobile-nav-trigger");
    expect(aggTrail).toContain("data-app-header-trailing-nav");
    expect(aggregation.indexOf("data-brand-emblem")).toBeLessThan(
      aggregation.indexOf("data-mobile-nav-trigger"),
    );
    expect(aggregation.indexOf("data-mobile-nav-trigger")).toBeLessThan(
      aggregation.indexOf("data-activity-bell"),
    );
    expect(aggregation.indexOf("data-activity-bell")).toBeLessThan(
      aggregation.indexOf("data-account-sheet-trigger"),
    );

    const education = renderLead("education", true);
    const eduLead = education.slice(
      education.indexOf("data-app-header-leading"),
      education.indexOf("data-app-header-trailing"),
    );
    expect(eduLead).toContain("data-brand-emblem");
    expect(eduLead).not.toContain("data-mobile-nav-trigger");
    expect(education.indexOf("data-mobile-nav-trigger")).toBeGreaterThan(
      education.indexOf("data-app-header-trailing"),
    );
    expect(education.indexOf("data-mobile-nav-trigger")).toBeLessThan(
      education.indexOf("data-activity-bell"),
    );

    const home = renderLead("aggregation", false);
    expect(home).toContain("data-brand-emblem");
    expect(home).not.toContain("data-mobile-nav-trigger");

    const social = renderLead("social", false);
    expect(social).toContain("data-brand-emblem");
    expect(social).not.toContain("data-mobile-nav-trigger");
    expect(social.indexOf("data-social-header-search-icon")).toBeGreaterThan(
      social.indexOf("data-app-header-trailing"),
    );
    expect(social.indexOf("data-social-header-search-icon")).toBeLessThan(
      social.indexOf("data-activity-bell"),
    );
  });

  it("ships exactly four phone workspace tabs in one shared bottom bar", () => {
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.id)).toEqual([
      "home",
      "social",
      "aggregation",
      "education",
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.label)).toEqual([
      "Home",
      "Social",
      "Aggregation",
      "Education",
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.href)).toEqual([
      "/home",
      "/social",
      "/dashboard",
      "/social/courses",
    ]);
    expect(HOUSE_PHONE_BOTTOM_NAV.label).toBe("Workspaces");
    expect(HOUSE_PHONE_BOTTOM_NAV_CLASS).toContain("md:hidden");
    expect(HOUSE_PHONE_BOTTOM_NAV_CLASS).toContain("env(safe-area-inset-bottom)");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("rounded-[28px]");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("border-hairline");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("h-14");
    expect(HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS).toContain("max-md:pb-");
    expect(phoneShellSrc).toContain("Option 2");
    expect(existsSync("src/components/social/social-mobile-tab-bar.tsx")).toBe(false);

    navigation.pathname = "/dashboard";
    const html = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "aggregation" }),
    );
    expect(html).toContain("data-house-phone-bottom-nav");
    expect(html).toContain("data-house-phone-bottom-nav-pill");
    expect(html.match(/data-house-phone-bottom-nav-item=/g)?.length).toBe(4);
    expect(html).toContain('data-house-phone-bottom-nav-item="home"');
    expect(html).toContain('data-house-phone-bottom-nav-item="social"');
    expect(html).toContain('data-house-phone-bottom-nav-item="aggregation"');
    expect(html).toContain('data-house-phone-bottom-nav-item="education"');
    expect(html).not.toContain("data-social-tab-bar");
    expect(html.indexOf('data-house-phone-bottom-nav-item="home"')).toBeLessThan(
      html.indexOf('data-house-phone-bottom-nav-item="social"'),
    );
    expect(html.indexOf('data-house-phone-bottom-nav-item="social"')).toBeLessThan(
      html.indexOf('data-house-phone-bottom-nav-item="aggregation"'),
    );
    expect(housePhoneWorkspaceSelected("aggregation", "/dashboard", "aggregation")).toBe(true);
    expect(housePhoneWorkspaceSelected("home", "/home", "aggregation")).toBe(true);
    expect(housePhoneWorkspaceSelected("social", "/social/explore", "social")).toBe(true);
    expect(housePhoneWorkspaceSelected("education", "/social/courses", "education")).toBe(true);
    expect(housePhoneWorkspaceSelected("aggregation", "/home", "aggregation")).toBe(false);
  });

  it("mounts one HousePhoneAppShell on every workspace and keeps Social off a second float", () => {
    expect(shellSrc).toContain("<HousePhoneAppShell");
    expect(shellSrc.match(/<HousePhoneAppShell/g)?.length).toBe(2);
    expect(shellSrc).not.toContain("SocialMobileTabBar");
    expect(shellSrc).not.toContain("data-social-tab-bar");
    expect(shellSrc).toContain("SocialPhoneDests");
    expect(shellSrc).toContain("HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS");
    expect(SOCIAL_PHONE_DESTS.map((item) => item.label)).toEqual([
      "Explore",
      "Create",
      "Messages",
      "Profile",
    ]);
    expect(SOCIAL_PHONE_DESTS.map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
      SOCIAL_ROUTES.profile,
    ]);

    navigation.pathname = "/home";
    const home = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "aggregation" },
        createElement(HouseLeadChrome, {
          workspace: "aggregation",
          accountMenu: createElement("div", { "data-user-menu-host": "" }),
        }),
      ),
    );
    expect(home).toContain("data-house-phone-app-shell");
    expect(home).toContain("data-house-phone-bottom-nav");
    expect(home).not.toContain("data-app-header-workspace-pill");
    expect(home).not.toContain("data-social-tab-bar");
    expect(home).not.toContain("data-social-phone-dests");
    expect(home).toContain('data-workspace-switcher-presentation="pills"');

    navigation.pathname = "/social";
    const social = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "social" },
        createElement(SocialPhoneDests),
      ),
    );
    expect(social).toContain("data-house-phone-bottom-nav");
    expect(social).toContain("data-social-phone-dests");
    expect(social).toContain('data-social-phone-dest="Explore"');
    expect(social).toContain('data-social-phone-dest="Create"');
    expect(social).toContain('data-social-phone-dest="Messages"');
    expect(social).toContain('data-social-phone-dest="Profile"');
    expect(social).not.toContain("data-social-tab-bar");
    expect(social).not.toContain('data-social-tab-item="Create"');
    expect(social).not.toContain("data-app-header-workspace-pill");
    expect((social.match(/data-house-phone-bottom-nav=""/g) ?? []).length).toBe(1);

    navigation.pathname = "/social/courses";
    const education = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "education" },
        createElement(HouseLeadChrome, {
          workspace: "education",
          accountMenu: createElement("div", { "data-user-menu-host": "" }),
        }),
      ),
    );
    expect(education).toContain("data-house-phone-bottom-nav");
    expect(education).not.toContain("data-social-phone-dests");
    expect(education).not.toContain("data-social-tab-bar");
    expect(education).toContain('data-workspace-switcher-presentation="pills"');

    const dests = renderToStaticMarkup(createElement(SocialPhoneDests));
    expect(dests).toContain("data-social-phone-dests");
    expect(dests).not.toContain("data-social-tab-bar");
    expect(dests).not.toContain('data-social-phone-dest="Home"');

    const wrapped = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "aggregation" },
        createElement(SocialTopBar, { email: "ada@example.com" }),
      ),
    );
    expect(wrapped).toContain("data-house-phone-app-shell");
    expect(wrapped).toContain("data-house-phone-bottom-nav");
    expect(wrapped).toContain("data-house-lead-chrome");
  });
});
