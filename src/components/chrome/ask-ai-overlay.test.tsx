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
  ASK_AI_OVERLAY_MARK_CLASS,
  askAiOverlayHref,
  fireAskAiOpenThen,
} from "@/lib/ask-ai-overlay";
import { ASK_GLOBEE } from "@/lib/ask-globee";
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
    expect(open).toContain("data-ask-ai-close");
    expect(open).toContain(ASK_AI_OVERLAY.dialog);
    expect(open).toContain("data-house-ai-mark");
    expect(open).toContain(ASK_AI_OVERLAY_MARK_CLASS);
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
