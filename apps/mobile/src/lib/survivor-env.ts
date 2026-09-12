export {
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  REJECTED_DONOR_PROJECT_REF,
  assertSurvivorSupabaseUrl,
  parseDotEnvPublicSupabase,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
} from "./survivor-env.cjs";

export type SurvivorPublicEnv = {
  url: string;
  anonKey: string;
};
