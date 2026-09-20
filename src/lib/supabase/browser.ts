import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

// Browser client for Realtime channels only. House list reads stay on
// server RPCs / actions. Do not add supabase.from here — P1-10 deleted
// the unused generic client.ts on that rule. Realtime is the reserved
// client slice.

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createBrowserSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase browser env is not set.");
  }
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}

export function resetBrowserSupabaseForTests() {
  client = null;
}
