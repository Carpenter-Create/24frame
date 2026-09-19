import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/home",
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/app/(app)/messages/ask-globee-actions", () => ({
  loadAskAiOverlay: vi.fn(async () => ({
    surface: "ask-globee-landing",
    initials: "A",
    conversations: [],
    conversation: null,
    messages: [],
  })),
  startAskGlobeeConversation: vi.fn(),
  appendAskGlobeeTurn: vi.fn(),
  completeAskGlobeeTurn: vi.fn(),
  setAskGlobeeThumb: vi.fn(),
  renameAskGlobeeConversation: vi.fn(),
  pinAskGlobeeConversation: vi.fn(),
  deleteAskGlobeeConversation: vi.fn(),
}));

import {
  ASK_AI_OVERLAY,
  ASK_AI_OVERLAY_BODY_CLASS,
  ASK_AI_OVERLAY_DESKTOP_COMPACT_CLASS,
  ASK_AI_OVERLAY_DESKTOP_DOCK_CLASS,
  ASK_AI_OVERLAY_EXPAND_CLASS,
  ASK_AI_OVERLAY_MARK_CLASS,
  ASK_AI_OVERLAY_PHONE_CLOCK_DOCK_CLASS,
  ASK_AI_OVERLAY_PHONE_COMPACT_CLASS,
  ASK_AI_OVERLAY_PHONE_EXPANDED_CLASS,
  ASK_AI_OVERLAY_PHONE_HISTORY_HOST_CLASS,
  ASK_AI_OVERLAY_PHONE_SCROLL_CLASS,
  askAiCloseHref,
  askAiOverlayDesktopClass,
  askAiOverlayHref,
  askAiOverlayPhoneClass,
  fireAskAiOpenThen,
} from "@/lib/ask-ai-overlay";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { HouseLeadChrome } from "./house-lead-chrome";
import { SocialTopBar } from "@/components/social/social-top-bar";
import { AskAiOpenButton, AskAiOverlayProvider, useAskAiOverlay } from "./ask-ai-overlay";
import { AskAssistantHeaderLink } from "./ask-assistant-header";

function renderOverlay(child?: ReactNode) {
  return renderToStaticMarkup(
    createElement(AskAiOverlayProvider, null, child ?? createElement("div", { "data-page": "" }, "Home")),
  );
}

describe("AskAiOverlay", () => {
  it("opens from chrome without changing the workspace path", () => {
    navigation.pathname = "/home";
    navigation.search = "";
    const header = renderToStaticMarkup(
      createElement(AskAiOverlayProvider, null, createElement(AskAssistantHeaderLink)),
    );
    expect(header).toContain("data-ask-assistant-header");
    expect(header).toContain("data-ask-ai-open");
    expect(header).toContain("data-house-ai-mark");
    expect(header).not.toContain('href="/messages"');
    expect(header).not.toContain('href="/home');
  });

  it("header AI glyph calls overlay open on the current path — never a workspace land", () => {
    const headerSrc = readFileSync(new URL("./ask-assistant-header.tsx", import.meta.url), "utf8");
    const overlaySrc = readFileSync(new URL("./ask-ai-overlay.tsx", import.meta.url), "utf8");
    const leadSrc = readFileSync(new URL("./house-lead-chrome.tsx", import.meta.url), "utf8");

    expect(headerSrc).toContain("AskAiOpenButton");
    expect(headerSrc).toContain("HouseAiMark");
    expect(headerSrc).toContain("data-ask-assistant-header");
    expect(headerSrc).not.toContain("next/link");
    expect(headerSrc).not.toContain("useRouter");
    expect(headerSrc).not.toMatch(/\bhref\b/);
    expect(headerSrc).not.toContain("/messages");
    expect(headerSrc).not.toContain("/dashboard");
    expect(headerSrc).not.toContain("/ai");
    expect(leadSrc).toContain("<AskAssistantHeaderLink />");
    expect(leadSrc.indexOf("<AskAssistantHeaderLink")).toBeLessThan(leadSrc.indexOf("<ActivityBell"));
    expect(overlaySrc).toContain("() => openAskAi(threadId)");
    expect(overlaySrc).toContain("askAiOverlayHref(pathname, currentAskAiSearch(), threadId)");
    expect(overlaySrc).toContain("router.push(href)");
    expect(overlaySrc).not.toContain('router.push("/messages")');
    expect(overlaySrc).not.toContain('router.push("/dashboard")');
    expect(overlaySrc).not.toContain('router.push("/ai")');

    navigation.pathname = "/social/explore";
    navigation.search = "";
    navigation.push.mockClear();
    navigation.replace.mockClear();

    let openAskAi: ((threadId?: string | null) => void) | undefined;
    function BindHeaderOpen() {
      openAskAi = useAskAiOverlay().openAskAi;
      return createElement(AskAssistantHeaderLink);
    }

    const header = renderToStaticMarkup(
      createElement(AskAiOverlayProvider, null, createElement(BindHeaderOpen)),
    );
    expect(header).toContain("data-ask-assistant-header");
    expect(header).toContain('type="button"');
    expect(header).toContain("data-ask-ai-open");
    expect(header).toContain("data-house-ai-mark");
    expect(header).not.toMatch(/href="/);
    expect(openAskAi).toEqual(expect.any(Function));

    fireAskAiOpenThen(() => openAskAi?.());

    expect(navigation.push).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith("/social/explore?ai=1");
    expect(navigation.replace).not.toHaveBeenCalled();
    const pushed = navigation.push.mock.calls.map((call) => String(call[0]));
    expect(pushed).toEqual(["/social/explore?ai=1"]);
    for (const href of pushed) {
      expect(href.startsWith("/social/explore?ai=")).toBe(true);
      expect(href).not.toMatch(/^\/(messages|dashboard|ai|home)(?:\?|$)/);
    }
  });

  it("opens from chrome, Home teaser, and phone sheet onto the same overlay — never /messages", () => {
    navigation.pathname = "/home";
    navigation.search = "ai=1";
    const html = renderToStaticMarkup(
      createElement(
        AskAiOverlayProvider,
        null,
        createElement(AskAssistantHeaderLink),
        createElement(AskAiOpenButton, { "data-overview-ai-ask": "" }, ASK_GLOBEE.headline),
        createElement(AskAiOpenButton, { "data-sheet-group-item": "askAssistant" }, ASK_GLOBEE.headline),
      ),
    );
    expect(html).toContain("data-ask-assistant-header");
    expect(html).toContain("data-overview-ai-ask");
    expect(html).toContain('data-sheet-group-item="askAssistant"');
    expect(html).toContain("data-ask-ai-overlay");
    expect(html).toContain("data-ask-ai-overlay-phone");
    expect(html).toContain("data-ask-ai-overlay-desktop");
    expect(html).not.toContain('href="/messages"');
    expect(html).not.toContain('href="/dashboard"');
    expect(askAiOverlayHref("/home")).toBe("/home?ai=1");
  });

  it("opens from the Home module CTA on the same overlay state", () => {
    navigation.pathname = "/home";
    const html = renderToStaticMarkup(
      createElement(
        AskAiOverlayProvider,
        null,
        createElement(AskAiOpenButton, { "data-overview-ai-ask": "" }, ASK_GLOBEE.headline),
      ),
    );
    expect(html).toContain("data-overview-ai-ask");
    expect(html).toContain("data-ask-ai-open");
    expect(html).toContain(ASK_GLOBEE.headline);
    expect(html).not.toContain('href="/messages"');
  });

  it("close href stays on the current workspace and leftover /messages never renders as AI land", () => {
    navigation.pathname = "/home";
    navigation.search = "ai=1";
    const open = renderOverlay();
    expect(open).toContain("data-ask-ai-overlay");
    expect(open).toContain("data-ask-ai-overlay-phone");
    expect(open).toContain("data-ask-ai-overlay-desktop");
    expect(open).toContain("data-ask-ai-close");
    expect(open).toContain(ASK_AI_OVERLAY.dialog);
    expect(open).toContain("data-house-ai-mark");
    expect(open).toContain(ASK_AI_OVERLAY_MARK_CLASS);
    expect(open).toContain(ASK_AI_OVERLAY_DESKTOP_COMPACT_CLASS);
    expect(open).toContain(ASK_AI_OVERLAY_DESKTOP_DOCK_CLASS);
    expect(open).not.toContain("<dialog");
    expect(open).not.toContain("m-auto");
    expect(open).toContain("t-heading");
    expect(open).toContain("data-page");
    expect(open).toContain("md:hidden");
    expect(open).not.toContain("data-app-messages-frame");
    expect(open).not.toContain('href="/messages"');

    navigation.pathname = "/social";
    navigation.search = "";
    const closed = renderOverlay();
    expect(closed).toContain("data-page");
    expect(closed).not.toContain("data-ask-globee-landing");
    expect(closed).not.toContain(ASK_AI_OVERLAY.dialog);
    expect(closed).not.toContain("data-ask-ai-close");
    expect(closed).not.toContain("data-ask-ai-overlay-phone");
    expect(closed).not.toContain("data-ask-ai-overlay-desktop");
  });

  it("header AI is on every house chrome path and opens the same overlay window", () => {
    const paths = [
      { pathname: "/home", workspace: "aggregation" as const },
      { pathname: "/social", workspace: "social" as const },
      { pathname: "/dashboard", workspace: "aggregation" as const },
      { pathname: "/social/courses", workspace: "education" as const },
    ];

    for (const { pathname, workspace } of paths) {
      navigation.pathname = pathname;
      navigation.search = "";
      const html = renderToStaticMarkup(
        createElement(
          AskAiOverlayProvider,
          null,
          createElement(HouseLeadChrome, {
            workspace,
            accountMenu: createElement("div", { "data-user-menu-host": "" }),
          }),
        ),
      );
      expect(html).toContain("data-ask-assistant-header");
      expect(html).toContain("data-ask-ai-open");
      expect(html).toContain("data-activity-bell");
      expect(html.indexOf("data-ask-assistant-header")).toBeLessThan(
        html.indexOf("data-activity-bell"),
      );
    }

    const social = renderToStaticMarkup(
      createElement(
        AskAiOverlayProvider,
        null,
        createElement(SocialTopBar, { email: "ada@example.com", name: "Ada" }),
      ),
    );
    expect(social).toContain("data-ask-assistant-header");
    expect(social).toContain("data-ask-ai-open");

    const settings = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        settingsPage: true,
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    expect(settings).toContain("data-ask-assistant-header");
  });

  it("expand/collapse stays overlay-scoped and phone starts as a sheet", () => {
    const overlaySrc = readFileSync(new URL("./ask-ai-overlay.tsx", import.meta.url), "utf8");
    expect(overlaySrc).toContain("toggleAskAiExpanded");
    expect(overlaySrc).toContain("setExpanded(false)");
    expect(overlaySrc).toContain("askAiOverlayPhoneClass(expanded)");
    expect(overlaySrc).toContain("askAiOverlayDesktopClass(expanded)");
    expect(overlaySrc).toContain("ASK_AI_OVERLAY_EXPAND_CLASS");
    expect(overlaySrc).not.toContain("showModal");
    expect(overlaySrc).not.toContain("<dialog");
    expect(overlaySrc).not.toContain("hidden size-[44px]");
    expect(overlaySrc).not.toContain('data-ask-ai-expanded="true"');
    expect(askAiOverlayDesktopClass(false)).toBe(ASK_AI_OVERLAY_DESKTOP_COMPACT_CLASS);
    expect(askAiOverlayDesktopClass(false)).toContain("bottom-[var(--space-6)]");
    expect(ASK_AI_OVERLAY_EXPAND_CLASS).toContain("flex");
    expect(ASK_AI_OVERLAY_EXPAND_CLASS).not.toContain("hidden");
    expect(ASK_AI_OVERLAY_EXPAND_CLASS).not.toContain("md:flex");
    expect(askAiOverlayPhoneClass(false)).toBe(ASK_AI_OVERLAY_PHONE_COMPACT_CLASS);
    expect(askAiOverlayPhoneClass(true)).toBe(ASK_AI_OVERLAY_PHONE_EXPANDED_CLASS);
    expect(ASK_AI_OVERLAY_PHONE_COMPACT_CLASS).toContain("70dvh");
    expect(ASK_AI_OVERLAY_PHONE_EXPANDED_CLASS).toContain("h-dvh");

    navigation.pathname = "/social/courses";
    navigation.search = "ai=1";
    navigation.push.mockClear();
    navigation.replace.mockClear();

    let closeAskAi: (() => void) | undefined;
    let toggleAskAiExpanded: (() => void) | undefined;
    function BindOverlayControls() {
      const overlay = useAskAiOverlay();
      closeAskAi = overlay.closeAskAi;
      toggleAskAiExpanded = overlay.toggleAskAiExpanded;
      return createElement(AskAssistantHeaderLink);
    }

    const open = renderToStaticMarkup(
      createElement(AskAiOverlayProvider, null, createElement(BindOverlayControls)),
    );
    expect(open).toContain("data-ask-ai-overlay-phone");
    expect(open).toContain("data-ask-ai-overlay-desktop");
    expect(open).toContain("data-ask-ai-expand");
    expect(open).toContain(ASK_AI_OVERLAY.expand);
    expect(open).toContain(ASK_AI_OVERLAY_PHONE_COMPACT_CLASS);
    expect(open).toContain(ASK_AI_OVERLAY_DESKTOP_COMPACT_CLASS);
    expect(open).not.toContain('data-ask-ai-expanded="true"');
    expect(open).toContain("data-ask-assistant-header");

    toggleAskAiExpanded?.();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();

    closeAskAi?.();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(navigation.replace).toHaveBeenCalledWith("/social/courses");
    expect(askAiCloseHref("/social/courses", "ai=1")).toBe("/social/courses");
    expect(askAiCloseHref("/home", "ai=1")).toBe("/home");
    expect(askAiOverlayHref("/dashboard")).toBe("/dashboard?ai=1");
    expect(askAiOverlayHref("/social")).not.toContain("/messages");
    expect(askAiOverlayHref("/social")).not.toContain("/ai");
  });

  it("anchors overlay chat bottom-up like Mercury, not a top-down empty header", () => {
    const overlaySrc = readFileSync(new URL("./ask-ai-overlay.tsx", import.meta.url), "utf8");
    const landingSrc = readFileSync(
      new URL("../messages/ask-globee-landing.tsx", import.meta.url),
      "utf8",
    );
    const threadSrc = readFileSync(
      new URL("../messages/ask-globee-thread.tsx", import.meta.url),
      "utf8",
    );

    expect(overlaySrc).toContain("ASK_AI_OVERLAY_BODY_CLASS");
    expect(overlaySrc).toContain("AskAiOverlayBody");
    expect(overlaySrc).toContain("data-ask-ai-overlay-phone-history");
    expect(overlaySrc).toContain("ASK_AI_OVERLAY_PHONE_HISTORY_HOST_CLASS");
    expect(overlaySrc).toContain("overscroll-none");
    expect(overlaySrc).toContain("pointer-events-auto");
    expect(ASK_AI_OVERLAY_BODY_CLASS).toContain("overflow-hidden");
    expect(ASK_AI_OVERLAY_BODY_CLASS).not.toContain("overflow-auto");
    expect(ASK_AI_OVERLAY_PHONE_SCROLL_CLASS).toContain("max-md:overflow-y-scroll");
    expect(ASK_AI_OVERLAY_PHONE_SCROLL_CLASS).toContain("max-md:[touch-action:pan-y]");
    expect(ASK_AI_OVERLAY_PHONE_HISTORY_HOST_CLASS).toContain("max-md:flex");
    expect(ASK_AI_OVERLAY_PHONE_CLOCK_DOCK_CLASS).toContain("max-md:left-[var(--space-4)]");
    expect(ASK_AI_OVERLAY_PHONE_COMPACT_CLASS).toContain("overscroll-none");
    expect(landingSrc).toContain("flex-col-reverse");
    expect(landingSrc).not.toContain("justify-center gap-[var(--space-12)]");
    expect(landingSrc).not.toContain("justify-end gap-[var(--space-12)]");
    expect(landingSrc.indexOf("data-ask-globee-try=")).toBeLessThan(
      landingSrc.indexOf("data-ask-globee-composer="),
    );
    expect(threadSrc).toContain("flex-col-reverse");
    expect(threadSrc).toContain("[...turns].reverse()");
    expect(threadSrc).toContain("shrink-0");
    expect(threadSrc.indexOf("data-ask-globee-conversation")).toBeLessThan(
      threadSrc.indexOf("data-ask-globee-composer="),
    );

    navigation.pathname = "/home";
    navigation.search = "ai=1";
    const html = renderOverlay();
    expect(html).toContain("data-ask-ai-overlay-body");
    expect(html).toContain("data-ask-globee-landing");
    expect(html).toContain("flex-col-reverse");
    expect(html.indexOf("data-ask-globee-headline")).toBeLessThan(
      html.indexOf("data-ask-globee-composer"),
    );
    expect(html.indexOf("data-ask-globee-try")).toBeLessThan(
      html.indexOf("data-ask-globee-composer"),
    );
  });

  it("keeps the live opener when search params suspend — children never remount under NOOP", () => {
    const overlaySrc = readFileSync(new URL("./ask-ai-overlay.tsx", import.meta.url), "utf8");
    expect(overlaySrc).not.toContain("NOOP_ASK_AI");
    expect(overlaySrc).not.toMatch(/fallback=\{<AskAiOverlayContext\.Provider/);
    expect(overlaySrc).not.toMatch(/value=\{NOOP_ASK_AI\}>\{children\}/);
    expect(overlaySrc).toMatch(
      /<AskAiOverlayContext\.Provider value=\{value\}>\s*\{children\}/,
    );
    expect(overlaySrc.indexOf("openAskAi(threadId)")).toBeLessThan(
      overlaySrc.indexOf("onClick?.(event)"),
    );
  });
});
