import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/social" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
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
  return {
    __esModule: true,
    default: MockLink,
    useLinkStatus: () => ({ pending: false }),
  };
});

import { SOCIAL_NAV } from "@/lib/nav";
import {
  SOCIAL_TAB_BAR_CLASS,
  SOCIAL_TAB_BAR_ROW_CLASS,
  SOCIAL_TAB_PILL_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_TAB } from "@/lib/social-icons";
import { SocialMobileTabBar } from "./social-mobile-tab-bar";

describe("Social floating pill tab bar (Figma 157:1297 / 158:461)", () => {
  it("renders five icon jobs in a floating pill, no FAB", () => {
    navigation.pathname = "/social";
    const html = renderToStaticMarkup(createElement(SocialMobileTabBar));
    expect(html).toContain("data-social-tab-bar");
    expect(html).toContain("data-social-tab-pill");
    expect(html).toContain(SOCIAL_TAB_BAR_CLASS);
    expect(html).toContain(SOCIAL_TAB_PILL_CLASS);
    expect(html).toContain(SOCIAL_TAB_BAR_ROW_CLASS);
    expect(SOCIAL_TAB_PILL_CLASS).toContain("rounded-[28px]");
    expect(SOCIAL_TAB_PILL_CLASS).toContain("border-hairline");
    expect(SOCIAL_TAB_PILL_CLASS).toContain("h-14");
    expect(SOCIAL_TAB_BAR_CLASS).toContain("md:hidden");
    expect(SOCIAL_TAB_BAR_CLASS).toContain("env(safe-area-inset-bottom)");
    expect(html).not.toContain("data-social-create-fab");
    expect(html).not.toContain("data-social-mobile-pill");
    expect(html).not.toContain("data-social-mobile-dock");
    expect(html).not.toContain("data-social-tab-bar-hidden");
    for (const item of SOCIAL_NAV) {
      expect(html).toContain(`data-social-tab-item="${item.label}"`);
    }
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_TAB}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-social-icon-active=""');
  });

  it("marks Create fill-active on /social/create and Home on stories", () => {
    navigation.pathname = "/social/create";
    const create = renderToStaticMarkup(createElement(SocialMobileTabBar));
    const createSlice = create.slice(create.indexOf('data-social-tab-item="Create"'));
    expect(createSlice).toContain('data-social-icon="plus"');
    expect(createSlice).toContain('data-social-icon-active=""');

    navigation.pathname = "/social/stories/abc";
    const stories = renderToStaticMarkup(createElement(SocialMobileTabBar));
    const homeSlice = stories.slice(stories.indexOf('data-social-tab-item="Home"'));
    expect(homeSlice).toContain('data-social-icon="house"');
    expect(homeSlice).toContain('data-social-icon-active=""');
    expect(stories.slice(stories.indexOf('data-social-tab-item="Create"'))).not.toContain(
      'data-social-icon-active=""',
    );
  });
});
