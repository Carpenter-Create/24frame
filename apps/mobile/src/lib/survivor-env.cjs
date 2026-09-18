const NEXT_PUBLIC_SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const EXPO_PUBLIC_APP_ORIGIN_KEY = "EXPO_PUBLIC_APP_ORIGIN";
const PORTAL_BASE_URL_KEY = "PORTAL_BASE_URL";
const REJECTED_DONOR_PROJECT_REF = "qxribdfzkvffambaartp";
const DEFAULT_APP_ORIGIN = "https://app.24frame.co";

function parseDotEnvPublicSupabase(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (
      key !== NEXT_PUBLIC_SUPABASE_URL_KEY &&
      key !== NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY &&
      key !== EXPO_PUBLIC_APP_ORIGIN_KEY &&
      key !== PORTAL_BASE_URL_KEY
    ) {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return {
    url: values[NEXT_PUBLIC_SUPABASE_URL_KEY] ?? "",
    anonKey: values[NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY] ?? "",
    appOrigin: values[EXPO_PUBLIC_APP_ORIGIN_KEY] ?? values[PORTAL_BASE_URL_KEY] ?? "",
  };
}

function assertSurvivorSupabaseUrl(url) {
  if (url.includes(REJECTED_DONOR_PROJECT_REF)) {
    throw new Error("Mobile Auth uses the survivor project only. Donor project refs are rejected.");
  }
  return url;
}

function stripSlash(raw) {
  return raw.replace(/\/+$/, "");
}

function resolveAppOrigin(raw) {
  const value = stripSlash((raw ?? "").trim());
  if (!value) return DEFAULT_APP_ORIGIN;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function resolveSurvivorPublicEnv(input) {
  const fromFile = input.fileText
    ? parseDotEnvPublicSupabase(input.fileText)
    : { url: "", anonKey: "", appOrigin: "" };
  const url = (input.processUrl ?? "").trim() || fromFile.url;
  const anonKey = (input.processAnonKey ?? "").trim() || fromFile.anonKey;
  const appOrigin = resolveAppOrigin(
    (input.processAppOrigin ?? "").trim() || fromFile.appOrigin,
  );
  return {
    url: url ? assertSurvivorSupabaseUrl(url) : "",
    anonKey,
    appOrigin,
  };
}

function survivorEnvReady(env) {
  return env.url.length > 0 && env.anonKey.length > 0 && env.appOrigin.length > 0;
}

module.exports = {
  NEXT_PUBLIC_SUPABASE_URL_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_KEY,
  EXPO_PUBLIC_APP_ORIGIN_KEY,
  PORTAL_BASE_URL_KEY,
  REJECTED_DONOR_PROJECT_REF,
  DEFAULT_APP_ORIGIN,
  parseDotEnvPublicSupabase,
  assertSurvivorSupabaseUrl,
  resolveAppOrigin,
  resolveSurvivorPublicEnv,
  survivorEnvReady,
};
