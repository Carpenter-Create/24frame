import { ASK_ASSISTANT } from "@/lib/product";
import { isAskGlobeeThreadId } from "@/lib/ask-globee";
import { workspaceHome, type WorkspaceMode } from "@/lib/workspace";

// Mercury Command overlay — 24Frame AI is never a workspace destination.
// Open state lives on the current path as `?ai=1` (landing) or `?ai=<uuid>`
// (thread). Back/close strips the param and leaves the underlying view.

export const ASK_AI_QUERY = "ai";
export const ASK_AI_OPEN_VALUE = "1";
export const ASK_AI_LEGACY_PATH = "/messages";
export const ASK_AI_RETURN_STORAGE = "frame_ask_ai_return";

export const ASK_AI_OVERLAY = {
  label: ASK_ASSISTANT,
  close: "Close",
  expand: "Expand",
  collapse: "Close expand",
  dialog: ASK_ASSISTANT,
} as const;

// Overlay chrome mark — 32 house face, Sporty Blue. Visual weight on
// the sparkle cluster, not a 16 chrome whisper. Same HouseAiMark SoT.
export const ASK_AI_OVERLAY_MARK_CLASS = "size-8 shrink-0 text-accent";

export const ASK_AI_OVERLAY_COMPACT_CLASS =
  "flex h-[min(36rem,70dvh)] w-[min(92vw,40rem)] max-w-[40rem] flex-col overflow-hidden";

export const ASK_AI_OVERLAY_EXPANDED_CLASS =
  "flex h-[min(94dvh,calc(100dvh-var(--space-8)))] w-[min(96vw,80rem)] max-w-[80rem] flex-col overflow-hidden";

export const ASK_AI_OVERLAY_PHONE_CLASS =
  "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0";

export type AskAiOverlayState = {
  open: boolean;
  threadId: string | null;
};

function readSearchValue(
  search: { get(name: string): string | null } | Record<string, string | string[] | undefined> | string,
  name: string,
): string | null {
  if (typeof search === "string") {
    const value = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(name);
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  }
  const raw =
    "get" in search && typeof search.get === "function"
      ? search.get(name)
      : (search as Record<string, string | string[] | undefined>)[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function copySearchParams(
  search:
    | { get(name: string): string | null; toString(): string }
    | Record<string, string | string[] | undefined>
    | string
    | null
    | undefined,
): URLSearchParams {
  if (!search) return new URLSearchParams();
  if (typeof search === "string") {
    return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  }
  if ("toString" in search && typeof search.toString === "function" && "get" in search) {
    return new URLSearchParams(search.toString());
  }
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(search as Record<string, string | string[] | undefined>)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === "string" && value.trim()) params.set(key, value);
  }
  return params;
}

export function readAskAiOverlay(
  search:
    | { get(name: string): string | null }
    | Record<string, string | string[] | undefined>
    | string
    | null
    | undefined,
): AskAiOverlayState {
  const value = search ? readSearchValue(search, ASK_AI_QUERY) : null;
  if (!value) return { open: false, threadId: null };
  if (isAskGlobeeThreadId(value)) return { open: true, threadId: value };
  return { open: true, threadId: null };
}

export function isLegacyAskAiPath(pathname: string): boolean {
  return pathname === ASK_AI_LEGACY_PATH || pathname.startsWith(`${ASK_AI_LEGACY_PATH}/`);
}

export function askAiOverlayHref(
  pathname: string,
  search?:
    | { get(name: string): string | null; toString(): string }
    | Record<string, string | string[] | undefined>
    | string
    | null,
  threadId?: string | null,
): string {
  const params = copySearchParams(search);
  params.delete("thread");
  params.delete("q");
  if (threadId && isAskGlobeeThreadId(threadId)) {
    params.set(ASK_AI_QUERY, threadId);
  } else {
    params.set(ASK_AI_QUERY, ASK_AI_OPEN_VALUE);
  }
  const next = params.toString();
  return next ? `${pathname}?${next}` : `${pathname}?${ASK_AI_QUERY}=${ASK_AI_OPEN_VALUE}`;
}

export function askAiCloseHref(
  pathname: string,
  search?:
    | { get(name: string): string | null; toString(): string }
    | Record<string, string | string[] | undefined>
    | string
    | null,
): string {
  const params = copySearchParams(search);
  params.delete(ASK_AI_QUERY);
  params.delete("thread");
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

export function rememberAskAiReturnPath(pathname: string): void {
  if (typeof sessionStorage === "undefined") return;
  if (!pathname || isLegacyAskAiPath(pathname)) return;
  sessionStorage.setItem(ASK_AI_RETURN_STORAGE, pathname);
}

export function readAskAiReturnPath(fallback: string): string {
  if (typeof sessionStorage === "undefined") return fallback;
  const stored = sessionStorage.getItem(ASK_AI_RETURN_STORAGE)?.trim() ?? "";
  if (!stored || isLegacyAskAiPath(stored)) return fallback;
  return stored;
}

export function legacyAskAiFallbackPath(workspace: WorkspaceMode = "aggregation"): string {
  return workspace === "aggregation" ? "/home" : workspaceHome(workspace);
}

/** Sheet/nav onClose may unmount the control. Open first so the commit survives. */
export function fireAskAiOpenThen(
  openAskAi: (threadId?: string | null) => void,
  then?: () => void,
  threadId?: string | null,
): void {
  openAskAi(threadId);
  then?.();
}

export function askAiStateFromHref(href: string): AskAiOverlayState {
  const query = href.indexOf("?");
  return readAskAiOverlay(query >= 0 ? href.slice(query + 1) : "");
}

export function currentAskAiSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

export function isAskAiDesktopViewport(
  matchMedia: ((query: string) => { matches: boolean }) | undefined = typeof window === "undefined"
    ? undefined
    : window.matchMedia.bind(window),
): boolean {
  return Boolean(matchMedia?.("(min-width: 768px)").matches);
}

export function legacyAskAiInterceptHref(input: {
  threadId?: string | null;
  returnPath?: string | null;
  workspace?: WorkspaceMode;
  search?:
    | { get(name: string): string | null; toString(): string }
    | Record<string, string | string[] | undefined>
    | string
    | null;
}): string {
  const fallback = legacyAskAiFallbackPath(input.workspace);
  const returnPath = input.returnPath?.trim();
  const path =
    returnPath && !isLegacyAskAiPath(returnPath) ? returnPath.split("?")[0] || fallback : fallback;
  return askAiOverlayHref(path, input.search, input.threadId);
}
