import { describe, expect, it } from "vitest";

import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  REJECTED_DONOR_PROJECT_REF,
  assertSurvivorSupabaseUrl,
  parseDotEnvPublicSupabase,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
} from "./survivor-env";

const SURVIVOR_URL = "https://uevsculwzwlhxeamagwg.supabase.co";

describe("survivor public env", () => {
  it("reads only the dashboard NEXT_PUBLIC_ names", () => {
    const parsed = parseDotEnvPublicSupabase(`
${NEXT_PUBLIC_SUPABASE_URL_KEY}=${SURVIVOR_URL}
${NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY}=anon-test
EXPO_PUBLIC_SUPABASE_URL=https://${REJECTED_DONOR_PROJECT_REF}.supabase.co
`);
    expect(parsed).toEqual({ url: SURVIVOR_URL, anonKey: "anon-test" });
  });

  it("prefers process NEXT_PUBLIC_ values and rejects the donor project", () => {
    const env = resolveSurvivorPublicEnv({
      processUrl: SURVIVOR_URL,
      processAnonKey: "anon-live",
      fileText: `${NEXT_PUBLIC_SUPABASE_URL_KEY}=https://example.supabase.co\n`,
    });
    expect(env).toEqual({ url: SURVIVOR_URL, anonKey: "anon-live" });
    expect(survivorEnvReady(env)).toBe(true);
    expect(() =>
      assertSurvivorSupabaseUrl(`https://${REJECTED_DONOR_PROJECT_REF}.supabase.co`),
    ).toThrow(/survivor project only/);
  });
});
