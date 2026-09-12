import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

import { assertSurvivorSupabaseUrl, type SurvivorPublicEnv } from "./survivor-env";

export function extraSurvivorEnv(
  extra: { supabaseUrl?: unknown; supabaseAnonKey?: unknown } | undefined,
): SurvivorPublicEnv {
  return {
    url: typeof extra?.supabaseUrl === "string" ? extra.supabaseUrl : "",
    anonKey: typeof extra?.supabaseAnonKey === "string" ? extra.supabaseAnonKey : "",
  };
}

export function createMobileClient(env: SurvivorPublicEnv): SupabaseClient {
  const url = assertSurvivorSupabaseUrl(env.url);
  if (!url || !env.anonKey) {
    throw new Error("Survivor Supabase public env is not set.");
  }
  return createClient(url, env.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function readExpoSurvivorEnv(): SurvivorPublicEnv {
  return extraSurvivorEnv(Constants.expoConfig?.extra as { supabaseUrl?: unknown; supabaseAnonKey?: unknown });
}
