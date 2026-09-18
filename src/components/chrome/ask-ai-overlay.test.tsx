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

import { ASK_AI_OVERLAY, ASK_AI_OVERLAY_MARK_CLASS } from "@/lib/ask-ai-overlay";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { AskAiOpenButton, AskAiOverlayProvider } from "./ask-ai-overlay";
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
    expect(open).toContain("data-ask-ai-close");
    expect(open).toContain(ASK_AI_OVERLAY.dialog);
    expect(open).toContain("data-house-ai-mark");
    expect(open).toContain(ASK_AI_OVERLAY_MARK_CLASS);
    expect(open).toContain("t-heading");
    expect(open).toContain("data-page");
    expect(open).not.toContain("data-app-messages-frame");
    expect(open).not.toContain('href="/messages"');

    navigation.pathname = "/social";
    navigation.search = "";
    const closed = renderOverlay();
    expect(closed).toContain("data-page");
    expect(closed).not.toContain("data-ask-globee-landing");
    expect(closed).not.toContain(ASK_AI_OVERLAY.dialog);
    expect(closed).not.toContain("data-ask-ai-close");
  });
});
