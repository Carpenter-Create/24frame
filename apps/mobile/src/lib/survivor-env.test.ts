import { describe, expect, it } from "vitest";

import {
  DEFAULT_APP_ORIGIN,
  EXPO_PUBLIC_APP_ORIGIN_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  REJECTED_DONOR_PROJECT_REF,
  assertSurvivorSupabaseUrl,
  parseDotEnvPublicSupabase,
  resolveAppOrigin,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
} from "./survivor-env";

const SURVIVOR_URL = "https://uevsculwzwlhxeamagwg.supabase.co";

describe("survivor public env", () => {
  it("reads only the dashboard NEXT_PUBLIC_ names plus public app origin", () => {
    const parsed = parseDotEnvPublicSupabase(`
${NEXT_PUBLIC_SUPABASE_URL_KEY}=${SURVIVOR_URL}
${NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY}=anon-test
${EXPO_PUBLIC_APP_ORIGIN_KEY}=https://preview.24frame.co
EXPO_PUBLIC_SUPABASE_URL=https://${REJECTED_DONOR_PROJECT_REF}.supabase.co
`);
    expect(parsed).toEqual({
      url: SURVIVOR_URL,
      anonKey: "anon-test",
      appOrigin: "https://preview.24frame.co",
    });
  });

  it("prefers process NEXT_PUBLIC_ values and rejects the donor project", () => {
    const env = resolveSurvivorPublicEnv({
      processUrl: SURVIVOR_URL,
      processAnonKey: "anon-live",
      processAppOrigin: "https://app.24frame.co/",
      fileText: `${NEXT_PUBLIC_SUPABASE_URL_KEY}=https://example.supabase.co\n`,
    });
    expect(env).toEqual({
      url: SURVIVOR_URL,
      anonKey: "anon-live",
      appOrigin: "https://app.24frame.co",
    });
    expect(survivorEnvReady(env)).toBe(true);
    expect(() =>
      assertSurvivorSupabaseUrl(`https://${REJECTED_DONOR_PROJECT_REF}.supabase.co`),
    ).toThrow(/survivor project only/);
  });

  it("defaults the house-pipe origin to production app", () => {
    expect(resolveAppOrigin("")).toBe(DEFAULT_APP_ORIGIN);
    expect(DEFAULT_APP_ORIGIN).toBe("https://app.24frame.co");
  });
});
