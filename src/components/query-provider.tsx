"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createAppQueryClient } from "@/lib/query-client";

// One App Query provider. Social pages must not mount a second client.

const AppQueryClientContext = createContext<QueryClient | null>(null);

export function useAppQueryClient(): QueryClient | null {
  return useContext(AppQueryClientContext);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createAppQueryClient);
  return (
    <AppQueryClientContext.Provider value={client}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AppQueryClientContext.Provider>
  );
}
