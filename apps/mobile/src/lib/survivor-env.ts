export {
  DEFAULT_APP_ORIGIN,
  EXPO_PUBLIC_APP_ORIGIN_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  PORTAL_BASE_URL_KEY,
  REJECTED_DONOR_PROJECT_REF,
  assertSurvivorSupabaseUrl,
  parseDotEnvPublicSupabase,
  resolveAppOrigin,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
} from "./survivor-env.cjs";

export type SurvivorPublicEnv = {
  url: string;
  anonKey: string;
  appOrigin: string;
};
