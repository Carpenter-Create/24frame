"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { AskGlobeeHistoryRow, AskGlobeeStoredMessage } from "@/lib/ask-globee-conversations";

export type AskGlobeeChromeState = Pick<AskGlobeeHistoryRow, "id" | "title" | "pinned_at"> & {
  initials?: string;
  messages?: AskGlobeeStoredMessage[];
};

type AskGlobeeChromeContextValue = {
  chrome: AskGlobeeChromeState | null;
  setChrome: (next: AskGlobeeChromeState | null) => void;
  conversations: AskGlobeeHistoryRow[];
  setConversations: (next: AskGlobeeHistoryRow[]) => void;
  historyOpen: boolean;
  setHistoryOpen: Dispatch<SetStateAction<boolean>>;
};

const AskGlobeeChromeContext = createContext<AskGlobeeChromeContextValue>({
  chrome: null,
  setChrome: () => {},
  conversations: [],
  setConversations: () => {},
  historyOpen: false,
  setHistoryOpen: () => {},
});

export function AskAssistantChromeProvider({
  children,
  initialChrome = null,
  initialConversations = [],
}: {
  children: React.ReactNode;
  initialChrome?: AskGlobeeChromeState | null;
  initialConversations?: AskGlobeeHistoryRow[];
}) {
  const [chrome, setChrome] = useState<AskGlobeeChromeState | null>(initialChrome);
  const [conversations, setConversations] = useState<AskGlobeeHistoryRow[]>(initialConversations);
  const [historyOpen, setHistoryOpen] = useState(false);
  const value = useMemo(
    () => ({ chrome, setChrome, conversations, setConversations, historyOpen, setHistoryOpen }),
    [chrome, conversations, historyOpen],
  );
  return <AskGlobeeChromeContext.Provider value={value}>{children}</AskGlobeeChromeContext.Provider>;
}

export function useAskGlobeeChrome() {
  return useContext(AskGlobeeChromeContext);
}
