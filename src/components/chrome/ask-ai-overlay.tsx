"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowsIn, ArrowsOut } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { cn } from "@/lib/cn";
import {
  ASK_AI_OVERLAY,
  ASK_AI_OVERLAY_COMPACT_CLASS,
  ASK_AI_OVERLAY_EXPANDED_CLASS,
  ASK_AI_OVERLAY_MARK_CLASS,
  ASK_AI_OVERLAY_PHONE_CLASS,
  askAiCloseHref,
  askAiOverlayHref,
  isLegacyAskAiPath,
  legacyAskAiFallbackPath,
  legacyAskAiInterceptHref,
  readAskAiOverlay,
  readAskAiReturnPath,
  rememberAskAiReturnPath,
} from "@/lib/ask-ai-overlay";
import { canRenderAskGlobeeLanding, type MessagesSurface } from "@/lib/ask-globee";
import type { AskGlobeeHistoryRow, AskGlobeeStoredMessage } from "@/lib/ask-globee-conversations";
import { loadAskAiOverlay } from "@/app/(app)/messages/ask-globee-actions";
import { parseWorkspaceCookie } from "@/lib/workspace";
import { DIALOG_HEADER_CLASS } from "@/components/ui/dialog";
import { APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
import { AccessUpgradeGate } from "@/components/messages/access-upgrade-gate";
import { AskGlobeeLanding } from "@/components/messages/ask-globee-landing";
import { AskGlobeeThread } from "@/components/messages/ask-globee-thread";
import { AskAssistantChromeProvider } from "@/components/messages/ask-globee-chrome";
import { Close44 } from "./house";
import { HouseAiMark } from "./house-ai-mark";
import { MessagesAppHeader } from "./messages-app-header";

type AskAiOverlayContextValue = {
  open: boolean;
  expanded: boolean;
  threadId: string | null;
  openAskAi: (threadId?: string | null) => void;
  closeAskAi: () => void;
  toggleAskAiExpanded: () => void;
};

const AskAiOverlayContext = createContext<AskAiOverlayContextValue>({
  open: false,
  expanded: false,
  threadId: null,
  openAskAi: () => {},
  closeAskAi: () => {},
  toggleAskAiExpanded: () => {},
});

export function useAskAiOverlay() {
  return useContext(AskAiOverlayContext);
}

function workspaceCookieMode(): ReturnType<typeof parseWorkspaceCookie> {
  if (typeof document === "undefined") return "aggregation";
  const match = document.cookie.match(/(?:^|; )24frame_workspace=([^;]*)/);
  return parseWorkspaceCookie(match?.[1] ? decodeURIComponent(match[1]) : null);
}

const NOOP_ASK_AI: AskAiOverlayContextValue = {
  open: false,
  expanded: false,
  threadId: null,
  openAskAi: () => {},
  closeAskAi: () => {},
  toggleAskAiExpanded: () => {},
};

export function AskAiOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AskAiOverlayContext.Provider value={NOOP_ASK_AI}>{children}</AskAiOverlayContext.Provider>}>
      <AskAiOverlayBound>{children}</AskAiOverlayBound>
    </Suspense>
  );
}

function AskAiOverlayBound({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const url = readAskAiOverlay(searchParams);

  useEffect(() => {
    rememberAskAiReturnPath(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isLegacyAskAiPath(pathname)) return;
    const fallback = legacyAskAiFallbackPath(workspaceCookieMode());
    const href = legacyAskAiInterceptHref({
      threadId: url.threadId ?? searchParams.get("thread"),
      returnPath: readAskAiReturnPath(fallback),
      workspace: workspaceCookieMode(),
    });
    router.replace(href);
  }, [pathname, router, searchParams, url.threadId]);

  const openAskAi = useCallback(
    (threadId?: string | null) => {
      if (isLegacyAskAiPath(pathname)) return;
      router.push(askAiOverlayHref(pathname, searchParams, threadId));
    },
    [pathname, router, searchParams],
  );

  const closeAskAi = useCallback(() => {
    setExpanded(false);
    router.replace(askAiCloseHref(pathname, searchParams));
  }, [pathname, router, searchParams]);

  const toggleAskAiExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      open: url.open && !isLegacyAskAiPath(pathname),
      expanded,
      threadId: url.threadId,
      openAskAi,
      closeAskAi,
      toggleAskAiExpanded,
    }),
    [closeAskAi, expanded, openAskAi, pathname, toggleAskAiExpanded, url.open, url.threadId],
  );

  return (
    <AskAiOverlayContext.Provider value={value}>
      {children}
      <AskAiOverlayPanel />
    </AskAiOverlayContext.Provider>
  );
}

function AskAiOverlayPanel() {
  const { open, expanded, threadId, closeAskAi, toggleAskAiExpanded } = useAskAiOverlay();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [surface, setSurface] = useState<MessagesSurface>("ask-globee-landing");
  const [initials, setInitials] = useState("?");
  const [conversations, setConversations] = useState<AskGlobeeHistoryRow[]>([]);
  const [conversation, setConversation] = useState<AskGlobeeHistoryRow | null>(null);
  const [messages, setMessages] = useState<AskGlobeeStoredMessage[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadAskAiOverlay(threadId).then((next) => {
      if (cancelled) return;
      setSurface(next.surface);
      setInitials(next.initials);
      setConversations(next.conversations);
      setConversation(next.conversation);
      setMessages(next.messages);
    });
    return () => {
      cancelled = true;
    };
  }, [open, threadId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const threadSurface: MessagesSurface =
    threadId && conversation ? "ask-globee-thread" : surface;
  const showThread = threadSurface === "ask-globee-thread" && conversation;
  const showLanding = canRenderAskGlobeeLanding(surface) && !showThread;
  const showGate = !canRenderAskGlobeeLanding(surface) && surface !== "staff-inbox";

  const body = open ? (
    <AskAssistantChromeProvider
      initialChrome={
        conversation
          ? { id: conversation.id, title: conversation.title, pinned_at: conversation.pinned_at, initials, messages }
          : null
      }
      initialConversations={conversations}
    >
      <div
        data-ask-ai-overlay-body=""
        className="flex min-h-0 flex-1 flex-col overflow-auto [&_[data-ask-globee-gate]]:min-h-0 [&_[data-ask-globee-landing]]:min-h-0 [&_[data-ask-globee-thread]]:min-h-0"
      >
        {showThread ? (
          <div data-ask-ai-overlay-thread-chrome="" className="shrink-0 px-[var(--space-4)] pt-[var(--space-2)]">
            <MessagesAppHeader surface="ask-globee-thread" />
          </div>
        ) : null}
        {showLanding ? <AskGlobeeLanding conversations={conversations} /> : null}
        {showThread ? (
          <AskGlobeeThread
            initials={initials}
            conversation={conversation}
            messages={messages}
            conversations={conversations}
          />
        ) : null}
        {showGate ? <AccessUpgradeGate /> : null}
      </div>
    </AskAssistantChromeProvider>
  ) : null;

  const chrome = (
    <div data-ask-ai-overlay-chrome="" className={cn(DIALOG_HEADER_CLASS, "shrink-0")}>
      <div className="flex min-w-0 items-center gap-[var(--space-3)]">
        <HouseAiMark className={ASK_AI_OVERLAY_MARK_CLASS} />
        <h2 className="t-heading text-ink">{ASK_AI_OVERLAY.dialog}</h2>
      </div>
      <div className="flex items-center gap-[var(--space-2)]">
        <button
          type="button"
          data-ask-ai-expand=""
          aria-pressed={expanded}
          aria-label={expanded ? ASK_AI_OVERLAY.collapse : ASK_AI_OVERLAY.expand}
          onClick={toggleAskAiExpanded}
          className="hidden size-[44px] items-center justify-center text-ink-3 md:flex"
        >
          {expanded ? (
            <ArrowsIn className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
          ) : (
            <ArrowsOut className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
          )}
        </button>
        <Close44 label={ASK_AI_OVERLAY.close} data-ask-ai-close="" onClick={closeAskAi} />
      </div>
    </div>
  );

  const phone = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ASK_AI_OVERLAY.dialog}
      data-ask-ai-overlay=""
      data-ask-ai-expanded="true"
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end md:hidden"
    >
      <button
        type="button"
        aria-label={ASK_AI_OVERLAY.close}
        className={APP_SHEET_SCRIM_CLASS}
        onClick={closeAskAi}
      />
      <div className={cn("relative z-10 bg-surface", ASK_AI_OVERLAY_PHONE_CLASS)}>
        {chrome}
        {body}
      </div>
    </div>
  ) : null;

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={closeAskAi}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeAskAi();
        }}
        aria-label={open ? ASK_AI_OVERLAY.dialog : undefined}
        data-ask-ai-overlay=""
        data-ask-ai-expanded={open && expanded ? "true" : undefined}
        hidden={!open}
        className={cn(
          "hidden max-md:hidden md:flex m-auto rounded-[var(--radius-lg)] border border-hairline bg-surface p-0 text-ink shadow-[var(--elevation)] backdrop:bg-black/40 backdrop:backdrop-blur-sm",
          expanded ? ASK_AI_OVERLAY_EXPANDED_CLASS : ASK_AI_OVERLAY_COMPACT_CLASS,
        )}
      >
        {open ? chrome : null}
        {body}
      </dialog>
      {phone && typeof document !== "undefined" ? createPortal(phone, document.body) : phone}
    </>
  );
}

type AskAiOpenButtonProps = ComponentProps<"button"> & {
  threadId?: string | null;
} & {
  [key: `data-${string}`]: string | undefined;
};

export function AskAiOpenButton({
  threadId,
  children,
  className,
  onClick,
  ...props
}: AskAiOpenButtonProps) {
  const { openAskAi } = useAskAiOverlay();
  return (
    <button
      {...props}
      type="button"
      data-ask-ai-open=""
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openAskAi(threadId);
      }}
    >
      {children}
    </button>
  );
}
