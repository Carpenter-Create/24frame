export const NEXT_PUBLIC_SUPABASE_URL_KEY: "NEXT_PUBLIC_SUPABASE_URL";
export const NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY";
export const REJECTED_DONOR_PROJECT_REF: "qxribdfzkvffambaartp";

export function parseDotEnvPublicSupabase(text: string): { url: string; anonKey: string };
export function assertSurvivorSupabaseUrl(url: string): string;
export function resolveSurvivorPublicEnv(input: {
  processUrl?: string;
  processAnonKey?: string;
  fileText?: string;
}): { url: string; anonKey: string };
export function survivorEnvReady(env: { url: string; anonKey: string }): boolean;
