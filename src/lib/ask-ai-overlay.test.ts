import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ASK_AI_LEGACY_PATH,
  ASK_AI_OPEN_VALUE,
  ASK_AI_OVERLAY,
  ASK_AI_OVERLAY_BODY_CLASS,
  ASK_AI_OVERLAY_EXPAND_CLASS,
  ASK_AI_OVERLAY_MARK_CLASS,
  ASK_AI_QUERY,
  ASK_AI_RETURN_STORAGE,
  askAiCloseHref,
  askAiOverlayHref,
  askAiOverlayPhoneClass,
  askAiStateFromHref,
  fireAskAiOpenThen,
  isAskAiDesktopViewport,
  isLegacyAskAiPath,
  legacyAskAiFallbackPath,
  legacyAskAiInterceptHref,
  readAskAiOverlay,
  readAskAiReturnPath,
  rememberAskAiReturnPath,
} from "./ask-ai-overlay";

const THREAD = "2f1c8b6a-4d3e-4a11-9c22-7b8e1d0a5f44";
const memory = new Map<string, string>();

describe("ask AI overlay URL", () => {
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      clear: () => memory.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens on the current path — never an Aggregation AI land", () => {
    expect(askAiOverlayHref("/home")).toBe("/home?ai=1");
    expect(askAiOverlayHref("/social")).toBe("/social?ai=1");
    expect(askAiOverlayHref("/social/courses")).toBe("/social/courses?ai=1");
    expect(askAiOverlayHref("/dashboard", "period=this-year")).toBe("/dashboard?period=this-year&ai=1");
    expect(askAiOverlayHref("/home", "", THREAD)).toBe(`/home?ai=${THREAD}`);
    expect(askAiOverlayHref("/home", "ai=1", THREAD)).toBe(`/home?ai=${THREAD}`);
    expect(askAiOverlayHref("/messages", "thread=" + THREAD, THREAD)).toBe(`/messages?ai=${THREAD}`);
    expect(isLegacyAskAiPath(ASK_AI_LEGACY_PATH)).toBe(true);
    expect(isLegacyAskAiPath("/messages/extra")).toBe(true);
    expect(isLegacyAskAiPath("/home")).toBe(false);
    expect(ASK_AI_QUERY).toBe("ai");
    expect(ASK_AI_OPEN_VALUE).toBe("1");
    expect(ASK_AI_OVERLAY.dialog).toBe("Ask 24Frame AI");
    expect(askAiOverlayPhoneClass(false)).toContain("70dvh");
    expect(askAiOverlayPhoneClass(true)).toContain("h-dvh");
    expect(ASK_AI_OVERLAY_EXPAND_CLASS).not.toContain("hidden");
    expect(ASK_AI_OVERLAY_EXPAND_CLASS).not.toContain("md:flex");
    expect(ASK_AI_OVERLAY_BODY_CLASS).toContain("overflow-hidden");
    expect(ASK_AI_OVERLAY_BODY_CLASS).toContain("[&_[data-ask-globee-landing]]:h-full");
    expect(ASK_AI_OVERLAY_BODY_CLASS).toContain("[&_[data-ask-globee-thread]]:h-full");
    expect(ASK_AI_OVERLAY_BODY_CLASS).not.toContain("overflow-auto");
  });

  it("reads open + thread from the current search and closes back to the same path", () => {
    expect(readAskAiOverlay("")).toEqual({ open: false, threadId: null });
    expect(readAskAiOverlay("ai=1")).toEqual({ open: true, threadId: null });
    expect(readAskAiOverlay({ ai: THREAD })).toEqual({ open: true, threadId: THREAD });
    expect(readAskAiOverlay(new URLSearchParams("q=keep&ai=1"))).toEqual({
      open: true,
      threadId: null,
    });
    expect(askAiCloseHref("/home", "ai=1")).toBe("/home");
    expect(askAiCloseHref("/titles", "q=harbor&ai=1")).toBe("/titles?q=harbor");
    expect(askAiCloseHref("/social", { ai: THREAD })).toBe("/social");
  });

  it("intercepts leftover /messages onto the prior workspace path", () => {
    expect(legacyAskAiFallbackPath("aggregation")).toBe("/home");
    expect(legacyAskAiFallbackPath("social")).toBe("/social");
    expect(legacyAskAiFallbackPath("education")).toBe("/social/courses");
    expect(legacyAskAiInterceptHref({})).toBe("/home?ai=1");
    expect(legacyAskAiInterceptHref({ returnPath: "/social", threadId: THREAD })).toBe(
      `/social?ai=${THREAD}`,
    );
    expect(legacyAskAiInterceptHref({ returnPath: "/messages", workspace: "social" })).toBe(
      "/social?ai=1",
    );
    rememberAskAiReturnPath("/education");
    expect(memory.get(ASK_AI_RETURN_STORAGE)).toBe("/education");
    rememberAskAiReturnPath("/messages");
    expect(readAskAiReturnPath("/home")).toBe("/education");
  });

  it("chrome / Home / sheet openers write ?ai=1 on the current path — never /messages", () => {
    const overlaySrc = readFileSync(new URL("../components/chrome/ask-ai-overlay.tsx", import.meta.url), "utf8");
    const headerSrc = readFileSync(new URL("../components/chrome/ask-assistant-header.tsx", import.meta.url), "utf8");
    const moduleSrc = readFileSync(new URL("../components/overview/overview-module.tsx", import.meta.url), "utf8");
    const sheetSrc = readFileSync(new URL("../components/chrome/account-sheet.tsx", import.meta.url), "utf8");
    const sideNavSrc = readFileSync(new URL("../components/chrome/side-nav.tsx", import.meta.url), "utf8");
    const destChipsSrc = readFileSync(
      new URL("../components/chrome/house-phone-dest-chips.tsx", import.meta.url),
      "utf8",
    );

    expect(askAiOverlayHref("/home")).toBe("/home?ai=1");
    expect(askAiOverlayHref("/home")).not.toContain("/messages");
    expect(askAiOverlayHref("/home")).not.toContain("/dashboard");
    expect(headerSrc).toContain("AskAiOpenButton");
    expect(headerSrc).not.toContain("next/link");
    expect(headerSrc).not.toMatch(/\bhref\b/);
    expect(headerSrc).not.toContain("/messages");
    expect(headerSrc).not.toContain("/dashboard");
    expect(headerSrc).not.toContain("/ai");
    expect(moduleSrc).toContain("AskAiOpenButton");
    expect(moduleSrc).toContain("data-overview-ai-ask");
    expect(sheetSrc).toContain("AskAiOpenButton");
    expect(sheetSrc).toContain('data-sheet-group-item="askAssistant"');
    expect(sideNavSrc).toContain("AskAiOpenButton");
    expect(destChipsSrc).toContain("housePhoneDestinations");
    expect(destChipsSrc).not.toContain("AskAiOpenButton");
    expect(destChipsSrc).not.toContain("/messages");

    expect(overlaySrc).not.toContain("NOOP_ASK_AI");
    expect(overlaySrc).not.toMatch(/value=\{NOOP_ASK_AI\}>\{children\}/);
    expect(overlaySrc).not.toMatch(/fallback=\{<AskAiOverlayContext\.Provider/);
    expect(overlaySrc).not.toMatch(/fallback=\{[^;]{0,120}\{children\}/);

    const openAt = overlaySrc.indexOf("openAskAi(threadId)");
    const closeAt = overlaySrc.indexOf("onClick?.(event)");
    expect(openAt).toBeGreaterThan(-1);
    expect(closeAt).toBeGreaterThan(-1);
    expect(openAt).toBeLessThan(closeAt);
    expect(overlaySrc).toContain("data-ask-ai-overlay-phone");

    const order: string[] = [];
    fireAskAiOpenThen(
      () => order.push(askAiOverlayHref("/home")),
      () => order.push("close"),
    );
    expect(order).toEqual(["/home?ai=1", "close"]);
    expect(askAiStateFromHref("/home?ai=1")).toEqual({ open: true, threadId: null });
    expect(isAskAiDesktopViewport(() => ({ matches: false }))).toBe(false);
    expect(isAskAiDesktopViewport(() => ({ matches: true }))).toBe(true);
  });

  it("does not name the return slot a KEY — generic-api-key false positive", () => {
    expect(ASK_AI_RETURN_STORAGE).toBe("frame_ask_ai_return");
    expect(ASK_AI_RETURN_STORAGE).not.toMatch(/\d/);
    expect(ASK_AI_OVERLAY_MARK_CLASS).toContain("size-8");
    expect(ASK_AI_OVERLAY_MARK_CLASS).toContain("text-accent");
    expect(ASK_AI_OVERLAY_MARK_CLASS).not.toContain("#");
    const src = readFileSync(new URL("./ask-ai-overlay.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/ASK_AI_RETURN_\w*KEY\s*=/);
    expect(src).not.toContain("STORAGE_KEY");
    expect(src).not.toMatch(/\b\d[A-Za-z0-9_]*ask_ai_return\b/);
  });
});
