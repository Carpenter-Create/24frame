export const NEXT_PUBLIC_SUPABASE_URL_KEY: "NEXT_PUBLIC_SUPABASE_URL";
export const NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY";
export const EXPO_PUBLIC_APP_ORIGIN_KEY: "EXPO_PUBLIC_APP_ORIGIN";
export const PORTAL_BASE_URL_KEY: "PORTAL_BASE_URL";
export const REJECTED_DONOR_PROJECT_REF: "qxribdfzkvffambaartp";
export const DEFAULT_APP_ORIGIN: "https://app.24frame.co";

export function parseDotEnvPublicSupabase(text: string): {
  url: string;
  anonKey: string;
  appOrigin: string;
};
export function assertSurvivorSupabaseUrl(url: string): string;
export function resolveAppOrigin(raw: string | undefined): string;
export function resolveSurvivorPublicEnv(input: {
  processUrl?: string;
  processAnonKey?: string;
  processAppOrigin?: string;
  fileText?: string;
}): { url: string; anonKey: string; appOrigin: string };
export function survivorEnvReady(env: {
  url: string;
  anonKey: string;
  appOrigin: string;
}): boolean;
